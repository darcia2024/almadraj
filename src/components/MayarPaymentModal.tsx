import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Copy,
  CheckCheck,
  QrCode,
  Building2,
  CreditCard,
  ArrowRight,
  Clock,
  RefreshCw,
  BookOpen,
  User,
  Mail,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { CourseDetail, getCourseDetail, getCourseTutorName } from '../data/coursesDetailData';

export type PaymentTargetCourse = {
  id: string;
  title: string;
  price: string | number;
  faculty?: string;
  programType?: string;
  tutor?: string;
  lessons?: string;
};

interface MayarPaymentModalProps {
  course: PaymentTargetCourse;
  onClose: () => void;
  onSuccessRedirect?: (slug: string) => void;
}

type PaymentMethod = 'qris' | 'va_bsi' | 'va_bca';
type CheckoutStep = 'form' | 'payment' | 'success';

const IslamicPattern = () => (
  <svg
    className="pointer-events-none absolute -right-6 -top-6 h-36 w-36 text-[#006d77]/10"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.8"
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="46" strokeDasharray="2 3" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(0 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
    <circle cx="50" cy="50" r="28" />
    <circle cx="50" cy="50" r="14" strokeDasharray="1 2" />
  </svg>
);

export const MayarPaymentModal: React.FC<MayarPaymentModalProps> = ({
  course,
  onClose,
  onSuccessRedirect,
}) => {
  const detail: CourseDetail | undefined = getCourseDetail(course.id);
  const numericPrice = typeof course.price === 'number'
    ? course.price
    : detail?.price ?? (String(course.price).toLowerCase().includes('gratis') ? 0 : 200000);
  const isFree = numericPrice === 0;

  const [step, setStep] = useState<CheckoutStep>('form');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('qris');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins

  // Auto-generate invoice ref
  useEffect(() => {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    setOrderRef(`MYR-ALM-${new Date().getFullYear()}-${randomHex}`);
  }, []);

  // Pre-fill user profile if logged in
  useEffect(() => {
    try {
      const stored = localStorage.getItem('almadraj_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setFullName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setWhatsapp(u.phone);
      }
    } catch {
      // ignore
    }
  }, []);

  // Timer countdown on payment screen
  useEffect(() => {
    if (step !== 'payment') return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      alert('Mohon lengkapi nama dan alamat email.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (isFree) {
        saveEnrollmentLocally();
        setStep('success');
      } else {
        setStep('payment');
      }
    }, 500);
  };

  const handleConfirmPaid = () => {
    setIsProcessing(true);
    setTimeout(() => {
      saveEnrollmentLocally();
      setIsProcessing(false);
      setStep('success');
    }, 700);
  };

  const saveEnrollmentLocally = () => {
    try {
      const current = JSON.parse(localStorage.getItem('almadraj_enrollments') || '[]');
      if (!current.includes(course.id)) {
        current.push(course.id);
        localStorage.setItem('almadraj_enrollments', JSON.stringify(current));
      }
      if (!localStorage.getItem('almadraj_user')) {
        localStorage.setItem('almadraj_user', JSON.stringify({
          name: fullName || 'Mahasiswa Al Madraj',
          email: email || 'peserta@almadraj.com',
          phone: whatsapp,
        }));
      }
    } catch {
      // ignore
    }
  };

  const handleGoToRuangBelajar = () => {
    onClose();
    if (onSuccessRedirect) {
      onSuccessRedirect(course.id);
    } else {
      window.location.href = `/belajar/${course.id}`;
    }
  };

  const formattedPrice = isFree ? 'Gratis' : `Rp ${numericPrice.toLocaleString('id-ID')}`;
  const vaNumber = selectedMethod === 'va_bca' 
    ? '1280 0812 9384 2910' 
    : '9002 0812 8765 4321';

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#041c16]/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        aria-labelledby="mayar-checkout-title"
        className="relative flex max-h-[92dvh] w-full max-w-[500px] flex-col overflow-hidden rounded-t-[30px] border border-[#d6e7dc] bg-white shadow-[0_24px_70px_rgba(7,84,71,0.22)] sm:rounded-[26px]"
        initial={{ y: 24, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Top Header Bar */}
        <div className="relative flex items-center justify-between border-b border-[#e5efe8] bg-[#f9fcfa] px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#006d77] text-white shadow-xs">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[#143428]">
                  Pembayaran Resmi Al Madraj
                </span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#10b981]" />
              </div>
              <p className="flex items-center gap-1 text-[10.5px] font-medium text-[#4f6e5e]">
                <ShieldCheck className="h-3 w-3 text-[#006d77]" />
                Enkripsi Transaksi Aman &amp; Terverifikasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8e6dc] bg-white text-[#527060] transition-colors hover:border-[#006d77] hover:bg-[#edf6f1] hover:text-[#006d77]"
            aria-label="Tutup pop-up pembayaran"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 bg-white text-left">
          {/* Editorial Course Summary Card */}
          <div className="relative overflow-hidden rounded-2xl border border-[#d3e5da] bg-gradient-to-br from-[#f4f9f6] via-[#fbfdfc] to-[#eef6f1] p-4 sm:p-5 shadow-2xs">
            <IslamicPattern />
            <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#006d77]">
                  <Sparkles className="h-3 w-3 text-[#10b981]" />
                  <span>{course.faculty || 'Maddah Turats'} · {course.programType || 'Dars'}</span>
                </div>
                <h2 id="mayar-checkout-title" className="mt-1 text-sm sm:text-base font-bold text-[#143428] leading-snug">
                  {course.title}
                </h2>
                <p className="mt-1 text-xs text-[#5c7769]">
                  {`Pengajar: ${getCourseTutorName(course.id, course.tutor)}`}
                  {course.lessons ? ` · ${course.lessons}` : ''}
                </p>
              </div>

              <div className="rounded-xl border border-[#cde2d4] bg-white/90 px-3 py-2 text-left sm:text-right backdrop-blur-xs shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#759082]">
                  {isFree ? 'Akses' : 'Investasi'}
                </p>
                <p className="mt-0.5 text-base sm:text-lg font-bold text-[#006d77]">
                  {formattedPrice}
                </p>
              </div>
            </div>
          </div>

          {/* STEP 1: Form & Payment Method Selection */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Peserta Details Input Group */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77] mb-2">
                  1. Data Akun Belajar
                </p>
                <div className="space-y-2.5">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#739281]" />
                    <input
                      type="text"
                      required
                      placeholder="Nama Lengkap Peserta (untuk sertifikat)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-[#d2e2d7] bg-[#fbfdfc] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#143428] placeholder-[#819c8d] transition-all focus:border-[#006d77] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006d77]/15"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#739281]" />
                      <input
                        type="email"
                        required
                        placeholder="Email Aktif"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-xl border border-[#d2e2d7] bg-[#fbfdfc] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#143428] placeholder-[#819c8d] transition-all focus:border-[#006d77] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006d77]/15"
                      />
                    </div>
                    <div className="relative">
                      <Smartphone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[#739281]" />
                      <input
                        type="tel"
                        placeholder="No. WhatsApp (opsional)"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        className="w-full rounded-xl border border-[#d2e2d7] bg-[#fbfdfc] py-2.5 pl-10 pr-3.5 text-xs sm:text-sm font-medium text-[#143428] placeholder-[#819c8d] transition-all focus:border-[#006d77] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006d77]/15"
                      />
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-[#6b8577]">
                  * Akses materi & invoice otomatis dikirimkan ke email ini.
                </p>
              </div>

              {/* Payment Methods (Only for paid courses) */}
              {!isFree && (
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                      2. Pilih Metode Pembayaran Resmi
                    </p>
                    <span className="text-[11px] font-medium text-[#10b981]">
                      Verifikasi Realtime
                    </span>
                  </div>

                  <div className="space-y-2">
                    {/* Method 1: QRIS */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('qris')}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        selectedMethod === 'qris'
                          ? 'border-[#006d77] bg-[#edf7f1] shadow-2xs'
                          : 'border-[#d8e7dc] bg-[#fafcfb] hover:border-[#b4d4c1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          selectedMethod === 'qris' ? 'bg-[#006d77] text-white' : 'bg-[#e7f3ec] text-[#006d77]'
                        }`}>
                          <QrCode className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#143428]">
                              QRIS Instan
                            </span>
                            <span className="text-[10px] font-medium text-[#006d77]">
                              (Rekomendasi)
                            </span>
                          </div>
                          <p className="truncate text-[11px] text-[#5e7a6b]">
                            BCA, Mandiri, GoPay, OVO, ShopeePay, Dana
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'qris' ? 'border-[#006d77] bg-[#006d77]' : 'border-[#cbdad0]'
                      }`}>
                        {selectedMethod === 'qris' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* Method 2: BSI VA */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('va_bsi')}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        selectedMethod === 'va_bsi'
                          ? 'border-[#006d77] bg-[#edf7f1] shadow-2xs'
                          : 'border-[#d8e7dc] bg-[#fafcfb] hover:border-[#b4d4c1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          selectedMethod === 'va_bsi' ? 'bg-[#006d77] text-white' : 'bg-[#e7f3ec] text-[#006d77]'
                        }`}>
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#143428]">
                            BSI Virtual Account (Syariah)
                          </span>
                          <p className="truncate text-[11px] text-[#5e7a6b]">
                            Transfer nomor virtual account otomatis
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'va_bsi' ? 'border-[#006d77] bg-[#006d77]' : 'border-[#cbdad0]'
                      }`}>
                        {selectedMethod === 'va_bsi' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>

                    {/* Method 3: BCA VA */}
                    <button
                      type="button"
                      onClick={() => setSelectedMethod('va_bca')}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all ${
                        selectedMethod === 'va_bca'
                          ? 'border-[#006d77] bg-[#edf7f1] shadow-2xs'
                          : 'border-[#d8e7dc] bg-[#fafcfb] hover:border-[#b4d4c1] hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          selectedMethod === 'va_bca' ? 'bg-[#006d77] text-white' : 'bg-[#e7f3ec] text-[#006d77]'
                        }`}>
                          <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-[#143428]">
                            BCA Virtual Account
                          </span>
                          <p className="truncate text-[11px] text-[#5e7a6b]">
                            Transfer m-BCA / KlikBCA / ATM
                          </p>
                        </div>
                      </div>
                      <span className={`h-4 w-4 shrink-0 rounded-full border flex items-center justify-center ${
                        selectedMethod === 'va_bca' ? 'border-[#006d77] bg-[#006d77]' : 'border-[#cbdad0]'
                      }`}>
                        {selectedMethod === 'va_bca' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Price Breakdown Group */}
              <div className="rounded-xl border border-[#e4ede6] bg-[#f9fcfa] p-3 text-xs space-y-1.5">
                <div className="flex justify-between text-[#617d6f]">
                  <span>Biaya Materi Kajian</span>
                  <span>{formattedPrice}</span>
                </div>
                <div className="flex justify-between text-[#617d6f]">
                  <span>Biaya Layanan &amp; Administrasi</span>
                  <span className="font-semibold text-[#006d77]">Rp 0 (Disubsidi)</span>
                </div>
                <div className="border-t border-[#e2eee6] pt-1.5 flex justify-between font-bold text-[#143428]">
                  <span>Total Tagihan</span>
                  <span className="text-sm font-bold text-[#006d77]">{formattedPrice}</span>
                </div>
              </div>

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(7,84,71,0.24)] transition-all hover:bg-[#096353] active:scale-[0.99] disabled:opacity-75"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Menghubungkan Pembayaran...</span>
                  </>
                ) : isFree ? (
                  <>
                    <span>Aktifkan Kelas Gratis Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Lanjut ke Pembayaran ({formattedPrice})</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: Payment Display (QRIS / VA) */}
          {step === 'payment' && (
            <div className="mt-4 space-y-4">
              {/* Payment Countdown & Ref Header */}
              <div className="flex items-center justify-between rounded-xl bg-amber-50/90 border border-amber-200/80 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-1.5 text-amber-950 font-semibold">
                  <Clock className="h-3.5 w-3.5 text-amber-700" />
                  <span>Selesaikan dalam:</span>
                  <span className="font-mono font-bold text-amber-900">{formatTime(secondsRemaining)}</span>
                </div>
                <span className="font-mono text-[10.5px] text-[#6b8577]">
                  {orderRef}
                </span>
              </div>

              {selectedMethod === 'qris' ? (
                /* QRIS Card */
                <div className="rounded-2xl border-2 border-[#006d77]/25 bg-white p-5 text-center shadow-xs">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#006d77]">
                    <QrCode className="h-3.5 w-3.5" />
                    <span>Scan QRIS untuk Bayar</span>
                  </div>

                  {/* Elegant QRIS Frame */}
                  <div className="mx-auto mt-4 flex aspect-square w-52 sm:w-56 flex-col items-center justify-center rounded-2xl border-2 border-[#b5d6c2] bg-gradient-to-br from-white via-[#f7fbf8] to-[#edf7f2] p-4 shadow-inner relative">
                    <div className="absolute inset-2 border border-[#a2cfb2] rounded-xl flex flex-col items-center justify-center p-3 text-center">
                      <QrCode className="h-28 w-28 text-[#006d77]" />
                      <p className="mt-1 font-mono text-[10px] font-bold text-[#143428]">
                        AL MADRAJ EDU - OFFICIAL
                      </p>
                      <span className="mt-0.5 text-[9px] font-semibold text-[#5c7a6b]">
                        NMID: ID1020268849102
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs font-bold text-[#143428]">
                      Nominal: <span className="text-[#006d77] text-sm">{formattedPrice}</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#6b8577]">
                      Buka BCA Mobile, Livin, GoPay, OVO, ShopeePay, atau Dana lalu scan QR di atas.
                    </p>
                  </div>
                </div>
              ) : (
                /* Virtual Account Card */
                <div className="rounded-2xl border border-[#d6e7dc] bg-[#f8fcf9] p-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#143428]">
                      {selectedMethod === 'va_bsi' ? 'BSI Virtual Account' : 'BCA Virtual Account'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#006d77]">
                      Otomatis
                    </span>
                  </div>

                  <div className="mt-3 rounded-xl border border-[#d2e4d9] bg-white p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#759082]">
                      Nomor Virtual Account
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-mono text-base sm:text-lg font-bold tracking-wider text-[#143428]">
                        {vaNumber}
                      </span>
                      <button
                        onClick={() => handleCopy(vaNumber.replace(/\s+/g, ''))}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#cde0d5] bg-[#f5faf7] px-2.5 py-1 text-xs font-bold text-[#006d77] hover:bg-[#ebf6f0] transition"
                      >
                        {copied ? <CheckCheck className="h-3.5 w-3.5 text-[#10b981]" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-[#5e7c6e]">
                    <p>• Transfer nominal tepat: <strong>{formattedPrice}</strong></p>
                    <p>• Pembayaran diverifikasi otomatis secara realtime tanpa perlu upload bukti transfer.</p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Confirm & Simulator */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleConfirmPaid}
                  disabled={isProcessing}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-xs sm:text-sm font-bold text-white shadow-[0_4px_16px_rgba(7,84,71,0.22)] transition-all hover:bg-[#096353] active:scale-[0.99] disabled:opacity-75"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Memverifikasi Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#8ee3c1]" />
                      <span>Simulasi: Pembayaran Berhasil</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    onClick={() => setStep('form')}
                    className="font-semibold text-[#5a786a] hover:text-[#006d77] underline"
                  >
                    ← Ganti Metode Pembayaran
                  </button>
                  <span className="text-[11px] text-[#789586]">
                    Kirim ke: {email || 'Email'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Success / Access Granted */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f6ee] text-[#006d77] shadow-sm">
                <CheckCircle2 className="h-9 w-9 text-[#006d77]" />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  {isFree ? 'Akses Terbuka' : 'Pembayaran Sukses Dikonfirmasi'}
                </p>
                <h3 className="mt-2 text-xl font-bold text-[#143428]">
                  Alhamdulillah, Pendaftaran Berhasil!
                </h3>
                <p className="mx-auto mt-1.5 max-w-sm text-xs text-[#5a7668] leading-relaxed">
                  Akses untuk kelas <strong>{course.title}</strong> telah aktif di akun <strong>{email || 'kamu'}</strong>. Rekaman materi dan diktat muqarrar sudah dapat langsung dipelajari.
                </p>
              </div>

              <div className="rounded-xl border border-[#d6e7dc] bg-[#f8fcf9] p-3.5 text-xs text-left space-y-1">
                <div className="flex justify-between text-[#688577]">
                  <span>Nomor Referensi</span>
                  <span className="font-mono font-bold text-[#143428]">{orderRef}</span>
                </div>
                <div className="flex justify-between text-[#688577]">
                  <span>Status Akses</span>
                  <span className="font-bold text-[#006d77]">AKTIF SEUMUR HIDUP</span>
                </div>
                <div className="flex justify-between text-[#688577]">
                  <span>Peserta</span>
                  <span className="font-semibold text-[#143428]">{fullName || 'Mahasiswa Masisir'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={handleGoToRuangBelajar}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-sm font-bold text-white shadow-[0_4px_16px_rgba(7,84,71,0.25)] transition-all hover:bg-[#096353] active:scale-[0.99]"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Buka Ruang Belajar Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full text-xs font-semibold text-[#668273] hover:text-[#006d77] transition"
                >
                  Tutup Pop-up
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Security Footer */}
        <div className="border-t border-[#edf4ef] bg-[#f8fbf9] px-5 py-3 text-center text-[10.5px] text-[#718d7f]">
          <span className="inline-flex items-center justify-center gap-1.5">
            <Lock className="h-3 w-3 text-[#10b981]" />
            Enkripsi SSL 256-bit · Transaksi pembayaran aman &amp; verifikasi instan otomatis
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MayarPaymentModal;
