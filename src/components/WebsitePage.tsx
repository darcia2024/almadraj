import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  CirclePlay,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  ImageIcon,
  Lock,
  LockKeyhole,
  Mail,
  Menu,
  MoreHorizontal,
  Play,
  Quote,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  UsersRound,
  X,
  ExternalLink,
  Landmark,
  ScrollText,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { galleryPhotos, landingGalleryPhotos, GalleryPhoto, getCourseCoverImage } from '../data/galleryData';
import { GalleryLightboxModal } from './GalleryLightboxModal';
import { getCourseDetail, CourseDetail, getCourseTutorName } from '../data/coursesDetailData';
import { MayarPaymentModal } from './MayarPaymentModal';

type Faculty = 'Semua' | 'Syariah' | 'Ushuluddin' | 'Lughah Arabiyyah';
type ProgramType = 'Dars' | 'Bimbel';
type ProgramTypeFilter = 'Semua' | ProgramType;

type Program = {
  id: string;
  programType: ProgramType;
  faculty: Exclude<Faculty, 'Semua'>;
  title: string;
  description: string;
  tutor: string;
  details: string;
  lessons: string;
  price: string;
  tone: string;
  thumbnail?: string;
};

const fallbackPrograms: Program[] = [
  {
    id: 'kajian-fikih-matan-abi-syuja',
    programType: 'Dars',
    faculty: 'Syariah',
    title: 'Kajian Fikih Matan Abi Syuja',
    description: 'Kajian fikih dengan pembahasan bertahap yang bisa diikuti kembali sesuai ritme belajar.',
    tutor: 'Ustaz Alif Watra Sarajeva, Lc., Dipl.',
    details: '16 video tersedia, materi terus diperbarui',
    lessons: '25 pertemuan',
    price: 'Rp200.000',
    tone: 'bg-[#e4f8ee] text-[#0f8f6f]',
    thumbnail: '/courses/cover-fikih-matan-abi-syuja.png',
  },
  {
    id: 'kajian-aqidah-ithaf-al-murid',
    programType: 'Dars',
    faculty: 'Ushuluddin',
    title: 'Kajian Aqidah Ithaf al-Murid',
    description: 'Kajian aqidah berbasis kitab Ithaf al-Murid untuk membantu pembelajar memahami materi secara runtut.',
    tutor: 'Ustaz Ulul Albab Fatahillah, Lc., Dipl.',
    details: '15 video tersedia, materi terus diperbarui',
    lessons: '24 pertemuan',
    price: 'Rp240.000',
    tone: 'bg-[#edf9f5] text-[#168b77]',
    thumbnail: '/courses/cover-aqidah-ithaf-al-murid.png',
  },
  {
    id: 'kajian-tajwid-online',
    programType: 'Dars',
    faculty: 'Lughah Arabiyyah',
    title: 'Kajian Tajwid Online',
    description: 'Kajian tajwid online yang dapat diakses gratis untuk membantu memperbaiki bacaan secara bertahap.',
    tutor: 'Ustadz Ziyad Ayaturrahman, Lc., Dipl.',
    details: '3 video kajian gratis',
    lessons: '3 pertemuan',
    price: 'Gratis',
    tone: 'bg-[#e9f7f0] text-[#167a62]',
    thumbnail: '/courses/cover-tajwid-online.png',
  },
  {
    id: 'kajian-risalah-al-adudiyah',
    programType: 'Dars',
    faculty: 'Ushuluddin',
    title: "Kajian Risalah al-'Adudiyah",
    description: "Kajian gratis Risalah al-'Adudiyah untuk membuka akses pembelajaran ilmu Islam berbasis turats.",
    tutor: 'Ustaz Ulul Albab Fatahillah, Lc.',
    details: '3 video kajian gratis',
    lessons: '3 pertemuan',
    price: 'Gratis',
    tone: 'bg-[#f0f8f3] text-[#167a62]',
    thumbnail: '/courses/cover-risalah-al-adudiyah.png',
  },
  {
    id: 'kitab-hujjah-ahli-sunah-wal-jamaah',
    programType: 'Dars',
    faculty: 'Ushuluddin',
    title: "Kitab Hujjah Ahli Sunah wal Jama'ah",
    description: "Kajian gratis Kitab Hujjah Ahli Sunah wal Jama'ah dengan akses video yang bisa dipelajari kembali.",
    tutor: 'Ustaz Alif Watra Sarajeva, Lc., Dipl.',
    details: '6 video kajian gratis',
    lessons: '6 pertemuan',
    price: 'Gratis',
    tone: 'bg-[#e6f6ed] text-[#167a62]',
    thumbnail: '/courses/cover-hujjah-ahli-sunnah.png',
  },
];

const faqs = [
  { question: 'Al Madraj menyediakan program apa?', answer: 'Al Madraj adalah ruang belajar digital untuk dars ilmu Islam dan bimbel maddah kuliah Al-Azhar. Kamu bisa mengikuti kajian, pembahasan kitab, kelas materi, atau program persiapan imtihan sesuai kebutuhan.' },
  { question: 'Bagaimana pembayaran dan aktivasi aksesnya?', answer: 'Pembayaran tersedia melalui QRIS dan Virtual Account. Setelah pembayaran terkonfirmasi, akses program akan aktif otomatis di akun mahasiswa.' },
  { question: 'Apakah video bisa ditonton ulang?', answer: 'Bisa. Video dapat diputar ulang menjelang ujian dari Kairo maupun Indonesia, dengan watermark proteksi akun dan materi PDF pendamping.' },
  { question: 'Apakah ada bank soal atau rangkuman?', answer: 'Setiap program memiliki fasilitas yang berbeda. Detail video, PDF muqarrar, bank soal, dan latihan tercantum pada kartu program.' },
];

const testimonials = [
  {
    name: 'Muhammad Fatih Al-Azhari',
    initials: 'MF',
    role: 'Fakultas Syariah Islamiyyah (FSI)',
    university: 'Tingkat 3 · Darrasa, Kairo',
    tag: 'Masisir Kairo',
    course: 'Kajian Fikih Matan Abi Syuja',
    year: 'Masisir 2022',
    rating: 5,
    avatarColor: 'from-[#006d77] to-[#148369]',
    quote: 'Pembahasan muqarrar fikih per bab bikin saya jauh lebih gampang membedah ibarat kitab sebelum imtihan. Catatan faedah dan murojaah bersama mentor ngebantu banget pas belajar di Darrasa.',
  },
  {
    name: 'Hilman Syauqil Haq',
    initials: 'HS',
    role: 'Fakultas Ushuluddin (Tafsir & Hadits)',
    university: 'Tingkat 4 · Hay \'Asyir, Kairo',
    tag: 'Masisir Kairo',
    course: 'Kajian Aqidah Ithaf al-Murid',
    year: 'Masisir 2021',
    rating: 5,
    avatarColor: 'from-[#0a485c] to-[#157a99]',
    quote: 'Nggak lagi bingung mulai dari mana saat buka diktat muqarrar tebal. Alur syarah aqidah di Al Madraj runut dari penjelasan matan sampai takhrij dalil, sangat pas buat amunisi imtihan termin.',
  },
  {
    name: 'Nida Khairunnisa, Lc.',
    initials: 'NK',
    role: 'Fak. Dirasat Islamiyyah Banat (FDIA)',
    university: 'Alumni 2024 · Madinat Nashr, Kairo',
    tag: 'Alumni Kairo',
    course: 'Kajian Adab Mabahits Turats',
    year: 'Alumni Masisir',
    rating: 5,
    avatarColor: 'from-[#2e4735] to-[#456950]',
    quote: 'Ibarat sastra klasik dan kaidah balaghah yang sering muncul di lembar soal imtihan dibedah sangat tuntas. Ini platform dars digital pertama yang benar-benar memahami kebutuhan anak Masisir.',
  },
  {
    name: 'Faris Naufal As-Suyuthi',
    initials: 'FN',
    role: 'Fakultas Lughah Arabiyyah (FLA)',
    university: 'Tingkat 2 · Hay Tsamin, Kairo',
    tag: 'Masisir Kairo',
    course: 'Kelas Tajwid Al-Qawl As-Sadid',
    year: 'Masisir 2023',
    rating: 5,
    avatarColor: 'from-[#006d77] to-[#15805e]',
    quote: 'Talaqqi tajwidnya berasa seperti duduk langsung di halaqah masjid. Penjelasan makharijul huruf dan sanad matan Al-Qawl As-Sadid sangat sistematis, bisa disimak ulang kapan pun.',
  },
  {
    name: 'Ahmad Syakir Zulfikar',
    initials: 'AS',
    role: 'Peserta Bimbel Rumah Sinai',
    university: 'FSI Tingkat 2 · Darrasa, Kairo',
    tag: 'Bimbel Imtihan',
    course: 'Bimbel Imtihan Al-Azhar',
    year: 'Termin II 2024',
    rating: 5,
    avatarColor: 'from-[#094d40] to-[#187563]',
    quote: 'Pas minggu tenang imtihan, video rekaman materi dan rangkuman PDF di dashboard ini penyelamat banget. Nggak perlu lagi pusing nyari link rekaman tercecer di grup angkatan.',
  },
  {
    name: 'Zulfa Mumtazah Al-Hafizhah',
    initials: 'ZM',
    role: 'Persiapan Masuk Al-Azhar (Maba)',
    university: 'Belajar dari Jombang, Jawa Timur',
    tag: 'Calon Masisir',
    course: 'Dars Turats & Bahasa Arab Dasar',
    year: 'Maba 2025',
    rating: 5,
    avatarColor: 'from-[#1b4332] to-[#2d6a4f]',
    quote: 'Walaupun masih di Indonesia menunggu jadwal keberangkatan ke Kairo, saya sudah bisa adaptasi dengan muqarrar dan ritme belajar dars turats Al-Azhar. Akses webnya super cepat dan enteng di HP.',
  },
];

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
};


