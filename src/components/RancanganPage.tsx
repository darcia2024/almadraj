import React, { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  CreditCard,
  FileText,
  Globe2,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MonitorSmartphone,
  MousePointer2,
  PackageCheck,
  PanelTop,
  Printer,
  Server,
  Settings2,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';
import { PROPOSAL_META } from '../data/proposalData';

type ScopeItem = {
  title: string;
  description: string;
};

type ScopeSection = {
  id: string;
  number: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  items: ScopeItem[];
};

const scopeSections: ScopeSection[] = [
  {
    id: 'scope-ui-ux',
    number: '01',
    title: 'Perancangan UI/UX',
    summary: 'Menyusun struktur dan tampilan yang membuat website mudah dipahami oleh calon peserta, peserta aktif, dan admin.',
    icon: MousePointer2,
    items: [
      { title: 'Struktur navigasi', description: 'Menyusun alur halaman publik, dashboard peserta, dan dashboard admin.' },
      { title: 'Visual identity', description: 'Menggunakan logo, warna, tipografi, dan karakter visual Al Madroj.' },
      { title: 'Responsive layout', description: 'Menyiapkan layout yang nyaman untuk desktop, tablet, dan HP.' },
      { title: 'UI states', description: 'Menyiapkan tampilan loading, data kosong, berhasil, gagal, dan validasi form.' },
      { title: 'Revisi desain', description: 'Maksimal dua tahap revisi desain sebelum implementasi.' },
    ],
  },
  {
    id: 'scope-website',
    number: '02',
    title: 'Website utama',
    summary: 'Membangun etalase digital Al Madroj yang menjelaskan program belajar dan mengarahkan calon peserta ke pendaftaran.',
    icon: PanelTop,
    items: [
      { title: 'Beranda', description: 'Pengenalan Al Madroj, positioning, program unggulan, dan jalur pendaftaran.' },
      { title: 'Profil lembaga', description: 'Informasi singkat tentang Al Madroj dan pendekatan pembelajarannya.' },
      { title: 'Katalog dan detail kelas', description: 'Daftar kelas, harga, jadwal, durasi, pengajar, dan ringkasan materi.' },
      { title: 'FAQ dan kontak', description: 'Jawaban atas pertanyaan pendaftaran serta jalur komunikasi yang jelas.' },
      { title: 'Content management', description: 'Informasi dasar kelas dapat diubah melalui dashboard admin.' },
    ],
  },
  {
    id: 'scope-account',
    number: '03',
    title: 'Registrasi dan login peserta',
    summary: 'Memberikan setiap peserta akun pribadi untuk mengakses kelas dan riwayat belajarnya.',
    icon: LockKeyhole,
    items: [
      { title: 'Registrasi akun', description: 'Form nama, email, nomor WhatsApp, dan password dengan validasi data wajib.' },
      { title: 'Login dan logout', description: 'Peserta dapat masuk, keluar, dan mempertahankan sesi secara aman.' },
      { title: 'Lupa password', description: 'Alur pengaturan ulang password melalui email yang terdaftar.' },
      { title: 'Proteksi halaman', description: 'Halaman peserta hanya dapat dibuka setelah autentikasi.' },
      { title: 'Profil dasar', description: 'Peserta dapat memperbarui informasi dasar yang digunakan untuk akun.' },
    ],
  },
  {
    id: 'scope-registration',
    number: '04',
    title: 'Pendaftaran kelas',
    summary: 'Mengubah minat calon peserta menjadi pendaftaran yang tercatat dan terhubung dengan akun.',
    icon: ClipboardCheck,
    items: [
      { title: 'Pilih program', description: 'Peserta memilih kelas dari katalog dan melihat detail sebelum mendaftar.' },
      { title: 'Data pendaftaran', description: 'Form pendaftaran terhubung dengan akun peserta.' },
      { title: 'Ringkasan pesanan', description: 'Sistem menampilkan kelas, harga, dan status pendaftaran.' },
      { title: 'Status transaksi', description: 'Status menunggu pembayaran, aktif, atau dibatalkan ditampilkan dengan jelas.' },
      { title: 'Invoice', description: 'Transaksi memiliki identitas pembayaran yang dapat dirujuk peserta dan admin.' },
    ],
  },
  {
    id: 'scope-payment',
    number: '05',
    title: 'Integrasi pembayaran otomatis',
    summary: 'Menyediakan alur pembayaran otomatis agar akses kelas tidak perlu diaktifkan satu per satu secara manual.',
    icon: CreditCard,
    items: [
      { title: 'Checkout otomatis', description: 'Menghubungkan proses checkout dengan sistem payment gateway.' },
      { title: 'QRIS dan Virtual Account', description: 'Metode pembayaran otomatis via QRIS dan Virtual Account perbankan.' },
      { title: 'Status pembayaran', description: 'Menerima dan menyimpan status berhasil, tertunda, atau gagal.' },
      { title: 'Aktivasi otomatis', description: 'Akses kelas aktif setelah pembayaran berhasil dikonfirmasi sistem.' },
      { title: 'Riwayat transaksi', description: 'Peserta dan admin dapat melihat status serta identitas transaksi.' },
      { title: 'Fallback admin', description: 'Admin dapat mengaktifkan akses secara manual ketika diperlukan.' },
    ],
  },
  {
    id: 'scope-dashboard',
    number: '06',
    title: 'Dashboard peserta',
    summary: 'Satu ruang untuk melihat kelas, jadwal, progress, dan aktivitas belajar.',
    icon: LayoutDashboard,
    items: [
      { title: 'Kelas yang dimiliki', description: 'Daftar kelas aktif dan kelas yang telah selesai.' },
      { title: 'Lanjutkan belajar', description: 'Tombol menuju materi terakhir yang dibuka peserta.' },
      { title: 'Jadwal terdekat', description: 'Ringkasan jadwal pertemuan dan informasi kelas.' },
      { title: 'Progress belajar', description: 'Persentase penyelesaian materi untuk setiap kelas.' },
      { title: 'Riwayat aktivitas', description: 'Catatan dasar materi yang dibuka dan diselesaikan.' },
      { title: 'Riwayat pembayaran', description: 'Daftar transaksi yang terkait dengan akun peserta.' },
    ],
  },
  {
    id: 'scope-material',
    number: '07',
    title: 'Struktur materi kelas',
    summary: 'Menyusun materi secara bertingkat agar peserta selalu tahu posisi dan langkah belajar berikutnya.',
    icon: BookOpen,
    items: [
      { title: 'Hierarki pembelajaran', description: 'Kelas, bab, pertemuan, dan submateri disusun secara teratur.' },
      { title: 'Video pembelajaran', description: 'Materi video dapat ditampilkan pada ruang belajar peserta.' },
      { title: 'Materi teks', description: 'Ringkasan atau penjelasan materi dapat dibaca langsung di platform.' },
      { title: 'File pendukung', description: 'PDF atau dokumen pendukung dapat ditempatkan pada materi terkait.' },
      { title: 'Status materi', description: 'Admin dapat menyimpan materi sebagai draft, menerbitkan, atau menyembunyikannya.' },
      { title: 'Urutan materi', description: 'Admin dapat mengatur urutan bab dan pertemuan.' },
    ],
  },
  {
    id: 'scope-access',
    number: '08',
    title: 'Kontrol akses materi',
    summary: 'Memastikan materi hanya tersedia untuk peserta yang memiliki akses pada kelas terkait.',
    icon: ShieldCheck,
    items: [
      { title: 'Akses per kelas', description: 'Hak akses dipisahkan berdasarkan kelas yang dimiliki peserta.' },
      { title: 'Proteksi halaman', description: 'Materi tidak hanya disembunyikan dari menu, tetapi diperiksa oleh sistem.' },
      { title: 'Akses otomatis', description: 'Akses diberikan setelah pembayaran terkonfirmasi.' },
      { title: 'Akses manual', description: 'Admin dapat memberikan akses khusus jika ada kebutuhan operasional.' },
      { title: 'Cabut akses', description: 'Admin dapat menonaktifkan atau mengaktifkan kembali akses peserta.' },
    ],
  },
  {
    id: 'scope-progress',
    number: '09',
    title: 'Progress dan riwayat belajar',
    summary: 'Menyediakan indikator perkembangan peserta tanpa menambahkan sistem evaluasi Paket Pro.',
    icon: PackageCheck,
    items: [
      { title: 'Tandai selesai', description: 'Peserta dapat menandai materi yang sudah dipelajari.' },
      { title: 'Materi terakhir', description: 'Sistem menyimpan posisi terakhir yang dibuka peserta.' },
      { title: 'Persentase progress', description: 'Progress dihitung berdasarkan materi yang telah diselesaikan.' },
      { title: 'Monitoring admin', description: 'Admin dapat melihat progress dasar setiap peserta.' },
    ],
  },
  {
    id: 'scope-admin',
    number: '10',
    title: 'Dashboard admin',
    summary: 'Menyediakan pusat pengelolaan peserta, kelas, materi, akses, dan transaksi.',
    icon: Settings2,
    items: [
      { title: 'Data peserta', description: 'Melihat, mencari, dan memeriksa data peserta terdaftar.' },
      { title: 'Data kelas', description: 'Mengatur judul, deskripsi, harga, jadwal, dan status kelas.' },
      { title: 'Manajemen materi', description: 'Menambah, mengubah, menghapus, dan mengurutkan materi.' },
      { title: 'Manajemen akses', description: 'Memberikan, mencabut, dan memulihkan akses kelas.' },
      { title: 'Status pembayaran', description: 'Melihat transaksi, status pembayaran, dan pendaftaran peserta.' },
      { title: 'Progress peserta', description: 'Melihat perkembangan belajar dasar per kelas.' },
    ],
  },
  {
    id: 'scope-launch',
    number: '11',
    title: 'Responsive, deployment, dan SEO dasar',
    summary: 'Mempersiapkan platform untuk digunakan secara nyata di berbagai perangkat.',
    icon: MonitorSmartphone,
    items: [
      { title: 'Responsive layout', description: 'Pengujian tampilan pada desktop, tablet, dan HP.' },
      { title: 'Domain dan SSL', description: 'Konfigurasi domain .com tahun pertama dan koneksi HTTPS.' },
      { title: 'Deployment', description: 'Menyiapkan environment produksi dan membuat website online.' },
      { title: 'SEO dasar', description: 'Judul, deskripsi, URL yang mudah dibaca, sitemap, dan metadata dasar.' },
      { title: 'Browser modern', description: 'Pengujian pada browser modern yang umum digunakan.' },
    ],
  },
  {
    id: 'scope-handover',
    number: '12',
    title: 'Training, handover, dan garansi',
    summary: 'Memastikan tim Al Madroj dapat mengoperasikan platform setelah proses pembangunan selesai.',
    icon: UsersRound,
    items: [
      { title: 'Training admin', description: 'Pelatihan pengelolaan peserta, kelas, materi, dan akses.' },
      { title: 'Handover akses', description: 'Penyerahan akun administrator, deployment, dan konfigurasi terkait.' },
      { title: 'Dokumentasi dasar', description: 'Panduan operasional dasar untuk aktivitas rutin admin.' },
      { title: 'Pengujian akhir', description: 'Verifikasi alur login, pendaftaran, pembayaran, akses, dan progress.' },
      { title: 'Garansi 30 hari', description: 'Perbaikan bug fungsi yang sesuai dengan scope setelah website live.' },
    ],
  },
];

const timeline = [
  { day: 'MINGGU 01', title: 'Discovery dan fondasi', text: 'Finalisasi konten, struktur halaman, kebutuhan akun, dan rancangan database.' },
  { day: 'MINGGU 02', title: 'Website dan akun', text: 'Pembangunan beranda, katalog, detail kelas, registrasi, dan login peserta.' },
  { day: 'MINGGU 03', title: 'Ruang belajar dan pembayaran', text: 'Dashboard peserta, materi bertingkat, progress, kontrol akses, dan integrasi gateway pembayaran.' },
  { day: 'MINGGU 04', title: 'Beta, handover, launch', text: 'Pengujian, revisi, deployment, training admin, dan serah terima.' },
];

const exclusions = [
  'Kuis dan evaluasi kelas.',
  'Sertifikat digital otomatis.',
  'Absensi kelas.',
  'Portal khusus pengajar.',
  'Advanced analytics dan laporan finansial.',
  'Notifikasi WhatsApp API otomatis.',
  'Aplikasi Android atau iOS native.',
  'Biaya transaksi gateway pembayaran dan layanan pihak ketiga.',
  'Perpanjangan domain setelah tahun pertama.',
  'Fitur baru di luar scope yang disepakati saat kickoff.',
];

export const RancanganPage: React.FC<{ onBackToProposal: () => void }> = ({ onBackToProposal }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Rancangan Paket Standard | Al Madroj';
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="scope-page min-h-screen bg-[#f4f5f1] text-[#17201c]">
      <header className="sticky top-0 z-30 border-b border-[#d8ddd7] bg-[#f4f5f1]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <a href="#top" className="flex min-h-11 items-center gap-3 text-sm font-semibold">
            <img src="/logo.svg" alt="Al Madroj" className="h-9 w-9 rounded-md bg-[#10251d] p-1.5" />
            <span className="hidden sm:block">Al Madroj</span>
          </a>
          <div className="hidden items-center gap-5 text-sm text-[#68756f] lg:flex">
            <a href="#ruang-lingkup" className="hover:text-[#10251d]">Ruang lingkup</a>
            <a href="#timeline" className="hover:text-[#10251d]">Timeline</a>
            <a href="#ketentuan" className="hover:text-[#10251d]">Ketentuan</a>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="hidden min-h-11 items-center gap-2 rounded-md border border-[#ccd4ce] bg-white px-4 text-sm font-semibold hover:border-[#10251d] sm:flex"><Printer className="h-4 w-4" />Cetak</button>
            <button onClick={onBackToProposal} className="hidden min-h-11 items-center gap-2 rounded-md bg-[#10251d] px-4 text-sm font-semibold text-white hover:bg-[#176148] sm:flex"><ArrowLeft className="h-4 w-4" />Proposal</button>
            <button onClick={() => setMenuOpen((value) => !value)} aria-label="Buka navigasi" aria-expanded={menuOpen} className="flex h-11 w-11 items-center justify-center rounded-md border border-[#ccd4ce] bg-white lg:hidden">{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        {menuOpen && <nav className="border-t border-[#d8ddd7] bg-[#f4f5f1] px-5 py-3 lg:hidden"><div className="mx-auto grid max-w-[1440px] gap-1 sm:flex sm:items-center sm:justify-end sm:gap-5"><a onClick={() => setMenuOpen(false)} href="#ruang-lingkup" className="flex min-h-11 items-center text-sm font-semibold">Ruang lingkup</a><a onClick={() => setMenuOpen(false)} href="#timeline" className="flex min-h-11 items-center text-sm font-semibold">Timeline</a><a onClick={() => setMenuOpen(false)} href="#ketentuan" className="flex min-h-11 items-center text-sm font-semibold">Ketentuan</a><button onClick={onBackToProposal} className="flex min-h-11 items-center gap-2 text-left text-sm font-semibold"><ArrowLeft className="h-4 w-4" />Kembali ke proposal</button></div></nav>}
      </header>

      <main id="top">
        <section className="border-b border-[#10251d] bg-[#10251d] px-5 pb-16 pt-14 text-white sm:px-8 sm:pb-20 sm:pt-20 lg:px-12 lg:pt-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-end">
              <div className="max-w-4xl">
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-[#f2b84b]">Rancangan proyek · Paket Standard</p>
                <h1 className="max-w-4xl text-[clamp(2.6rem,7vw,6.8rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-balance">Website kelas digital Al Madroj.</h1>
                <p className="mt-8 max-w-2xl text-base leading-7 text-[#c6d2cd] sm:text-lg">Platform mandiri untuk memperkenalkan program, menerima pendaftaran, memproses pembayaran, dan memberi akses belajar kepada peserta dalam satu alur yang rapi.</p>
              </div>
              <div className="rounded-lg border border-white/15 bg-white/8 p-5 lg:border-l-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#afc1b9]">Ringkasan investasi</p>
                <p className="mt-3 text-3xl font-semibold">Rp3.500.000</p>
                <div className="mt-5 space-y-3 text-sm"><MetaRow dark label="Estimasi" value="1 bulan" /><MetaRow dark label="Garansi" value="30 hari setelah launch" /><MetaRow dark label="Pembayaran" value="2 tahap" /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="ringkasan" className="scroll-mt-24 border-b border-[#d8ddd7] px-5 py-12 sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <SectionLabel number="00" title="Ringkasan" />
            <div className="grid gap-8 md:grid-cols-3"><SummaryCard icon={Globe2} title="Website publik" text="Etalase resmi untuk menjelaskan Al Madroj dan seluruh program kelas." /><SummaryCard icon={UsersRound} title="Akun peserta" text="Setiap peserta memiliki dashboard, akses kelas, dan progress belajar sendiri." /><SummaryCard icon={Server} title="Operasional terpusat" text="Admin mengelola kelas, materi, peserta, akses, dan transaksi dari satu panel." /></div>
          </div>
        </section>

        <section id="ruang-lingkup" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="hidden lg:block"><div className="sticky top-28"><SectionLabel number="01-12" title="Ruang lingkup" /><nav className="mt-8 space-y-1">{scopeSections.map((section) => <a key={section.id} href={'#' + section.id} className="flex items-center justify-between border-b border-[#dfe5df] py-2.5 text-xs text-[#68756f] transition hover:text-[#10251d]"><span>{section.number} {section.title}</span><ChevronRight className="h-3.5 w-3.5" /></a>)}</nav></div></aside>
            <div>
              <div className="mb-12 max-w-3xl"><p className="text-sm font-semibold text-[#176148]">Scope pekerjaan</p><h2 className="mt-2 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Semua bagian yang dibangun.</h2><p className="mt-5 text-base leading-7 text-[#68756f]">Setiap scope di bawah ini memiliki fungsi dan hasil yang bisa diperiksa saat beta maupun handover.</p></div>
              <div className="space-y-5">{scopeSections.map((section) => <ScopeBlock key={section.id} section={section} />)}</div>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-24 border-y border-[#d8ddd7] bg-[#e7eee9] px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[220px_minmax(0,1fr)]"><SectionLabel number="02" title="Timeline" /><div><div className="max-w-3xl"><p className="text-sm font-semibold text-[#176148]">Rencana pengerjaan</p><h2 className="mt-2 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Satu bulan, diuji bersama.</h2></div><div className="mt-10 border-t border-[#c7d5cb]">{timeline.map((item) => <div key={item.day} className="grid gap-3 border-b border-[#c7d5cb] py-5 sm:grid-cols-[120px_240px_minmax(0,1fr)] sm:items-start"><p className="font-mono text-sm text-[#68756f]">{item.day}</p><h3 className="font-semibold">{item.title}</h3><p className="max-w-xl text-sm leading-6 text-[#59655f]">{item.text}</p></div>)}</div></div></div>
        </section>

        <section id="ketentuan" className="scroll-mt-24 px-5 py-16 sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[220px_minmax(0,1fr)]"><SectionLabel number="03" title="Ketentuan" /><div className="space-y-16">
            <div><p className="text-sm font-semibold text-[#176148]">Skema pembayaran</p><h2 className="mt-2 text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Rencana pembayaran dua tahap.</h2><div className="mt-8 grid max-w-2xl gap-3 md:grid-cols-2"><PaymentStep step="01" label="DP 50%" amount="Rp1.750.000" detail="Saat kickoff perancangan." highlight /><PaymentStep step="02" label="Handover 50%" amount="Rp1.750.000" detail="Sebelum serah terima." /></div></div>
            <div><p className="text-sm font-semibold text-[#555]">Belum termasuk</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Batas paket harus jelas.</h2><div className="mt-7 grid gap-x-8 gap-y-3 sm:grid-cols-2">{exclusions.map((item) => <div key={item} className="flex items-start gap-3 border-b border-[#e3e3e0] py-3 text-sm text-[#555]"><X className="mt-0.5 h-4 w-4 shrink-0 text-[#777]" />{item}</div>)}</div></div>
            <div className="border-t border-[#10251d] pt-6"><div className="flex items-start gap-3"><BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#176148]" /><div><h3 className="font-semibold">Garansi perbaikan bug 30 hari</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68756f]">Garansi mencakup fungsi yang tidak berjalan sesuai scope, termasuk alur login, pendaftaran, pembayaran, akses materi, dan responsive layout. Perubahan fitur atau desain besar setelah handover menjadi scope baru.</p></div></div></div>
          </div></div>
        </section>

        <section className="border-t border-[#10251d] bg-[#10251d] px-5 py-16 text-white sm:px-8 sm:py-20 lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"><div><img src="/logo.svg" alt="Al Madroj" className="mb-6 h-11 w-11 rounded-lg bg-white p-2" /><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f2b84b]">Langkah berikutnya</p><h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">Kunci konten, lalu mulai dari fondasi.</h2><p className="mt-5 max-w-xl text-sm leading-6 text-[#b8c9c1]">Jumlah kelas, materi, dan kebutuhan migrasi konten dikunci saat kickoff. Penambahan setelah struktur disetujui dibahas sebagai perubahan scope.</p></div><div className="flex shrink-0 flex-col gap-3 sm:items-end"><a href={'https://wa.me/' + PROPOSAL_META.contactWhatsApp} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-[#f2b84b] px-5 text-sm font-semibold text-[#10251d] hover:bg-[#ffd176]">Diskusikan rancangan <ArrowUpRight className="h-4 w-4" /></a><button onClick={() => window.print()} className="flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-semibold text-[#c6d2cd] hover:text-white"><Printer className="h-4 w-4" />Cetak dokumen</button></div></div>
        </section>
      </main>
    </div>
  );
};

const SectionLabel = ({ number, title }: { number: string; title: string }) => <div><p className="font-mono text-xs text-[#68756f]">{number}</p><p className="mt-2 text-sm font-semibold">{title}</p></div>;
const MetaRow = ({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) => <div className={`flex justify-between gap-4 border-b pb-2 ${dark ? 'border-white/15 text-[#c6d2cd]' : 'border-[#d8ddd7] text-[#68756f]'}`}><span>{label}</span><span className={`font-semibold ${dark ? 'text-white' : 'text-[#17201c]'}`}>{value}</span></div>;
const SummaryCard = ({ icon: Icon, title, text }: { icon: React.ElementType; title: string; text: string }) => <article className="rounded-lg border border-[#d8ddd7] bg-white p-5"><Icon className="h-5 w-5 text-[#176148]" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#68756f]">{text}</p></article>;
const ScopeBlock = ({ section }: { section: ScopeSection }) => { const Icon = section.icon; return <article id={section.id} className="scroll-mt-24 rounded-lg border border-[#d8ddd7] bg-white p-5 sm:p-6"><div className="grid gap-6 lg:grid-cols-[90px_minmax(0,1fr)]"><div className="flex items-start justify-between lg:block"><span className="font-mono text-sm text-[#68756f]">{section.number}</span><Icon className="h-5 w-5 text-[#176148] lg:mt-7" /></div><div><h3 className="text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">{section.title}</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-[#68756f]">{section.summary}</p><div className="mt-7 grid gap-x-8 gap-y-0 sm:grid-cols-2">{section.items.map((item) => <div key={item.title} className="border-t border-[#e3e9e4] py-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1.5 text-sm leading-6 text-[#68756f]">{item.description}</p></div>)}</div></div></div></article>; };
const PaymentStep = ({ step, label, amount, detail, highlight = false }: { step: string; label: string; amount: string; detail: string; highlight?: boolean }) => <article className={`rounded-lg border p-5 ${highlight ? 'border-[#10251d] bg-[#10251d] text-white' : 'border-[#d8ddd7] bg-white text-[#17201c]'}`}><div className="flex items-center justify-between"><span className={`font-mono text-xs ${highlight ? 'text-[#afc1b9]' : 'text-[#68756f]'}`}>{step}</span><CircleDollarSign className={`h-5 w-5 ${highlight ? 'text-[#f2b84b]' : 'text-[#176148]'}`} /></div><p className={`mt-8 text-sm font-semibold ${highlight ? 'text-[#f2b84b]' : 'text-[#176148]'}`}>{label}</p><p className="mt-1 text-2xl font-semibold">{amount}</p><p className={`mt-3 text-sm leading-6 ${highlight ? 'text-[#c6d2cd]' : 'text-[#68756f]'}`}>{detail}</p></article>;

export default RancanganPage;
