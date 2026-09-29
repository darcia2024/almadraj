import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowRight, CheckCircle2, Clock, ExternalLink, Loader2, LockKeyhole, X } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';

export type MayarCheckoutSession = {
  checkoutUrl: string;
  orderId: string;
  courseTitle: string;
  courseSlug: string;
  amount: number;
};

/** Pesan yang dikirim halaman /pembayaran/:id saat Mayar mengarahkan kembali di dalam popup. */
export const PAYMENT_RETURN_MESSAGE = 'almadraj:payment-return';

type OrderStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'failed' | string;

const POLL_MS = 4000;

const money = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);

export const MayarCheckoutModal = ({
  session,
  onClose,
  onNavigate,
}: {
  session: MayarCheckoutSession;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) => {
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const statusRef = useRef<OrderStatus>('pending');

  const checkStatus = useCallback(async () => {
    if (statusRef.current === 'paid') return;
    try {
      const sb = requireSupabase();
      const { data } = await sb.from('orders').select('status').eq('id', session.orderId).maybeSingle();
      const next = (data?.status || 'pending') as OrderStatus;
      if (next !== statusRef.current) {
        statusRef.current = next;
        setStatus(next);
      }
    } catch {}
  }, [session.orderId]);

  // Pantau status order selama popup terbuka; webhook Mayar yang mengubahnya menjadi "paid".
  useEffect(() => {
    void checkStatus();
    const timer = window.setInterval(() => void checkStatus(), POLL_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void checkStatus(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [checkStatus]);

  // Setelah bayar, Mayar mengarahkan iframe ke /pembayaran/:id milik kita; halaman itu memberi kabar ke sini.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === PAYMENT_RETURN_MESSAGE) void checkStatus();
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [checkStatus]);

  // Kunci scroll halaman di belakang popup, dan Esc untuk menutup.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    if (status !== 'paid') return;
    const colors = ['#006d77', '#83c5be', '#f2b84b', '#ffffff'];
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.55 }, colors, zIndex: 400 });
    window.setTimeout(() => confetti({ particleCount: 60, spread: 110, origin: { y: 0.5 }, colors, zIndex: 400 }), 250);
  }, [status]);

  const paid = status === 'paid';
  const expired = status === 'expired' || status === 'cancelled' || status === 'failed';

  return createPortal(
      <motion.div
        className="fixed inset-0 z-[300] flex items-end justify-center bg-[#0b1f19]/55 backdrop-blur-sm sm:items-center sm:p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-label="Pembayaran kelas"
          className="relative flex h-[94dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_30px_80px_rgba(8,32,26,0.35)] sm:h-[min(88dvh,860px)] sm:max-w-[520px] sm:rounded-[28px]"
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        >
          {/* Grab handle (mobile) */}
          <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
            <span className="h-1.5 w-11 rounded-full bg-[#d6e2da]" />
          </div>

          {/* Header */}
          <header className="flex items-start gap-3 border-b border-[#e4eee8] px-5 pb-4 pt-3 sm:pt-5">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f4f2] text-[#006d77]">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#006d77]">Pembayaran aman</p>
              <h2 className="mt-0.5 line-clamp-1 text-[15px] font-semibold text-[#17231b]">{session.courseTitle}</h2>
              <p className="mt-0.5 text-sm font-bold text-[#006d77]">{money(session.amount)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup pembayaran"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[#607568] transition hover:bg-[#eef4f0] hover:text-[#17231b]"
            >
              <X className="h-[18px] w-[18px]" />
            </button>
          </header>

          {/* Body */}
          <div className="relative min-h-0 flex-1 bg-[#f7faf8]">
            {!paid && !expired && (
              <>
                {!frameLoaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-[#607568]">
                    <Loader2 className="h-6 w-6 animate-spin text-[#006d77]" />
                    Menyiapkan halaman pembayaran...
                  </div>
                )}
                <iframe
                  src={session.checkoutUrl}
                  title="Pembayaran Mayar"
                  onLoad={() => setFrameLoaded(true)}
                  allow="payment; clipboard-write"
                  referrerPolicy="strict-origin-when-cross-origin"
                  className={'h-full w-full border-0 bg-white transition-opacity duration-300 ' + (frameLoaded ? 'opacity-100' : 'opacity-0')}
                />
              </>
            )}

            {paid && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <motion.span
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                  className="grid h-20 w-20 place-items-center rounded-full bg-[#006d77] text-white shadow-[0_18px_40px_rgba(0,109,119,0.3)]"
                >
                  <CheckCircle2 className="h-10 w-10" />
                </motion.span>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.01em] text-[#17231b]">Pembayaran berhasil!</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[#607568]">
                  Akses <strong className="text-[#17231b]">{session.courseTitle}</strong> sudah aktif. Selamat belajar, semoga berkah.
                </p>
                <button
                  type="button"
                  onClick={() => { onClose(); onNavigate('/belajar/' + session.courseSlug); }}
                  className="mt-8 flex min-h-12 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-sm font-bold text-white shadow-[0_10px_22px_rgba(0,109,119,0.24)] transition hover:bg-[#00565e] active:scale-[0.98]"
                >
                  Mulai belajar sekarang <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {expired && (
              <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-[#fff1eb] text-[#b36d4c]">
                  <Clock className="h-8 w-8" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-[#17231b]">Waktu pembayaran habis</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[#607568]">Tutup jendela ini lalu tekan tombol beli lagi untuk membuat tagihan baru.</p>
                <button type="button" onClick={onClose} className="mt-6 min-h-11 rounded-full border border-[#cfe0d5] px-6 text-sm font-semibold text-[#315747] hover:bg-[#f2f7f4]">
                  Tutup
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {!paid && !expired && (
            <footer className="flex items-center justify-between gap-3 border-t border-[#e4eee8] bg-white px-5 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
              <span className="flex min-w-0 items-center gap-2 text-[11.5px] text-[#607568]">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#83c5be] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#006d77]" />
                </span>
                <span className="truncate">Menunggu pembayaran · kelas terbuka otomatis</span>
              </span>
              <a
                href={session.checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#cfe0d5] px-3 py-1.5 text-[11.5px] font-semibold text-[#006d77] transition hover:bg-[#eef6f3]"
                title="Pakai ini bila metode bayar perlu membuka aplikasi e-wallet"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Buka di tab baru
              </a>
            </footer>
          )}

          <p className="sr-only" aria-live="polite">{paid ? 'Pembayaran berhasil' : expired ? 'Waktu pembayaran habis' : ''}</p>
        </motion.section>
      </motion.div>,
    document.body,
  );
};

/**
 * Dipanggil saat aplikasi dimuat di dalam iframe popup pada halaman kembali dari Mayar.
 * Memberi tahu jendela induk lalu menampilkan layar kecil alih-alih seluruh aplikasi.
 */
export const isPaymentReturnInsidePopup = () => {
  if (typeof window === 'undefined' || window.self === window.top) return false;
  if (!window.location.pathname.startsWith('/pembayaran/')) return false;
  try {
    window.parent.postMessage(
      { type: PAYMENT_RETURN_MESSAGE, orderId: window.location.pathname.split('/')[2] || '' },
      window.location.origin,
    );
  } catch {}
  return true;
};

export const PaymentReturnInPopup = () => (
  <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-3 bg-white px-6 text-center font-sans text-[#17231b]">
    <Loader2 className="h-7 w-7 animate-spin text-[#006d77]" />
    <p className="text-base font-semibold">Memverifikasi pembayaran...</p>
    <p className="max-w-xs text-sm text-[#607568]">Tunggu sebentar, kelasmu akan terbuka otomatis.</p>
  </main>
);