export const WebsitePage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>(fallbackPrograms);
  const [menuOpen, setMenuOpen] = useState(false);
  const [programType, setProgramType] = useState<ProgramTypeFilter>('Semua');
  const [faculty, setFaculty] = useState<Faculty>('Semua');
  const [query, setQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [paymentCourse, setPaymentCourse] = useState<Program | null>(null);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<GalleryPhoto | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase
      .from('courses')
      .select('slug,program_type,faculty,title,summary,tutor,duration,price')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active || error || !data?.length) return;
        setPrograms(data.map((course, index) => ({
          id: course.slug,
          programType: course.program_type === 'Bimbel' ? 'Bimbel' : 'Dars',
          faculty: (['Syariah', 'Ushuluddin', 'Lughah Arabiyyah'].includes(course.faculty) ? course.faculty : 'Ushuluddin') as Program['faculty'],
          title: course.title,
          description: course.summary,
          tutor: getCourseTutorName(course.slug, course.tutor),
          details: course.price === 0 ? 'Kajian gratis' : 'Akses materi pembelajaran',
          lessons: course.duration,
          price: course.price === 0 ? 'Gratis' : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(course.price),
          tone: ['bg-[#e4f8ee] text-[#0f8f6f]', 'bg-[#edf9f5] text-[#168b77]', 'bg-[#e9f7f0] text-[#167a62]'][index % 3],
          thumbnail: getCourseCoverImage(course.slug || course.title, course.faculty),
        })));
      });
    return () => { active = false; };
  }, []);

  const visiblePrograms = useMemo(
    () => programs.filter((program) => {
      const matchesType = programType === 'Semua' || program.programType === programType;
      const matchesFaculty = faculty === 'Semua' || program.faculty === faculty;
      const haystack = `${program.title} ${program.faculty} ${program.description} ${program.tutor}`.toLowerCase();
      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase().trim());
      return matchesType && matchesFaculty && matchesQuery;
    }),
    [faculty, programType, query, programs],
  );


  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="website-page min-h-[100dvh] overflow-x-hidden bg-white font-sans text-[#17231b]">
      <a href="#content" className="fixed left-3 top-3 z-[70] -translate-y-24 rounded-full bg-[#247d48] px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus:translate-y-0">Lewati ke konten</a>

      <header className="sticky top-0 z-50 w-full border-b border-[#e6efe9] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1320px] items-center justify-between px-4 sm:px-8 lg:px-10">
          {/* Logo Brand */}
          <a href="#top" onClick={closeMenu} className="flex items-center gap-2.5 py-2">
            <img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-8 w-10 object-contain" />
            <span className="text-[15px] font-bold tracking-tight text-[#006d77]">Al Madraj</span>
          </a>

          {/* Desktop Navigation Links - Sederhana & Bersih */}
          <nav aria-label="Navigasi website" className="hidden items-center gap-7 text-[13.5px] font-medium text-[#4c6657] md:flex">
            <a href="#katalog" className="transition-colors hover:text-[#006d77]">Katalog</a>
            <a href="/buku" className="transition-colors hover:text-[#006d77]">Buku &amp; Kitab</a>
            <a href="/profil" className="transition-colors hover:text-[#006d77]">Tentang Kami</a>
            <a href="#faq" className="transition-colors hover:text-[#006d77]">FAQ</a>
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden items-center gap-4 md:flex">
            <a href="/login?next=/kelas" className="text-[13.5px] font-semibold text-[#4c6657] transition-colors hover:text-[#006d77]">
              Masuk
            </a>
            <a
              href="/login?next=/kelas"
              className="inline-flex items-center justify-center rounded-full bg-[#006d77] px-4 py-2 text-[13px] font-bold text-white shadow-xs transition hover:bg-[#00565e]"
            >
              Mulai Belajar
            </a>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6e7dc] bg-[#f5fbf7] text-[#006d77] transition hover:bg-[#eaf4ee] md:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown - Simpel & Rapi */}
        {menuOpen && (
          <nav className="border-t border-[#e6efe9] bg-white px-5 py-4 shadow-lg md:hidden">
            <div className="grid gap-1 text-sm font-medium text-[#315243]">
              <a onClick={closeMenu} href="#katalog" className="rounded-xl px-3 py-2.5 transition hover:bg-[#f0f7f3] hover:text-[#006d77]">
                Katalog Program
              </a>
              <a onClick={closeMenu} href="/buku" className="rounded-xl px-3 py-2.5 transition hover:bg-[#f0f7f3] hover:text-[#006d77]">
                Buku &amp; Kitab
              </a>
              <a onClick={closeMenu} href="/profil" className="rounded-xl px-3 py-2.5 transition hover:bg-[#f0f7f3] hover:text-[#006d77]">
                Tentang Kami
              </a>
              <a onClick={closeMenu} href="#faq" className="rounded-xl px-3 py-2.5 transition hover:bg-[#f0f7f3] hover:text-[#006d77]">
                FAQ
              </a>
              <div className="my-2 border-t border-[#eaf2ec]" />
              <div className="flex flex-col gap-2 pt-1">
                <a
                  onClick={closeMenu}
                  href="/login?next=/kelas"
                  className="flex items-center justify-center rounded-xl border border-[#cfe0d6] py-2.5 text-xs font-bold text-[#006d77] transition hover:bg-[#f0f7f3]"
                >
                  Masuk ke Akun
                </a>
                <a
                  onClick={closeMenu}
                  href="/login?next=/kelas"
                  className="flex items-center justify-center rounded-xl bg-[#006d77] py-2.5 text-xs font-bold text-white transition hover:bg-[#00565e]"
                >
                  Mulai Belajar
                </a>
              </div>
            </div>
          </nav>
        )}
      </header>

      <main id="content">
        <section id="top" className="relative isolate overflow-hidden bg-gradient-to-b from-white via-[#f4faf7] to-[#d6ede2] sm:bg-none sm:bg-[#eef8f2] px-4 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
          {/* Mobile Illustration: Subtle architectural silhouette anchored at bottom */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-44 sm:hidden -z-0 bg-cover bg-[bottom_center] opacity-25"
            style={{
              backgroundImage: "url('/al-madraj-header.png')",
              maskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.45) 45%, transparent 100%)'
            }}
            aria-hidden="true"
          />

          {/* Desktop Illustration */}
          <div
            className="pointer-events-none absolute inset-y-0 right-0 -z-0 hidden w-full sm:w-[75%] lg:w-[70%] bg-cover bg-right opacity-70 sm:block"
            style={{
              backgroundImage: "url('/al-madraj-header.png')",
              maskImage: 'linear-gradient(90deg, transparent 0%, transparent 15%, black 50%, black 100%)',
              WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, transparent 15%, black 50%, black 100%)'
            }}
            aria-hidden="true"
          />

          {/* Full-width seamless horizontal fade (eliminates sharp vertical edges) */}
          <div
            className="pointer-events-none absolute inset-0 -z-0 hidden sm:block"
            style={{
              background: 'linear-gradient(90deg, #eef8f2 0%, #eef8f2 35%, rgba(238,248,242,0.88) 55%, rgba(238,248,242,0.2) 80%, rgba(238,248,242,0) 100%)'
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 mx-auto grid max-w-[1320px] items-center gap-6 lg:grid-cols-[.95fr_1.05fr] lg:gap-12">
            <motion.div {...reveal} className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#247d48]">Ruang belajar Masisir</p><h1 className="mt-6 max-w-3xl text-[clamp(2.8rem,5.3vw,5.8rem)] font-normal leading-[0.9] tracking-[-0.04em] text-[#006d77]">Selamat datang di <span className="whitespace-nowrap font-semibold">Al Madraj.</span></h1><p className="mt-6 max-w-xl text-[15px] leading-6 text-[#557064] sm:text-lg sm:leading-7">Tempat belajar ilmu Islam dengan alur yang lebih terarah.</p><p className="mt-3 max-w-xl text-[15px] leading-6 text-[#557064] sm:text-lg sm:leading-7">Ruang belajar digital untuk dars ilmu Islam dan bimbel maddah kuliah Al-Azhar. Ikuti kajian, pahami materi, ulangi pembahasan, dan siapkan imtihan dalam satu tempat.</p><div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href="/login?next=/kelas" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-sm font-bold text-white shadow-[0_8px_20px_rgba(2,118,128,0.16)] hover:bg-[#00565e]">Mulai belajar <ArrowUpRight className="h-4 w-4" /></a><a href="#katalog" className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b9d9c5] bg-white/90 px-6 text-sm font-semibold text-[#315f52] hover:border-[#006d77]"><BookOpen className="h-4 w-4" />Lihat program</a></div><div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#557064]"><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#006d77]" />Dars ilmu Islam</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#006d77]" />Video dan materi</span><span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#006d77]" />Progress tersimpan</span></div></motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="mx-auto w-full max-w-[360px] sm:max-w-[430px] lg:max-w-[520px]" aria-label="Preview dashboard mahasiswa Al Madraj"><DashboardMockup /></motion.div>
          </div>
        </section>

         <section id="katalog" className="scroll-mt-24 bg-gradient-to-b from-[#f9fcfb] via-white to-[#f4f9f6]/40 px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
           <div className="mx-auto max-w-[1320px]">
             <motion.div {...reveal} className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">
                    Katalog Program Pembelajaran
                  </p>
                  <h2 className="mt-4 text-3xl font-normal leading-[1.05] tracking-[-0.03em] text-[#0d2a20] sm:text-5xl lg:text-[54px]">
                   Cari dars atau bimbel <br className="hidden sm:inline" />
                   <span className="font-serif italic font-normal text-[#167a5b]">yang kamu butuhkan.</span>
                 </h2>
                 <p className="mt-4 text-sm leading-7 text-[#587365] sm:text-base">
                   Pilih Dars untuk kajian muqarrar turats ilmu Islam, atau Bimbel untuk pendampingan intensif persiapan imtihan Al-Azhar.
                 </p>
               </div>

               {/* Modern Filter Dock */}
               <div className="flex w-full flex-col gap-3 lg:max-w-lg">
                 {/* Search Bar */}
                 <label className="flex min-h-12 w-full items-center gap-3 rounded-full border border-[#cfe2d6] bg-white px-4 text-sm text-[#4d695b] shadow-[0_2px_12px_rgba(7,84,71,0.04)] transition-all focus-within:border-[#006d77] focus-within:ring-2 focus-within:ring-[#006d77]/10">
                   <Search className="h-4 w-4 shrink-0 text-[#167a5b]" />
                   <input
                     value={query}
                     onChange={(e) => setQuery(e.target.value)}
                     placeholder="Cari maddah, kitab, atau tutor..."
                     className="min-w-0 flex-1 bg-transparent text-[#133227] outline-none placeholder:text-[#9ab1a4]"
                   />
                   {query && (
                     <button
                       onClick={() => setQuery('')}
                       className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e3efe7] text-[10px] text-[#557263] hover:bg-[#d5e8dc]"
                       title="Hapus pencarian"
                     >
                       <X className="h-3 w-3" />
                     </button>
                   )}
                 </label>

                 {/* Program Type Segmented Tabs */}
                 <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#d6e7dc] bg-[#eef7f2]/80 p-1.5 backdrop-blur-xs">
                   {(['Semua', 'Dars', 'Bimbel'] as ProgramTypeFilter[]).map((item) => (
                     <button
                       key={item}
                       onClick={() => setProgramType(item)}
                       aria-pressed={programType === item}
                       className={`flex-1 min-h-9 rounded-xl px-3 py-1 text-xs font-bold transition-all duration-200 ${
                         programType === item
                           ? 'bg-[#006d77] text-white shadow-sm'
                           : 'text-[#587365] hover:bg-white/60 hover:text-[#006d77]'
                       }`}
                     >
                       {item === 'Semua' ? 'Semua Program' : item === 'Dars' ? 'Dars Turats' : 'Bimbel Imtihan'}
                     </button>
                   ))}
                 </div>

                 {/* Faculty Pills */}
                 <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Pilih fakultas">
                   {(['Semua', 'Syariah', 'Ushuluddin', 'Lughah Arabiyyah'] as Faculty[]).map((item) => {
                     const active = faculty === item;
                     return (
                       <button
                         key={item}
                         onClick={() => setFaculty(item)}
                         aria-pressed={active}
                         className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                           active
                             ? 'border border-[#006d77] bg-[#006d77] text-white shadow-xs'
                             : 'border border-[#cfe0d5] bg-white text-[#587365] hover:border-[#006d77] hover:text-[#006d77]'
                         }`}
                       >
                         {item !== 'Semua' && (
                           <span
                             className={`h-1.5 w-1.5 rounded-full ${
                               item === 'Syariah'
                                 ? 'bg-[#22c55e]'
                                 : item === 'Ushuluddin'
                                 ? 'bg-[#38bdf8]'
                                 : 'bg-[#84cc16]'
                             }`}
                           />
                         )}
                         {item === 'Semua' ? 'Semua Fakultas' : item}
                       </button>
                     );
                   })}
                 </div>
               </div>
             </motion.div>

              {/* Course Grid (Maksimal 3 Kelas di Landing Page) */}
              {visiblePrograms.length ? (
                <>
                  <div className="mt-8 grid grid-cols-2 gap-2.5 sm:gap-5 lg:grid-cols-3">
                    {visiblePrograms.slice(0, 6).map((program, index) => (
                      <ProgramCard
                        key={program.id}
                        program={program}
                        index={index}
                        onOpen={() => setSelectedProgram(program)}
                      />
                    ))}
                  </div>

                  {/* Banner Arahkan ke Katalog Lengkap */}
                  <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-[20px] border border-[#d6e7dc] bg-gradient-to-r from-[#eef8f2] via-white to-[#edf7f1] p-5 sm:flex-row sm:px-6 sm:py-4.5">
                    <div className="text-center sm:text-left">
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#006d77]">
                        Katalog Program Al Madraj
                      </p>
                      <h4 className="mt-0.5 text-sm sm:text-[15px] font-bold text-[#143428]">
                        Ingin melihat semua dars dan bimbel lainnya?
                      </h4>
                      <p className="mt-0.5 text-xs text-[#5c7767]">
                        Tersedia berbagai pilihan pembahasan muqarrar turats dan persiapan imtihan lengkap di katalog platform.
                      </p>
                    </div>
                    <a
                      href="/kelas"
                      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-[0_4px_12px_rgba(7,84,71,0.16)] transition-all duration-300 hover:bg-[#00565e] hover:shadow-[0_6px_18px_rgba(7,84,71,0.24)] active:scale-[0.98]"
                    >
                      <span>Jelajahi Semua di Katalog</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </>
              ) : (
               <div className="mt-12 rounded-[24px] border border-dashed border-[#b6d8c4] bg-[#f8fbf9] p-12 text-center">
                 <BookOpen className="mx-auto h-8 w-8 text-[#167a5b]" />
                 <h3 className="mt-4 text-lg font-bold text-[#143428]">
                   {query ? `Tidak ada kelas yang cocok dengan "${query}"` : 'Belum ada program untuk filter ini.'}
                 </h3>
                 <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5c7567]">
                   Coba ganti kata kunci pencarian atau reset filter untuk melihat semua dars dan bimbel yang tersedia.
                 </p>
                 <button
                   onClick={() => { setQuery(''); setProgramType('Semua'); setFaculty('Semua'); }}
                   className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#006d77] bg-white px-4 py-2 text-xs font-bold text-[#006d77] hover:bg-[#006d77] hover:text-white transition-colors"
                 >
                   Reset Semua Filter
                 </button>
               </div>
             )}
           </div>
         </section>

          <section id="ruang-mahasiswa" className="scroll-mt-24 border-y border-[#dce9df] bg-[#edf7ef] px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><motion.div {...reveal}><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">Ruang belajar Masisir</p><h2 className="mt-4 max-w-xl text-2xl sm:text-4xl lg:text-5xl font-semibold sm:font-normal leading-snug sm:leading-[1.05] tracking-tight">Semua dars dan kelasmu, <span className="text-[#247d48]">satu tempat.</span></h2><p className="mt-6 max-w-xl text-sm sm:text-base leading-relaxed sm:leading-7 text-[#5d7464]">Nggak perlu lagi bongkar chat, cari link lama, atau lupa terakhir belajar sampai bab mana. Semua kajian, kelas, dan progress belajarmu tersimpan di satu akun.</p><div className="mt-7 grid gap-3 text-sm text-[#315747]"><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#006d77]" />Dars dan kelasmu tersimpan di satu dashboard.</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#006d77]" />Lanjut langsung dari materi terakhir.</p><p className="flex items-center gap-3"><Check className="h-4 w-4 text-[#006d77]" />Pantau progress belajar sesuai ritmemu.</p></div><button onClick={() => setSelectedProgram(programs[0])} className="mt-8 flex min-h-11 items-center gap-2 rounded-full border border-[#9cc8a6] px-5 text-sm font-bold text-[#247d48] hover:border-[#247d48]">Lihat ruang belajar <ArrowUpRight className="h-4 w-4" /></button></motion.div><motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }}><CatalogDashboardMockup /></motion.div></div></section>

          <section id="realita" className="scroll-mt-24 border-y border-[#dce9df] bg-[#f7fbf8] px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto max-w-[1320px]"><div className="max-w-2xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">Belajar lebih terarah</p><h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-semibold sm:font-normal leading-snug sm:leading-[1.05] tracking-tight">Ilmu banyak, tidak harus bingung mulai dari mana.</h2><p className="mt-5 text-sm sm:text-base leading-relaxed sm:leading-7 text-[#5d7464]">Dars, kitab, dan materi kuliah bisa terasa padat ketika semuanya berjalan bersamaan. Al Madraj membantu menyusun proses belajar menjadi lebih terarah, dari mengikuti pembahasan sampai mengulang materi yang masih perlu dikuatkan.</p></div><div className="mt-12 grid gap-0 lg:grid-cols-3"><Feature icon={BookOpen} title="Pembahasan yang runtut" text="Setiap program disusun dengan alur yang membantu kamu mengikuti materi dari awal." /><Feature icon={CirclePlay} title="Belajar sesuai ritme" text="Video dan materi dapat dipelajari kembali kapan pun kamu membutuhkan pengulangan." /><Feature icon={ShieldCheck} title="Progress yang tersimpan" text="Tandai materi yang sudah dipelajari dan kembali lagi tanpa kehilangan jejak." /></div></div></section>

          <section id="cara-belajar" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">Cara belajar</p><h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-semibold sm:font-normal leading-snug sm:leading-[1.05] tracking-tight">Mulai dari program yang kamu butuhkan.</h2></div><div className="border-t border-[#dce9df]"><FlowStep number="01" title="Pilih program" text="Temukan Dars atau Bimbel sesuai kebutuhan belajarmu." /><FlowStep number="02" title="Ikuti pembahasan" text="Pelajari materi secara bertahap dengan alur yang lebih jelas." /><FlowStep number="03" title="Pantau progress" text="Lanjutkan materi terakhir tanpa kehilangan jejak belajar." /><FlowStep number="04" title="Ulangi saat perlu" text="Kembali ke materi penting dan kuatkan pemahamanmu." /></div></div></section>

           <section id="tentang-kami" className="scroll-mt-24 border-y border-[#dce9df] bg-white px-5 py-14 text-center sm:px-8 sm:py-24 lg:px-10">
            <div className="mx-auto max-w-[1320px]">
              <div className="mx-auto max-w-3xl">
                <p className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">
                  <BookOpen className="h-4 w-4" />Tentang Al Madraj
                </p>
                <h2 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-semibold sm:font-normal leading-snug sm:leading-[1.1] tracking-tight text-[#143428]">
                  Ruang belajar ilmu Islam untuk ritme pembelajar masa kini.
                </h2>
                <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-lg leading-relaxed sm:leading-8 text-[#315747]">
                  Al Madraj adalah platform dakwah dan pendidikan Islam yang menghadirkan Dars, kajian, dan bimbel untuk membantu pembelajar memahami ilmu dengan lebih terarah.
                </p>
              </div>

              <div className="mx-auto mt-10 grid max-w-[1120px] gap-3 text-left sm:grid-cols-3">
                <ProfilePreviewItem icon={CalendarDays} title="Didirikan 2023" text="Berangkat dari alumni Rumah Syariah Mesir Angkatan ke-7." />
                <ProfilePreviewItem icon={BookOpen} title="Dakwah dan pendidikan" text="Kajian turats dan konten keislaman melalui ruang digital." />
                <ProfilePreviewItem icon={UsersRound} title="Untuk pembelajar" text="Kegiatan untuk mahasiswa dan pelajar di Mesir maupun Indonesia." />
              </div>

              <div className="mt-8">
                <a href="/profil" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#9cc8a6] px-5 text-sm font-bold text-[#006d77] hover:border-[#006d77] hover:bg-[#edf7ef] transition-colors">
                  Baca profil Al-Madraj <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>

              {/* Dokumentasi Otentik Ruang Belajar & Halaqah Masisir */}
              <div className="mx-auto mt-16 max-w-[1180px] text-left">
                <div className="flex flex-col gap-4 border-b border-[#e1ece4] pb-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">
                      Dokumentasi Kegiatan
                    </p>
                    <h3 className="mt-3 text-2xl font-bold tracking-tight text-[#143428] sm:text-3xl">
                      Suasana Nyata Halaqah &amp; Bimbel di Kairo
                    </h3>
                    <p className="mt-1.5 text-sm text-[#587365]">
                      Dokumentasi otentik kegiatan belajar, halaqah kitab, dan bimbingan imtihan mahasiswa Universitas Al-Azhar bersama Al Madraj.
                    </p>
                  </div>

                  <a
                    href="/profil#galeri"
                    className="inline-flex items-center gap-2 self-start rounded-full border border-[#b8d8c1] bg-[#f4f9f6] px-4 py-2.5 text-xs font-bold text-[#006d77] transition hover:bg-[#006d77] hover:text-white lg:self-end"
                  >
                    Lihat Semua Dokumentasi ({galleryPhotos.length} Foto) <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>

                {/* Photo Grid - 3 Foto Utama */}
                <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {landingGalleryPhotos.map((photo) => (
                    <motion.figure
                      key={photo.id}
                      onClick={() => setSelectedGalleryPhoto(photo)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedGalleryPhoto(photo);
                      }}
                      aria-label={`Buka foto ${photo.title}`}
                      className="group flex flex-col cursor-pointer overflow-hidden rounded-[22px] border border-[#d6e7dc] bg-[#f7fbf8] shadow-[0_4px_18px_rgba(7,84,71,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#8fd0aa] hover:shadow-[0_18px_38px_rgba(7,84,71,0.12)]"
                    >
                      {/* Foto Bersih */}
                      <div className="aspect-[4/3] w-full overflow-hidden bg-[#e5f2ea]">
                        <img
                          src={photo.src}
                          alt={photo.title}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                          loading="lazy"
                        />
                      </div>

                      {/* Konten & Deskripsi di Luar/Bawah Foto */}
                      <figcaption className="flex flex-1 flex-col p-4 text-left">
                        <p className="text-xs font-medium text-[#6c8677]">
                          {photo.location}
                        </p>

                        <h4 className="mt-1.5 line-clamp-1 text-sm font-bold text-[#143428] transition-colors group-hover:text-[#006d77]">
                          {photo.title}
                        </h4>

                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[#5c7567]">
                          {photo.description}
                        </p>
                      </figcaption>
                    </motion.figure>
                  ))}
                </div>

                {/* Banner Ajakan Buka Galeri Lengkap */}
                <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#d6e7dc] bg-[#f7fbf8] p-5 text-xs sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-[#143428] sm:text-sm">Arsip Dokumentasi Lengkap Al-Madraj</p>
                    <p className="mt-0.5 text-[#5c7567]">Lihat seluruh {galleryPhotos.length} foto kegiatan dars turats, pendampingan imtihan, dan ukhuwah Masisir di halaman profil.</p>
                  </div>
                  <a
                    href="/profil#galeri"
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-[#00565e]"
                  >
                    Buka Galeri Lengkap <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section id="faq" className="scroll-mt-24 border-t border-[#dce9df] px-5 py-16 sm:px-8 sm:py-24 lg:px-10"><div className="mx-auto grid max-w-[1320px] gap-10 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">Tentang Al Madraj</p><h2 className="mt-4 text-2xl sm:text-4xl lg:text-5xl font-semibold sm:font-normal leading-snug sm:leading-[1.05] tracking-tight">Sebelum<br />mulai belajar.</h2></div><div className="border-t border-[#dce9df]">{faqs.map((faq, index) => <div key={faq.question} className="border-b border-[#dce9df]"><button onClick={() => setOpenFaq(openFaq === index ? null : index)} aria-expanded={openFaq === index} className="flex min-h-16 w-full items-center justify-between gap-5 text-left text-sm font-semibold sm:text-base"><span>{faq.question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-[#247d48] transition-transform ${openFaq === index ? 'rotate-180' : ''}`} /></button><AnimatePresence initial={false}>{openFaq === index && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><p className="max-w-2xl pb-5 pr-8 text-sm leading-6 text-[#5d7464]">{faq.answer}</p></motion.div>}</AnimatePresence></div>)}</div></div></section>

          <section id="testimoni" className="scroll-mt-24 border-t border-[#dce9df] bg-[#f7fbf8] px-5 py-20 sm:px-8 sm:py-28 lg:px-10">
            <div className="mx-auto max-w-[1320px]">
              <motion.div {...reveal} className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#247d48]">
                  Cerita Dari Ruang Belajar
                </p>
                <h2 className="mt-4 text-3xl font-normal leading-[1.05] tracking-[-0.03em] text-[#0d2a20] sm:text-5xl lg:text-[54px]">
                  Belajar maddah terasa <br className="hidden sm:inline" />
                  <span className="font-serif italic font-normal text-[#167a5b]">lebih terarah &amp; bermakna.</span>
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#587365]">
                  Pengalaman otentik mahasiswa Universitas Al-Azhar Kairo dan pembelajar ilmu Islam yang telah merasakan pendampingan dars dan bimbel Al Madraj.
                </p>
              </motion.div>

              {/* Social Proof Trust Bar */}
              <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 rounded-2xl border border-[#d6e7dc] bg-white p-3 shadow-xs sm:grid-cols-3 sm:p-4 text-center">
                <div className="border-b sm:border-b-0 sm:border-r border-[#edf5f0] p-2">
                  <p className="text-xl font-bold text-[#006d77] sm:text-2xl">4.9 / 5.0</p>
                  <p className="mt-0.5 text-[11px] text-[#698576]">Kepuasan Pembelajar</p>
                </div>
                <div className="border-b sm:border-b-0 sm:border-r border-[#edf5f0] p-2">
                  <p className="text-xl font-bold text-[#006d77] sm:text-2xl">100%</p>
                  <p className="mt-0.5 text-[11px] text-[#698576]">Berbasis Muqarrar Turats</p>
                </div>
                <div className="p-2">
                  <p className="text-xl font-bold text-[#006d77] sm:text-2xl">98%</p>
                  <p className="mt-0.5 text-[11px] text-[#698576]">Rekomendasi Rekan</p>
                </div>
              </div>

              {/* Testimonial Cards Grid */}
              <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {testimonials.map((item, index) => (
                  <TestimonialCard key={item.name + index} item={item} index={index} />
                ))}
              </div>
            </div>
          </section>

      </main>

      {/* Full-width Footer with Header-Matching Background (#eef8f2) */}
      <footer className="relative w-full border-t border-[#cfe2d6] bg-[#eef8f2] px-5 pb-12 pt-16 sm:px-8 sm:pt-20 lg:px-12 text-[#133227]">
        {/* Topo Organic Wave Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <TopoBackgroundLines stroke="#006d77" className="opacity-[0.06]" />
        </div>

        {/* Overlapping Topo Asterisk Emblem */}
        <div className="absolute -top-11 sm:-top-14 left-1/2 -translate-x-1/2 z-20">
          <TopoAsteriskEmblem />
        </div>

        <div className="relative z-10 mx-auto max-w-[1360px]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.3fr_1.05fr] items-center gap-10 lg:gap-8">
            {/* Left Column: Contact, Social, & Accreditation Score */}
            <div className="flex flex-col justify-between space-y-5">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#006d77] tracking-wide">Contact</h3>
                <div className="mt-3 flex flex-wrap sm:flex-nowrap items-start justify-between gap-6">
                  {/* Address & Contacts */}
                  <div className="space-y-1 text-xs text-[#4d695b] leading-relaxed">
                    <p>Hay Asyir, Madinat Nasr</p>
                    <p>Kairo, Republik Arab Mesir</p>
                    <p>Tebet, Jakarta Selatan, ID</p>
                    <p className="pt-1 text-[#006d77] font-bold">+62 822-1111-2222</p>
                    <a href="mailto:admin@almadraj.com" className="block text-[#4d695b] hover:text-[#006d77] transition">
                      admin@almadraj.com
                    </a>
                  </div>

                  {/* Social Links Column */}
                  <nav className="space-y-2 shrink-0">
                    {[
                      ['Facebook', 'https://facebook.com'],
                      ['Instagram', 'https://instagram.com/almadraj_edu'],
                      ['LinkedIn', 'https://linkedin.com'],
                    ].map(([name, url]) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-[#4d695b] hover:text-[#006d77] transition-colors font-medium"
                      >
                        <span>{name}</span>
                        <ArrowUpRight className="h-3 w-3 text-[#167a5b]" />
                      </a>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Rating Score Pill & Country Badges */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/95 border border-[#cfe2d6] px-3 py-1 shadow-2xs">
                  <span className="rounded-md bg-[#006d77] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    4.9
                  </span>
                  <span className="text-[11px] font-semibold text-[#133227]">
                    Kepuasan Mahasiswa Al-Azhar
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-2 text-xs text-[#698576]">
                  <span title="Mesir">🇪🇬 Kairo</span>
                  <span>•</span>
                  <span title="Indonesia">🇮🇩 Indonesia</span>
                </div>
              </div>
            </div>

            {/* Center Column: Overlapping Logo, Brand Title, Subtitle, & Dual Pill Buttons */}
            <div className="text-center flex flex-col items-center justify-center -mt-2 lg:mt-0 px-2">
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-[#006d77] leading-tight">
                Al Madraj
              </h2>
              <p className="mt-1.5 font-serif italic text-xs sm:text-sm text-[#167a5b]">
                Pusat Talaqqi Muqarrar Al-Azhar &amp; Riset Tradisi Keilmuan Islam
              </p>

              {/* Dual Pill Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="/login?next=/kelas"
                  className="inline-flex min-h-10 sm:min-h-11 items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 text-xs sm:text-sm font-bold text-white shadow-[0_8px_20px_rgba(7,84,71,0.18)] transition hover:bg-[#00565e] hover:scale-105 cursor-pointer"
                >
                  <span>Mulai Belajar Sekarang</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </a>
                <a
                  href="/login?next=/kelas"
                  className="inline-flex min-h-10 sm:min-h-11 items-center justify-center gap-2 rounded-full border border-[#b9d9c5] bg-white/90 px-6 text-xs sm:text-sm font-semibold text-[#133227] shadow-2xs transition hover:border-[#006d77] hover:bg-white cursor-pointer"
                >
                  <span>Masuk Ruang Mahasiswa</span>
                  <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#006d77]" />
                </a>
              </div>
            </div>

            {/* Right Column: Quick Navigation (Snel naar) & Legal Pill Tag */}
            <div className="flex flex-col justify-between space-y-6 lg:items-end">
              <div className="w-full lg:max-w-[280px]">
                <h3 className="text-sm sm:text-base font-bold text-[#006d77] tracking-wide">Navigasi Cepat</h3>
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                  <div className="space-y-2">
                    <a href="#katalog" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Katalog Dars</a>
                    <a href="#katalog" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Bimbel Imtihan</a>
                    <a href="/belajar" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Ruang Belajar</a>
                    <a href="#cara-belajar" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Cara Belajar</a>
                  </div>
                  <div className="space-y-2">
                    <a href="#katalog" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Fakultas Syariah</a>
                    <a href="#katalog" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Fakultas Ushuluddin</a>
                    <a href="#katalog" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Fakultas Lughah</a>
                    <a href="#faq" className="block text-[#4d695b] hover:text-[#006d77] transition-colors font-medium">Pusat Bantuan &amp; FAQ</a>
                  </div>
                </div>
              </div>

              {/* Light Legal Pill Tag */}
              <div className="inline-flex items-center gap-2.5 sm:gap-3 rounded-full border border-[#cfe2d6] bg-white/95 px-4 py-1.5 text-[11px] sm:text-xs font-semibold text-[#133227] shadow-2xs">
                <a href="#" className="hover:text-[#006d77] transition">Syarat &amp; Ketentuan</a>
                <span className="text-[#9ab1a4]">•</span>
                <a href="#" className="hover:text-[#006d77] transition">Kebijakan Privasi</a>
                <span className="text-[#9ab1a4]">•</span>
                <span>© 2026</span>
              </div>
            </div>
          </div>
        </div>
      </footer>


      <AnimatePresence>
        {selectedProgram && (
          <ProgramModal
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
            onEnroll={() => {
              setPaymentCourse(selectedProgram);
            }}
          />
        )}
        {paymentCourse && (
          <MayarPaymentModal
            course={{
              id: paymentCourse.id,
              title: paymentCourse.title,
              price: paymentCourse.price,
              faculty: paymentCourse.faculty,
              programType: paymentCourse.programType,
              tutor: paymentCourse.tutor,
              lessons: paymentCourse.lessons,
            }}
            onClose={() => setPaymentCourse(null)}
            onSuccessRedirect={(slug) => {
              setPaymentCourse(null);
              setSelectedProgram(null);
              window.location.href = '/belajar/' + slug;
            }}
          />
        )}
        {selectedGalleryPhoto && (
          <GalleryLightboxModal
            photo={selectedGalleryPhoto}
            photos={landingGalleryPhotos}
            onClose={() => setSelectedGalleryPhoto(null)}
            onSelectPhoto={(photo) => setSelectedGalleryPhoto(photo)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ProfilePreviewItem = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => <article className="rounded-2xl border border-[#cfe5d6] bg-[#f7fbf8] p-5"><Icon className="h-5 w-5 text-[#006d77]" /><h3 className="mt-4 text-base font-semibold text-[#17382c]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#6e8775]">{text}</p></article>;

const CatalogDashboardMockup = () => <article className="mockup-shell overflow-hidden rounded-[28px] border-2 border-[#006d77] bg-[#006d77] p-3 shadow-[0_24px_60px_rgba(7,84,71,0.2)] sm:p-4"><div className="overflow-hidden rounded-[23px] bg-[#f7fbf8] p-3 sm:p-4"><div className="flex items-center justify-between gap-3 border-b border-[#e0eee3] px-1 pb-3"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f4f2] text-[#006d77]"><BookOpen className="h-4 w-4" /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#73917f]">Ruang belajar mahasiswa</p><h3 className="mt-1 text-sm font-semibold text-[#006d77]">Katalog maddah</h3></div></div><div className="flex items-center gap-2"><span className="hidden text-[10px] text-[#8aa18f] sm:inline">5 program tersedia</span><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f5ed] text-[10px] font-bold text-[#006d77]">A</span></div></div><div className="mt-3 flex items-center gap-2 rounded-xl border border-[#dce9df] bg-[#f8fcf9] px-3 py-2.5 text-[10px] text-[#91a49a]"><Search className="h-3.5 w-3.5 text-[#247d48]" /><span className="flex-1">Cari maddah atau fakultas</span><span className="rounded-full bg-white px-2 py-1 font-semibold text-[#247d48]">Filter</span></div><div className="mt-3 flex gap-2 overflow-hidden text-[10px] font-semibold"><span className="shrink-0 rounded-full bg-[#006d77] px-3 py-1.5 text-white">Semua</span><span className="shrink-0 rounded-full border border-[#cfe5d6] px-3 py-1.5 text-[#607568]">Dars</span><span className="shrink-0 rounded-full border border-[#cfe5d6] px-3 py-1.5 text-[#607568]">Syariah</span><span className="shrink-0 rounded-full border border-[#cfe5d6] px-3 py-1.5 text-[#607568]">Ushuluddin</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><CatalogMockupCard faculty="SYARIAH" title="Kajian Fikih Abi Syuja" meta="16 video · berbayar" tone="bg-[#e4f8ee]" /><CatalogMockupCard faculty="USHULUDDIN" title="Kajian Aqidah Ithaf al-Murid" meta="15 video · berbayar" tone="bg-[#edf9f5]" /><CatalogMockupCard faculty="LUGHAH" title="Kajian Tajwid Online" meta="3 video · gratis" tone="bg-[#f0f8f3]" /></div><div className="mt-3 flex items-center justify-between border-t border-[#e0eee3] px-1 pt-3 text-[10px] text-[#8aa18f]"><span>Progress tersimpan otomatis</span><span className="font-bold text-[#006d77]">Lihat semua <ArrowRight className="ml-1 inline h-3 w-3" /></span></div></div></article>;

const CatalogMockupCard = ({ faculty, title, meta, tone }: { faculty: string; title: string; meta: string; tone: string }) => <div className={`rounded-2xl border border-[#dce9df] p-3 ${tone}`}><div className="flex items-center justify-between gap-2"><span className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#247d48]">{faculty}</span><ArrowUpRight className="h-3.5 w-3.5 text-[#247d48]" /></div><h4 className="mt-4 min-h-[34px] text-xs font-semibold leading-4 text-[#17382c]">{title}</h4><div className="mt-3 flex items-center justify-between gap-2 text-[9px] text-[#6e8775]"><span>{meta}</span><span className="flex items-center gap-1 font-semibold text-[#247d48]"><Play className="h-3 w-3 fill-current" />Mulai</span></div></div>;

const ClassMockup = () => <article className="overflow-hidden rounded-[26px] border border-[#d5e8dc] bg-[#f7fbf8] p-4 shadow-[0_22px_55px_rgba(7,84,71,0.1)] sm:p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e5f4f2] text-[#006d77]"><BookOpen className="h-4 w-4" /></span><div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#73917f]">Katalog kelas</p><h3 className="mt-1 text-lg font-semibold text-[#006d77]">Pilih maddahmu</h3></div></div><button aria-label="Buka katalog" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#cfe5d6] bg-white text-[#006d77]"><ArrowUpRight className="h-4 w-4" /></button></div><div className="mt-4 rounded-[22px] bg-[#006d77] p-4 text-white shadow-[0_12px_24px_rgba(7,84,71,0.12)]"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#83c5be]">Syariah</span><span className="text-[10px] text-[#a6f3d2]">16 video</span></div><h4 className="mt-7 max-w-[230px] text-[17px] font-semibold leading-[1.15]">Kajian Fikih Matan Abi Syuja</h4><p className="mt-2 text-[11px] text-[#c9eee0]">Kajian fikih dengan pembahasan bertahap.</p><div className="mt-5"><div className="flex items-center justify-between text-[10px] text-[#b8e9d5]"><span>Progress kelas</span><span className="font-semibold text-white">68%</span></div><div className="mt-2 h-1.5 rounded-full bg-white/20"><div className="h-1.5 w-[68%] rounded-full bg-[#83c5be]" /></div></div><div className="mt-4 flex items-center gap-2 text-[10px] text-[#c9eee0]"><span>Video kajian</span><span>·</span><span>Materi pendamping</span></div></div><div className="mt-4 space-y-2.5"><MockupClassRow title="Kajian Aqidah Ithaf al-Murid" meta="15 video" /><MockupClassRow title="Kajian Tajwid Online" meta="3 video" /></div></article>;

const MockupClassRow = ({ title, meta }: { title: string; meta: string }) => <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#d5e8dc] bg-white px-3 py-3"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#e5f6ed] text-[#247d48]"><BookOpen className="h-3.5 w-3.5" /></span><span className="truncate text-xs font-semibold text-[#29483a]">{title}</span></div><span className="shrink-0 text-[10px] text-[#7b9383]">{meta}</span></div>;

const DashboardMockup = () => (
  <article className="overflow-hidden rounded-[26px] bg-[#006d77] p-3 shadow-[0_22px_55px_rgba(7,84,71,0.16)] sm:p-4">
    <div className="flex items-center justify-between px-1 pb-3 text-white">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#9fe7c9]">Ruang belajar</p>
        <h3 className="mt-1 text-lg font-semibold">Dashboard mahasiswa</h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden text-[10px] text-[#b8e9d5] sm:inline">Al Madraj</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10"><UsersRound className="h-4 w-4" /></span>
      </div>
    </div>
    <div className="rounded-[20px] bg-[#f8fcf9] p-3 text-[#17382c] sm:p-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#e1ece4] pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#e5f4f2] text-[#006d77]"><BookOpen className="h-3.5 w-3.5" /></span>
          <span className="text-xs font-bold text-[#006d77]">Ringkasan belajar</span>
        </div>
        <div className="flex items-center gap-2 text-[#6f897a]"><Search className="h-3.5 w-3.5" /><MoreHorizontal className="h-4 w-4" /></div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[82px_1fr]">
        <aside className="hidden border-r border-[#deebe2] pr-3 sm:block">
          <div className="space-y-3 text-[10px] text-[#769083]">
            <p className="font-semibold text-[#006d77]">Beranda</p>
            <p>Kelas saya</p>
            <p>Materi</p>
            <p>Progress</p>
          </div>
        </aside>
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] text-[#789083]">Selamat belajar, mahasiswa</p>
              <h4 className="mt-1 text-base font-semibold leading-tight">Lanjutkan kelasmu</h4>
            </div>
            <span className="text-[11px] font-semibold text-[#247d48]">68% selesai</span>
          </div>
          <div className="mt-4 rounded-[17px] bg-[#e7f7ee] p-3.5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#247d48]">Sedang dipelajari</p>
                <p className="mt-1 text-sm font-semibold text-[#006d77]">Kajian Fikih Abi Syuja</p>
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#6b8978]"><Clock3 className="h-3 w-3" />Video 12 dari 16</div>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#006d77] text-white"><Play className="h-3.5 w-3.5 fill-current" /></span>
            </div>
            <div className="mt-4 h-1.5 rounded-full bg-white"><div className="h-1.5 w-[68%] rounded-full bg-[#247d48]" /></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-[#e1ece4] bg-white p-2.5">
              <div className="flex items-center justify-between"><p className="text-[9px] text-[#789083]">Video selesai</p><CheckCircle2 className="h-3.5 w-3.5 text-[#247d48]" /></div>
              <p className="mt-1 text-sm font-semibold text-[#006d77]">12 / 16</p>
            </div>
            <div className="rounded-xl border border-[#e1ece4] bg-white p-2.5">
              <div className="flex items-center justify-between"><p className="text-[9px] text-[#789083]">Video tersedia</p><FileText className="h-3.5 w-3.5 text-[#247d48]" /></div>
              <p className="mt-1 text-sm font-semibold text-[#006d77]">16 video</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </article>
);

const MobileMockup = () => <article className="mx-auto w-full max-w-[286px] rounded-[34px] border-[6px] border-[#006d77] bg-[#006d77] p-2 shadow-[0_28px_70px_rgba(7,84,71,0.22)] sm:max-w-[320px] lg:max-w-[338px]"><div className="overflow-hidden rounded-[26px] bg-[#f7fbf8]"><div className="bg-[#006d77] px-4 pb-3.5 pt-2.5 text-white"><div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-white/30" /><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#83c5be] text-[10px] font-bold text-[#006d77]">Al</span><div><p className="text-[9px] font-semibold">Al Madraj</p><p className="text-[8px] text-[#b8e9d5]">Ruang belajar Masisir</p></div></div><span className="text-[9px] text-[#b8e9d5]">09:41</span></div></div><div className="px-3.5 pb-4 pt-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] text-[#789083]">Selamat belajar, mahasiswa</p><h3 className="mt-1 text-lg font-semibold text-[#006d77]">Lanjutkan kelasmu</h3></div><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f4f2] text-xs font-bold text-[#006d77]">A</span></div><div className="mt-4 rounded-[19px] bg-[#e4f6eb] p-3.5"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#247d48]">Sedang dipelajari</p><p className="mt-1 text-base font-semibold text-[#006d77]">Kajian Fikih Abi Syuja</p><p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-[#6b8978]"><Clock3 className="h-3 w-3" />Video 12 dari 16</p></div><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006d77] text-white"><Play className="h-3 w-3 fill-current" /></span></div><div className="mt-3 flex items-center justify-between text-[9px] text-[#60816f]"><span>Progress kelas</span><span className="font-bold text-[#006d77]">68%</span></div><div className="mt-1.5 h-1.5 rounded-full bg-white"><div className="h-1.5 w-[68%] rounded-full bg-[#006d77]" /></div></div><div className="mt-5 flex items-center justify-between"><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#789083]">Kelas saya</p><h4 className="mt-1 text-sm font-semibold text-[#17382c]">Maddah aktif</h4></div><button aria-label="Lihat semua kelas" className="text-[10px] font-bold text-[#006d77]">Lihat semua</button></div><div className="mt-2.5 space-y-2"><MobileLessonRow title="Pertemuan 10" meta="Selesai" state="done" /><MobileLessonRow title="Pertemuan 11" meta="Sedang dipelajari" state="active" /><MobileLessonRow title="Pertemuan 12" meta="Terkunci" state="locked" /></div><div className="mt-4 rounded-[16px] bg-[#006d77] p-3 text-white"><div className="flex items-center justify-between gap-3"><div><p className="text-[8px] font-bold uppercase tracking-[0.14em] text-[#83c5be]">Murojaah berikutnya</p><p className="mt-1 text-xs font-semibold">Ulangi materi sebelum imtihan</p></div><ArrowUpRight className="h-3.5 w-3.5 text-[#83c5be]" /></div></div></div><nav aria-label="Navigasi mobile preview" className="grid grid-cols-4 border-t border-[#e1ece4] bg-white px-2 py-2"><MobileMockupNav icon={BookOpen} label="Kelas" active /><MobileMockupNav icon={Play} label="Video" /><MobileMockupNav icon={FileText} label="Materi" /><MobileMockupNav icon={UserRound} label="Profil" /></nav></div></article>;

const MobileLessonRow = ({ title, meta, state }: { title: string; meta: string; state: 'done' | 'active' | 'locked' }) => <div className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${state === 'active' ? 'border-[#9bd5b0] bg-[#eaf8ef]' : 'border-[#dce9df] bg-white'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${state === 'locked' ? 'bg-[#f1f4f1] text-[#91a49a]' : 'bg-[#e4f6eb] text-[#006d77]'}`}>{state === 'locked' ? <LockKeyhole className="h-3.5 w-3.5" /> : state === 'done' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}</span><div className="min-w-0"><p className="truncate text-xs font-semibold text-[#315747]">{title}</p><p className="mt-0.5 text-[10px] text-[#789083]">{meta}</p></div><ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 text-[#9bb1a3]" /></div>;

const MobileMockupNav = ({ icon: Icon, label, active = false }: { icon: React.ElementType; label: string; active?: boolean }) => <span className={`flex flex-col items-center gap-1 text-[9px] font-semibold ${active ? 'text-[#006d77]' : 'text-[#91a49a]'}`}><Icon className="h-3.5 w-3.5" />{label}</span>;

const TestimonialCard = ({ item, index }: { item: typeof testimonials[number]; index: number }) => (
  <motion.article
    {...reveal}
    transition={{ ...reveal.transition, delay: index * 0.05 }}
    className="group relative flex flex-col justify-between rounded-[24px] border border-[#d8e7dc] bg-white p-6 shadow-[0_4px_20px_rgba(7,84,71,0.03)] transition-all duration-300 hover:-translate-y-1 hover:border-[#83cca2] hover:shadow-[0_16px_36px_rgba(7,84,71,0.08)] sm:p-7"
  >
    <div>
      {/* Top Header: Avatar, Name & Role */}
      <div className="flex items-center gap-3">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr ${item.avatarColor} text-sm font-bold text-white shadow-xs`}>
          {item.initials}
        </div>
        <div>
          <h4 className="text-sm font-bold text-[#143428] sm:text-base">
            {item.name}
          </h4>
          <p className="text-xs text-[#5c7768]">
            {item.role} · {item.university}
          </p>
        </div>
      </div>

      {/* Star Rating & Year */}
      <div className="mt-4 flex items-center justify-between border-y border-[#edf5f0] py-2.5">
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3, 4].map((starIndex) => (
            <Star key={starIndex} className="h-3.5 w-3.5 fill-[#f59e0b] text-[#f59e0b]" />
          ))}
          <span className="ml-1 text-[11px] font-bold text-[#143428]">5.0</span>
        </div>
        <span className="text-[11px] font-medium text-[#7a9486]">
          {item.year}
        </span>
      </div>

      {/* Quote */}
      <blockquote className="mt-4 text-sm leading-relaxed text-[#3d594b]">
        “{item.quote}”
      </blockquote>
    </div>

    {/* Course Footer */}
    <div className="mt-6 flex items-center gap-2 border-t border-[#edf5f0] pt-3 text-xs text-[#1e6144]">
      <BookOpen className="h-3.5 w-3.5 shrink-0 text-[#127a56]" />
      <span className="truncate font-medium">{item.course}</span>
    </div>
  </motion.article>
);

const FooterColumn = ({ title, links }: { title: string; links: Array<[string, string]> }) => (
  <div>
    <h3 className="text-xs font-bold uppercase tracking-wider text-[#0a3528]">{title}</h3>
    <nav className="mt-4 grid gap-2.5">
      {links.map(([label, href]) => (
        <a
          key={label}
          href={href}
          className="text-xs font-medium text-[#3b634e] transition-colors hover:text-[#006d77] inline-block"
        >
          {label}
        </a>
      ))}
    </nav>
  </div>
);

const Feature = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => <article className="border-b border-[#dce9df] py-6 last:border-b-0 lg:border-b-0 lg:border-r lg:px-8 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"><Icon className="h-5 w-5 text-[#247d48]" /><h3 className="mt-5 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#5d7464]">{text}</p></article>;

const MiniStat = ({ label, value }: { label: string; value: string }) => <div className="rounded-lg bg-white/10 p-3"><p className="text-[11px] text-[#b6d3bd]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>;

const IslamicPatternWatermark = ({ className = 'text-white/[0.12]' }: { className?: string }) => (
  <svg
    className={`pointer-events-none absolute -right-6 -top-6 h-48 w-48 ${className}`}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.6"
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="46" strokeDasharray="1.5 2.5" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(0 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(22.5 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(67.5 50 50)" />
    <circle cx="50" cy="50" r="28" />
    <circle cx="50" cy="50" r="14" strokeDasharray="1 2" />
    <circle cx="50" cy="50" r="3" fill="currentColor" />
  </svg>
);

const TopoAsteriskEmblem = () => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-24 w-24 sm:h-28 sm:w-28 drop-shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
  >
    <defs>
      <clipPath id="asteriskClip">
        <g transform="translate(60,60)">
          {[0, 60, 120].map((angle) => (
            <rect
              key={angle}
              x="-9"
              y="-48"
              width="18"
              height="96"
              rx="9"
              transform={`rotate(${angle})`}
            />
          ))}
          <circle cx="0" cy="0" r="16" />
        </g>
      </clipPath>
    </defs>
    <g clipPath="url(#asteriskClip)">
      <rect width="120" height="120" fill="#063527" />
      {/* Topo contour lines */}
      <circle cx="60" cy="60" r="10" stroke="#00e676" strokeWidth="2.8" fill="none" />
      <circle cx="60" cy="60" r="18" stroke="#10b981" strokeWidth="2.6" fill="none" />
      <circle cx="60" cy="60" r="26" stroke="#00e676" strokeWidth="2.4" fill="none" />
      <circle cx="60" cy="60" r="34" stroke="#10b981" strokeWidth="2.4" fill="none" />
      <circle cx="60" cy="60" r="42" stroke="#00e676" strokeWidth="2.2" fill="none" />
      <circle cx="60" cy="60" r="50" stroke="#10b981" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="58" stroke="#00e676" strokeWidth="2" fill="none" />
      <path
        d="M5,25 Q60,55 115,25 M5,45 Q60,75 115,45 M5,65 Q60,95 115,65 M5,85 Q60,115 115,85"
        stroke="#00e676"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M25,5 Q55,60 25,115 M45,5 Q75,60 45,115 M65,5 Q95,60 65,115 M85,5 Q115,60 85,115"
        stroke="#34d399"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </g>
    <circle cx="60" cy="60" r="50" stroke="#00e676" strokeWidth="0.5" opacity="0.4" strokeDasharray="3 3" />
  </svg>
);

const TopoBackgroundLines = ({ stroke = '#006d77', className = 'opacity-[0.06]' }: { stroke?: string; className?: string }) => (
  <svg
    className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="none"
    viewBox="0 0 1200 600"
    fill="none"
  >
    <path
      d="M0,140 C280,100 420,260 600,180 C780,100 960,240 1200,160"
      stroke={stroke}
      strokeWidth="1.5"
    />
    <path
      d="M0,220 C260,170 440,320 600,250 C760,180 980,310 1200,230"
      stroke={stroke}
      strokeWidth="1.2"
    />
    <path
      d="M0,310 C240,250 420,410 600,330 C780,250 960,390 1200,310"
      stroke={stroke}
      strokeWidth="1.2"
    />
    <path
      d="M0,400 C220,340 400,490 600,420 C800,350 1000,470 1200,390"
      stroke={stroke}
      strokeWidth="1.2"
    />
    <path
      d="M0,490 C200,430 380,570 600,500 C820,430 1020,540 1200,470"
      stroke={stroke}
      strokeWidth="1"
    />
    <ellipse cx="600" cy="180" rx="180" ry="85" stroke={stroke} strokeWidth="1" strokeDasharray="4 4" />
    <ellipse cx="600" cy="180" rx="280" ry="135" stroke={stroke} strokeWidth="0.8" />
    <ellipse cx="600" cy="180" rx="380" ry="185" stroke={stroke} strokeWidth="0.8" strokeDasharray="3 3" />
  </svg>
);

const academicPartners = [
  {
    name: 'Universitas Al-Azhar',
    sub: 'Syariah & Ushuluddin',
    icon: Landmark,
    accent: '#34d399',
  },
  {
    name: 'Rawaq Al-Azhar',
    sub: 'Majelis Talaqqi Kairo',
    icon: BookOpen,
    accent: '#10b981',
  },
  {
    name: 'KMJ Mesir',
    sub: 'Persatuan Masisir',
    icon: UsersRound,
    accent: '#6ee7b7',
  },
  {
    name: 'Markaz Syaikh Zayed',
    sub: 'Pusat Bahasa Arab',
    icon: GraduationCap,
    accent: '#34d399',
  },
  {
    name: 'Riset Turats Islam',
    sub: 'Tahqiq & Muqarrar',
    icon: ScrollText,
    accent: '#10b981',
  },
  {
    name: 'Masisir Hub',
    sub: 'Bimbel Imtihan',
    icon: Sparkles,
    accent: '#6ee7b7',
  },
];

const getFacultyVisual = (faculty: string) => {
  const norm = (faculty || '').toLowerCase();
  if (norm.includes('syariah')) {
    return {
      bannerGradient: 'from-[#07473b] via-[#095445] to-[#06382e]',
      gradient: 'from-[#073d32] via-[#0b5446] to-[#052d25]',
      dot: 'bg-[#34d399]',
      borderHover: 'hover:border-[#10b981]',
      glow: 'rgba(16, 185, 129, 0.15)',
      shortName: 'Syariah',
    };
  }
  if (norm.includes('ushuluddin')) {
    return {
      bannerGradient: 'from-[#0b4357] via-[#0f546d] to-[#083342]',
      gradient: 'from-[#0a3547] via-[#0f4d66] to-[#072836]',
      dot: 'bg-[#38bdf8]',
      borderHover: 'hover:border-[#0284c7]',
      glow: 'rgba(56, 189, 248, 0.15)',
      shortName: 'Ushuluddin',
    };
  }
  if (norm.includes('lughah') || norm.includes('bahasa')) {
    return {
      bannerGradient: 'from-[#24422f] via-[#2f553c] to-[#1a3022]',
      gradient: 'from-[#1e3b2b] via-[#2d523e] to-[#162c20]',
      dot: 'bg-[#a3e635]',
      borderHover: 'hover:border-[#84cc16]',
      glow: 'rgba(132, 204, 22, 0.15)',
      shortName: 'Lughah Arabiyyah',
    };
  }
  return {
    bannerGradient: 'from-[#07473b] via-[#095445] to-[#06382e]',
    gradient: 'from-[#094236] via-[#0d594a] to-[#063128]',
    dot: 'bg-[#34d399]',
    borderHover: 'hover:border-[#059669]',
    glow: 'rgba(16, 185, 129, 0.15)',
    shortName: 'Dirasat Islamiyyah',
  };
};

const ProgramCard = ({ program, index, onOpen }: { program: Program; index: number; onOpen: () => void }) => {
  const theme = getFacultyVisual(program.faculty);
  const detail = getCourseDetail(program.id);
  const isFree = program.price === 'Gratis' || program.price === 'Rp0' || program.price === 'Rp 0';
  const coverSrc = program.thumbnail || getCourseCoverImage(program.id || program.title, program.faculty);

  return (
    <motion.article
      {...reveal}
      transition={{ ...reveal.transition, delay: index * 0.05 }}
      onClick={onOpen}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[16px] sm:rounded-[22px] border border-[#dce8df] bg-white shadow-[0_3px_16px_rgba(7,84,71,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#10b981]/50 hover:shadow-[0_16px_36px_rgba(7,84,71,0.10)]"
    >
      {/* Top Faculty Banner / Course Cover with exact ratio 116.501mm : 65.024mm */}
      <div
        className={`relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${theme.bannerGradient} text-white`}
        style={{ aspectRatio: '116501 / 65024' }}
      >
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={program.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('cover-fikih')) {
                target.src = '/courses/cover-fikih-matan-abi-syuja.png';
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-3 sm:p-4">
            {/* Subtle Islamic Geometric Watermark */}
            <IslamicPatternWatermark className="text-white/[0.13] -right-7 -top-7 h-44 w-44" />

            {/* Ambient Glow */}
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

            {/* Top Row: Dars • Fakultas & Thin Book Icon */}
            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[12px] font-medium tracking-tight sm:tracking-wide text-white/90 truncate">
                {program.programType || 'Dars'} • {theme.shortName}
              </span>
              <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[1.8]" />
              </div>
            </div>

            {/* Bottom Row: CirclePlay & Lessons Duration */}
            <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-[11.5px] font-medium text-white/85 truncate">
              <CirclePlay className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80 shrink-0" />
              <span className="truncate">{program.lessons}</span>
              <span className="hidden sm:inline"> · {isFree ? 'Video & materi gratis' : 'Video & pembahasan'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-3 sm:p-5 text-left">
        {/* Judul Maddah */}
        <h3 className="text-xs sm:text-[17px] font-bold leading-tight sm:leading-snug tracking-tight text-[#143428] transition-colors group-hover:text-[#006d77] line-clamp-2 min-h-[32px] sm:min-h-[46px]">
          {program.title}
        </h3>

        {/* Ringkasan Deskripsi */}
        <p className="mt-1 sm:mt-2 text-[11px] sm:text-[12.5px] leading-relaxed text-[#597365] line-clamp-1 sm:line-clamp-2 min-h-0 sm:min-h-[36px]">
          {program.description}
        </p>

        {/* Elegant Hairline Metadata Divider */}
        <div className="mt-2.5 sm:mt-4.5 pt-2 sm:pt-3.5 border-t border-[#eaf1ec] flex items-center justify-between text-xs text-[#527061]">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 pr-1">
            <UserRound className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#86a292] shrink-0" />
            <span className="truncate font-medium text-[10.5px] sm:text-[12px]">{program.tutor || 'Al-Madraj Edu'}</span>
          </div>
          <span className="hidden sm:inline text-[11.5px] font-medium text-[#739282] shrink-0">
            {isFree ? 'Kajian Terbuka' : 'Materi Terstruktur'}
          </span>
        </div>

        {/* Footer: Investasi / Akses & Tombol Aksi */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
          <div className="min-w-0">
            <p className="text-[8.5px] sm:text-[10px] font-medium uppercase tracking-wider text-[#789585]">
              {isFree ? 'AKSES' : 'INVESTASI'}
            </p>
            <p className="mt-0.5 text-xs sm:text-xl font-extrabold tracking-tight text-[#006d77] truncate">
              {isFree ? 'Gratis' : program.price}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className="group/btn inline-flex w-full sm:w-auto items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-full bg-[#07473b] py-1.5 px-2 sm:pl-3.5 sm:pr-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#06382e] hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span>Lihat Kelas</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" />
          </button>
        </div>
      </div>
    </motion.article>
  );
};

const LessonRow = ({ title, status, active = false, locked = false }: { title: string; status: string; active?: boolean; locked?: boolean }) => <div className={`flex items-center gap-3 rounded-lg border p-3 ${active ? 'border-[#9acba5] bg-[#edf8ef]' : 'border-[#e1eee3] bg-white'}`}><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${locked ? 'bg-[#f0f3f0] text-[#9aaba0]' : 'bg-[#e8f5e9] text-[#247d48]'}`}>{locked ? <LockKeyhole className="h-4 w-4" /> : <Check className="h-4 w-4" />}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="mt-0.5 text-[11px] text-[#6e8775]">{status}</p></div></div>;

const FlowStep = ({ number, title, text }: { number: string; title: string; text: string }) => <article className="grid gap-4 border-b border-[#dce9df] py-6 sm:grid-cols-[70px_180px_1fr] sm:items-start"><span className="font-mono text-xs text-[#247d48]">{number}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-6 text-[#5d7464]">{text}</p></article>;

const ProgramModal = ({ program, onClose, onEnroll }: { program: Program; onClose: () => void; onEnroll: () => void }) => {
  const theme = getFacultyVisual(program.faculty);
  const detail = getCourseDetail(program.id);
  const [activeTab, setActiveTab] = useState<'silabus' | 'ikhtisar' | 'tutor' | 'fasilitas'>('silabus');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Information fields
  const kitabName = detail?.kitabName || program.title;
  const authorName = detail?.authorName || 'Ulama Ahlussunnah';
  const tutorName = detail?.tutorName || program.tutor;
  const tutorTitle = detail?.tutorTitle || 'Pengajar Turats Islam';
  const tutorBio = detail?.tutorBio || 'Alumni Universitas Al-Azhar Kairo yang membimbing pembahasan materi kitab turats dan persiapan imtihan.';
  const tutorAlmamater = detail?.tutorAlmamater || 'Universitas Al-Azhar, Kairo';
  const channelName = detail?.channelName || 'Al-Madraj Edu';
  const lessons = detail?.lessons || [];
  const outcomes = detail?.outcomes || [
    'Memahami ibarat turats dan konsep dasar materi secara runtut.',
    'Mempersiapkan diri lebih matang sebelum menghadapi imtihan muqarrar.',
    'Mendapatkan panduan langsung dari asatidz alumni Al-Azhar Kairo.'
  ];
  const targetAudience = detail?.targetAudience || [
    'Mahasiswa Al-Azhar yang sedang menempuh maddah terkait.',
    'Santri dan pembelajar ilmu Islam yang ingin belajar secara terarah.'
  ];
  const facilities = detail?.facilities || [
    'Akses rekaman video pembelajaran beresolusi tinggi',
    'Diktat teks matan & catatan faedah ibarat kitab',
    'Tersimpan di dashboard akun mahasiswa Al Madraj',
    'Akses fleksibel tanpa batas waktu'
  ];
  const overview = detail?.overview || program.description;
  const isFree = program.price === 'Gratis' || detail?.price === 0;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-[#07241c]/65 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="program-modal-title"
        className="flex max-h-[94dvh] w-full max-w-2xl sm:max-w-3xl flex-col overflow-hidden rounded-t-[28px] border border-[#d4e6dc] bg-white shadow-2xl sm:rounded-[28px]"
        initial={{ y: 28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
      >
        {/* Modal Top Header with Clean Solid Brand Color #006d77 */}
        <div className="relative overflow-hidden bg-[#006d77] p-5 text-white sm:p-7 shrink-0">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="min-w-0 pr-2">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/85">
                <span className="font-bold tracking-wider uppercase text-white">{program.programType} · {program.faculty}</span>
                <span className="text-white/40">·</span>
                <span>{program.lessons}</span>
                <span className="text-white/40">·</span>
                <span className={isFree ? 'font-bold text-[#8ee7be]' : 'font-semibold text-amber-200'}>
                  {isFree ? 'Kajian Terbuka Bebas' : 'Materi Terstruktur'}
                </span>
              </div>
              <h2 id="program-modal-title" className="mt-2.5 text-2xl sm:text-3xl font-bold leading-tight tracking-tight">
                {program.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#d1eee2] font-medium">
                Kitab: <span className="text-white font-semibold">{kitabName}</span> · Karya {authorName}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup detail program"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur-md transition hover:bg-white/30"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Top Media: Video Preview for Free, Locked Banner for Paid */}
          {isFree && playingVideoId ? (
            <div className="overflow-hidden rounded-2xl border border-[#cfe2d6] bg-black shadow-md">
              <div className="flex items-center justify-between bg-[#122e23] px-4 py-2 text-xs text-white">
                <span className="flex items-center gap-1.5 font-semibold text-[#8ee3c1]">
                  <CirclePlay className="h-3.5 w-3.5 text-[#5eead4]" />
                  Memutar Preview Video YouTube
                </span>
                <button
                  onClick={() => setPlayingVideoId(null)}
                  className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition"
                >
                  Tutup Player
                </button>
              </div>
              <div className="aspect-video w-full">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${playingVideoId}?autoplay=1&rel=0`}
                  title="YouTube video player"
                  className="h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          ) : isFree && lessons.length > 0 ? (
            <div className="group relative flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-[#d6e7dc] bg-[#f2f8f4] p-3.5 sm:p-4">
              <div
                onClick={() => setPlayingVideoId(lessons[0].youtubeId)}
                className="relative aspect-video w-full sm:w-48 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#0d2a21] shadow-xs"
              >
                <img
                  src={lessons[0].thumbnailUrl}
                  alt={lessons[0].title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/35 flex items-center justify-center transition-colors group-hover:bg-black/20">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006d77] text-white shadow-lg transition-transform group-hover:scale-110">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </div>
                </div>
                <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-white">
                  Preview
                </span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#006d77]">
                  <Sparkles className="h-3 w-3 text-[#168b77]" />
                  Video Pembahasan Pertemuan 1 (Akses Gratis)
                </span>
                <h4 className="mt-1 text-sm font-bold text-[#143428] line-clamp-1">
                  {lessons[0].title}
                </h4>
                <p className="mt-1 text-xs text-[#5c7767] line-clamp-2">
                  {lessons[0].description}
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <button
                    onClick={() => setPlayingVideoId(lessons[0].youtubeId)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#00565e] transition cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Putar Video</span>
                  </button>
                  <a
                    href={lessons[0].youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#496b5b] hover:text-[#006d77] hover:underline transition"
                  >
                    <span>Buka YouTube</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          ) : !isFree ? (
            /* Paid Class: Content Protected Banner (No free video link leak!) */
            <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-[#fefcf8] via-white to-[#f7fbf8] p-4 sm:p-5 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100/70 text-[#966314]">
                <Lock className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="text-[11px] font-bold text-[#8c5a08] uppercase tracking-wider">
                    Materi Terkunci
                  </span>
                  <span className="text-xs font-semibold text-[#6d8878]">Investasi Belajar: {program.price}</span>
                </div>
                <h4 className="mt-1 text-sm sm:text-[15px] font-bold text-[#17382c]">
                  Akses Video & Pembahasan Lengkap Terbuka Setelah Pendaftaran
                </h4>
                <p className="mt-0.5 text-xs text-[#597566]">
                  Daftar sekarang untuk membuka seluruh {lessons.length} video rekaman turats, modul bacaan, dan penyimpanan progress di platform.
                </p>
              </div>
              <button
                onClick={onEnroll}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] transition active:scale-[0.98]"
              >
                <span>Beli Kelas Ini</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          {/* Quick 4 Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
            <div className="rounded-xl border border-[#e4eee7] bg-[#f8fcf9] p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#738f80]">
                <UserRound className="h-3 w-3 text-[#006d77]" /> Pengajar
              </p>
              <p className="mt-1 text-xs sm:text-[13px] font-bold text-[#143428] truncate" title={tutorName}>
                {tutorName}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4eee7] bg-[#f8fcf9] p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#738f80]">
                <BookOpen className="h-3 w-3 text-[#006d77]" /> Kitab Rujukan
              </p>
              <p className="mt-1 text-xs sm:text-[13px] font-bold text-[#143428] truncate" title={kitabName}>
                {kitabName}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4eee7] bg-[#f8fcf9] p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#738f80]">
                <CirclePlay className="h-3 w-3 text-[#006d77]" /> Rekaman Video
              </p>
              <p className="mt-1 text-xs sm:text-[13px] font-bold text-[#143428] truncate">
                {lessons.length ? `${lessons.length} Video Pertemuan` : program.lessons}
              </p>
            </div>
            <div className="rounded-xl border border-[#e4eee7] bg-[#f8fcf9] p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#738f80]">
                <ShieldCheck className="h-3 w-3 text-[#006d77]" /> Akses Belajar
              </p>
              <p className="mt-1 text-xs sm:text-[13px] font-bold text-[#006d77] truncate">
                {program.price}
              </p>
            </div>
          </div>

          {/* Interactive Tab Switcher */}
          <div className="border-b border-[#e5efe8] pb-1">
            <div className="flex gap-1 overflow-x-auto pb-1" role="tablist">
              {[
                { id: 'silabus', label: `Silabus Pertemuan (${lessons.length})`, icon: CirclePlay },
                { id: 'ikhtisar', label: 'Tentang Kajian & Kitab', icon: BookOpen },
                { id: 'tutor', label: 'Profil Pengajar', icon: GraduationCap },
                { id: 'fasilitas', label: 'Fasilitas Belajar', icon: CheckCircle2 },
              ].map((tab) => {
                const active = activeTab === tab.id;
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    role="tab"
                    aria-selected={active}
                    className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all ${
                      active
                        ? 'bg-[#006d77] text-white shadow-xs'
                        : 'border border-transparent text-[#587365] hover:border-[#cfe2d6] hover:bg-white hover:text-[#006d77]'
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: Silabus Pertemuan */}
          {activeTab === 'silabus' && (
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#143428]">
                    Alur Pembahasan & Silabus Pertemuan
                  </h3>
                  <p className="text-xs text-[#607c6d]">
                    {isFree
                      ? `Tersedia ${lessons.length} rekaman video kajian dari channel ${channelName}.`
                      : `Kurikulum ${lessons.length} materi kajian lengkap. Akses rekaman video dibuka setelah pendaftaran.`}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    isFree ? 'text-[#006d77]' : 'text-[#8a5b0b]'
                  }`}
                >
                  {isFree ? 'Akses Terbuka' : 'Khusus Terdaftar'}
                </span>
              </div>

              <div className="divide-y divide-[#edf4ef] rounded-2xl border border-[#dce9df] bg-white overflow-hidden shadow-xs">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.youtubeId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 hover:bg-[#f7faf8] transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e8f5ed] text-xs font-bold text-[#006d77] mt-0.5">
                        {String(lesson.sortOrder).padStart(2, '0')}
                      </span>
                      <div className="relative aspect-video w-20 shrink-0 overflow-hidden rounded-lg bg-[#0d2a21]">
                        <img
                          src={lesson.thumbnailUrl}
                          alt={lesson.title}
                          className={`h-full w-full object-cover ${!isFree ? 'opacity-70 blur-[1px]' : ''}`}
                          loading="lazy"
                        />
                        {isFree ? (
                          <div
                            onClick={() => setPlayingVideoId(lesson.youtubeId)}
                            className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer hover:bg-black/15 transition-colors"
                            title="Putar preview"
                          >
                            <Play className="h-3 w-3 fill-current text-white" />
                          </div>
                        ) : (
                          <div
                            onClick={onEnroll}
                            className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                            title="Materi terkunci - daftar untuk membuka"
                          >
                            <Lock className="h-3.5 w-3.5 text-amber-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-[#183a2d] leading-snug">
                          {lesson.title}
                        </p>
                        {lesson.description && (
                          <p className="mt-0.5 text-[11px] text-[#617e6e] line-clamp-1">
                            {lesson.description}
                          </p>
                        )}
                        <span className="mt-1 inline-block text-[10px] font-medium text-[#7d9789]">
                          {isFree ? `${channelName} · ` : 'Akses Eksklusif · '}{lesson.duration || 'Video Kajian'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto pl-10 sm:pl-0">
                      {isFree ? (
                        <>
                          <button
                            onClick={() => setPlayingVideoId(lesson.youtubeId)}
                            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#006d77] hover:text-[#06382e] hover:underline transition cursor-pointer"
                          >
                            <Play className="h-3 w-3 fill-current" />
                            <span>Putar Video</span>
                          </button>
                          <a
                            href={lesson.youtubeUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Buka langsung di YouTube"
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d6e7dc] text-[#587365] hover:border-[#006d77] hover:text-[#006d77] transition"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </>
                      ) : (
                        <button
                          onClick={onEnroll}
                          className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#8a5b0b] hover:text-[#644207] hover:underline transition cursor-pointer"
                          title="Daftar kelas untuk membuka materi ini"
                        >
                          <Lock className="h-3 w-3 text-[#996515]" />
                          <span>Terkunci · Daftar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Tentang Kajian & Kitab */}
          {activeTab === 'ikhtisar' && (
            <div className="space-y-5 text-left">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#006d77]">
                  Deskripsi & Latar Belakang Kitab
                </h3>
                <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#4d695b]">
                  {overview}
                </p>
              </div>

              <div className="rounded-2xl border border-[#dce9df] bg-[#f8fbf9] p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#143428]">
                  Yang Akan Kamu Pelajari
                </h4>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  {outcomes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-[#3c594b]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#168b77]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#dce9df] bg-white p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#143428]">
                  Program Ini Sangat Cocok Untuk:
                </h4>
                <div className="mt-2.5 space-y-2">
                  {targetAudience.map((audience, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#527061]">
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#e8f5ed] text-[#006d77]">
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </span>
                      <span>{audience}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Profil Pengajar */}
          {activeTab === 'tutor' && (
            <div className="space-y-4 text-left">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-2xl border border-[#dce9df] bg-[#f8fbf9] p-5">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#006d77] text-xl font-bold text-white shadow-md">
                  {tutorName.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#006d77]">
                    {tutorTitle}
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-[#143428]">
                    {tutorName}
                  </h3>
                  <p className="text-xs text-[#168b77] font-semibold">
                    Almamater: {tutorAlmamater}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#dce9df] bg-white p-5 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#143428]">
                  Tentang Pengajar
                </h4>
                <p className="text-xs sm:text-sm leading-relaxed text-[#4d695b]">
                  {tutorBio}
                </p>
                <div className="border-t border-[#edf4ef] pt-3 text-xs text-[#638070]">
                  Kajian dibawakan secara runtut dengan metode talaqqi dan bedah ibarat turats yang biasa digunakan di halaqah-halaqah ilmiah Kairo.
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Fasilitas Belajar */}
          {activeTab === 'fasilitas' && (
            <div className="space-y-4 text-left">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#006d77]">
                  Fasilitas Peserta Kajian
                </h3>
                <p className="mt-1 text-xs text-[#5f7b6c]">
                  Semua fasilitas dapat diakses setelah mendaftar atau mengaktifkan program ini.
                </p>
              </div>

              <div className="grid gap-2.5">
                {facilities.map((facility, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-[#e2ede5] bg-[#f8fcf9] p-3.5 text-xs sm:text-sm text-[#385547]"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#168b77]" />
                    <span className="font-medium">{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Sticky Bottom Action Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#e5efe8] bg-[#f7faf8] px-5 py-4 sm:px-7 shrink-0">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7d9788]">
              {program.price === 'Gratis' ? 'Akses Terbuka' : 'Investasi Belajar'}
            </p>
            <p className="mt-0.5 text-xl sm:text-2xl font-bold tracking-tight text-[#006d77]">
              {program.price}
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                window.location.href = '/kelas/' + program.id;
              }}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-full border border-[#c5ddd0] bg-white px-4 py-2.5 text-xs font-bold text-[#355848] hover:border-[#006d77] hover:text-[#006d77] transition"
            >
              Lihat di Katalog
            </button>
            <button
              onClick={onEnroll}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-[0_4px_14px_rgba(7,84,71,0.22)] transition-all hover:bg-[#00565e] hover:shadow-[0_8px_22px_rgba(7,84,71,0.32)] active:scale-[0.98]"
            >
              <span>{program.price === 'Gratis' ? 'Mulai Belajar Sekarang (Gratis)' : 'Daftar Kelas Ini'}</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WebsitePage;
