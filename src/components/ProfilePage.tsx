import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AtSign,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  Globe2,
  GraduationCap,
  Mail,
  Menu,
  Music2,
  Play,
  UsersRound,
  X,
} from 'lucide-react';
import { galleryPhotos, GalleryPhoto, GalleryCategory } from '../data/galleryData';
import { GalleryLightboxModal } from './GalleryLightboxModal';

const reveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.16 },
  transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
};

const activities = [
  {
    icon: Globe2,
    title: 'Dakwah digital',
    text: 'Konten keislaman edukatif melalui media sosial untuk memperkenalkan khazanah ilmu Islam kepada masyarakat secara lebih luas.',
  },
  {
    icon: BookOpen,
    title: 'Kajian kitab turats',
    text: 'Kajian kitab-kitab turats secara daring maupun luring untuk mahasiswa dan pelajar di Mesir maupun Indonesia.',
  },
  {
    icon: GraduationCap,
    title: 'Bimbingan akademik',
    text: 'Program bimbingan belajar pra-ujian termin untuk membantu mahasiswa memahami dan mempersiapkan materi perkuliahan.',
  },
];

const leadershipGroups = [
  { title: 'Penasihat', members: ['Ust. Bagus Fadli, Lc., Dipl.'] },
  { title: 'Ketua', members: ['Ust. Ulul Albab Fatahilah, Lc., Dipl.'] },
  { title: 'Wakil Ketua I', members: ['Ust. Ahmad Fauzan, Lc., Dipl.'] },
  { title: 'Wakil Ketua II', members: ['Ust. Watra Sarajeva, Lc., M.A.'] },
  { title: 'Sekretaris & Bendahara', members: ['Ust. Zulfikar Aunillah, Lc., Dipl.'] },
  { title: 'Tim Media', members: ['Ust. Abdullah Haikal, Lc., Dipl.', 'Ust. Alif Firmansyah, Lc., Dipl.'] },
  { title: 'Hubungan Masyarakat', members: ['Ust. Muhammad Zaini Anwar, Lc., Dipl.'] },
];

const socialLinks = [
  { label: '@Almadraj_edu', platform: 'Instagram', href: 'https://instagram.com/almadraj_edu', icon: AtSign },
  { label: '@almadraj.academia', platform: 'Instagram', href: 'https://instagram.com/almadraj.academia', icon: AtSign },
  { label: '@tb.madraj', platform: 'Instagram', href: 'https://instagram.com/tb.madraj', icon: AtSign },
  { label: '@almadraj.edu', platform: 'TikTok', href: 'https://www.tiktok.com/@almadraj.edu', icon: Music2 },
  { label: 'Al-madraj Edu', platform: 'YouTube', href: 'https://www.youtube.com/results?search_query=Al-madraj+Edu', icon: Play },
];

export const ProfilePage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState<GalleryPhoto | null>(null);
  const [galleryCategory, setGalleryCategory] = useState<GalleryCategory>('Semua');
  const closeMenu = () => setMenuOpen(false);

  const visiblePhotos = galleryPhotos.filter(
    (photo) => galleryCategory === 'Semua' || photo.category === galleryCategory
  );

  return (
    <div className="website-page min-h-[100dvh] overflow-x-hidden bg-white font-sans text-[#17231b]">
      <a href="#profil-content" className="fixed left-3 top-3 z-[70] -translate-y-24 rounded-full bg-[#247d48] px-4 py-3 text-sm font-semibold text-white shadow-lg transition focus:translate-y-0">Lewati ke konten</a>

      <header className="relative z-50 border-b border-[#dce9df] bg-white/95 px-5 backdrop-blur sm:px-8 lg:px-10">
        <div className="mx-auto grid min-h-[72px] max-w-[1320px] items-center lg:grid-cols-[1fr_auto_1fr]">
          <a href="/" onClick={closeMenu} className="flex min-h-[64px] items-center gap-3">
            <img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-9 w-12 object-contain" />
            <span className="text-[15px] font-bold tracking-[0.04em] text-[#006d77]">AL MADRAJ</span>
          </a>
          <nav aria-label="Navigasi profil" className="hidden items-center gap-7 text-sm font-semibold text-[#557064] lg:flex">
            <a href="/#katalog" className="hover:text-[#006d77]">Katalog</a>
            <a href="/#cara-belajar" className="hover:text-[#006d77]">Cara belajar</a>
            <a href="#sejarah" className="hover:text-[#006d77]">Sejarah</a>
            <a href="#galeri" className="hover:text-[#006d77]">Galeri</a>
            <a href="/profil" className="text-[#006d77]">Profil Al-Madraj</a>
          </nav>
          <div className="hidden items-center justify-end gap-5 lg:flex">
            <a href="/login?next=/kelas" className="text-sm font-semibold text-[#557064] hover:text-[#247d48]">Login</a>
            <a href="/login?next=/kelas" className="flex min-h-11 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white hover:bg-[#00565e]">Mulai belajar <ArrowUpRight className="h-4 w-4" /></a>
          </div>
          <button onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'} aria-expanded={menuOpen} className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border border-[#c2dfca] bg-white lg:hidden">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && (
          <nav className="border-t border-[#dce9df] py-3 lg:hidden">
            <div className="mx-auto grid max-w-[1320px] gap-1">
              <a onClick={closeMenu} href="/#katalog" className="flex min-h-11 items-center text-sm font-semibold">Katalog</a>
              <a onClick={closeMenu} href="/#cara-belajar" className="flex min-h-11 items-center text-sm font-semibold">Cara belajar</a>
              <a onClick={closeMenu} href="#sejarah" className="flex min-h-11 items-center text-sm font-semibold">Sejarah</a>
              <a onClick={closeMenu} href="#galeri" className="flex min-h-11 items-center text-sm font-semibold">Galeri Dokumentasi</a>
              <a onClick={closeMenu} href="/profil" className="flex min-h-11 items-center text-sm font-semibold text-[#006d77]">Profil Al-Madraj</a>
              <a onClick={closeMenu} href="/login?next=/kelas" className="flex min-h-11 items-center text-sm font-semibold text-[#247d48]">Login</a>
            </div>
          </nav>
        )}
      </header>

      <main id="profil-content">
        <section className="border-b border-[#dce9df] bg-[#eef8f2] px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-[1160px] gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <motion.div {...reveal}>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]"><BookOpen className="h-4 w-4" />Profil Al-Madraj Edu</p>
              <h1 className="mt-5 max-w-3xl text-5xl font-normal leading-[0.94] tracking-[-0.04em] text-[#006d77] sm:text-7xl">Ruang belajar dan dakwah untuk generasi Muslim masa kini.</h1>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="border-l border-[#abd4b9] pl-5 text-base leading-7 text-[#557064] sm:pl-7 sm:text-lg">
              <p>Al-Madraj lahir dari semangat untuk menjembatani khazanah keilmuan Islam klasik dengan kebutuhan pembelajar masa kini.</p>
              <a href="#sejarah" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#006d77] hover:text-[#006d77]">Baca profil <ArrowDownIcon /></a>
            </motion.div>
          </div>
        </section>

        <section id="sejarah" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[.7fr_1.3fr]">
            <motion.div {...reveal}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#247d48]">Tentang Al-Madraj</p>
              <h2 className="mt-4 max-w-md text-4xl font-normal leading-[0.98] tracking-[-0.03em] text-[#17382c] sm:text-6xl">Berangkat dari tradisi, hadir melalui cara yang relevan.</h2>
            </motion.div>
            <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.08 }} className="space-y-5 text-base leading-7 text-[#557064]">
              <p>Al-Madraj Edu didirikan pada 28 Juni 2023, bertepatan dengan 10 Dzulhijjah 1444 H, oleh para alumni Rumah Syariah Mesir Angkatan ke-7. Al-Madraj lahir dari semangat untuk menghadirkan ruang belajar dan dakwah Islam yang dapat menjembatani khazanah keilmuan Islam klasik dengan kebutuhan generasi Muslim masa kini.</p>
              <p>Sejak awal berdirinya, Al-Madraj dikembangkan sebagai platform dakwah dan pendidikan Islam yang memanfaatkan media digital sebagai salah satu sarana utama dalam menyebarkan ilmu. Melalui media sosial, khususnya Instagram, Al-Madraj secara aktif menyajikan berbagai konten keislaman yang edukatif, sekaligus menjadi ruang untuk memperkenalkan khazanah keilmuan Islam kepada masyarakat secara lebih luas.</p>
              <p>Tidak hanya bergerak di ruang digital, Al-Madraj juga aktif menyelenggarakan kajian kitab-kitab turats secara daring maupun luring. Kegiatan ini ditujukan terutama bagi mahasiswa dan pelajar, baik yang sedang menempuh pendidikan di Mesir maupun di Indonesia.</p>
              <p>Di lingkungan mahasiswa Universitas Al-Azhar Kairo, Mesir, Al-Madraj juga memiliki perhatian khusus terhadap pengembangan akademik mahasiswa melalui program bimbingan belajar pra-ujian termin.</p>
              <p>Dengan memadukan dakwah digital, kajian turats, dan kegiatan pendidikan, Al-Madraj terus berupaya menjadi ruang bertumbuh bagi generasi pembelajar yang memiliki kedalaman ilmu, keluasan wawasan, serta semangat untuk menjaga dan meneruskan tradisi keilmuan Islam.</p>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-[#dce9df] bg-[#f7fbf8] px-5 py-12 sm:px-8 lg:px-10">
          <div className="mx-auto grid max-w-[1160px] gap-3 sm:grid-cols-3">
            <ProfileFact icon={CalendarDays} label="Didirikan" value="28 Juni 2023" detail="10 Dzulhijjah 1444 H" />
            <ProfileFact icon={UsersRound} label="Penggagas" value="Alumni Rumah Syariah Mesir" detail="Angkatan ke-7" />
            <ProfileFact icon={Building2} label="Jangkauan" value="Mesir dan Indonesia" detail="Daring maupun luring" />
          </div>
        </section>

        <section className="px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-[1160px]">
            <motion.div {...reveal} className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#247d48]">Ruang gerak</p>
              <h2 className="mt-4 text-4xl font-normal leading-[0.98] tracking-[-0.03em] text-[#17382c] sm:text-6xl">Tiga cara Al-Madraj menjaga alur belajar.</h2>
            </motion.div>
            <div className="mt-10 grid gap-3 lg:grid-cols-3">
              {activities.map((activity, index) => (
                <motion.article key={activity.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.06 }} className="border-t-2 border-[#b8ddc3] pt-5">
                  <activity.icon className="h-5 w-5 text-[#006d77]" />
                  <h3 className="mt-5 text-xl font-semibold text-[#17382c]">{activity.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#557064]">{activity.text}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Galeri & Dokumentasi Lengkap Kegiatan Al-Madraj */}
        <section id="galeri" className="scroll-mt-20 border-t border-[#dce9df] bg-[#f7fbf8] px-5 py-16 sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto max-w-[1240px]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <motion.div {...reveal} className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#247d48]">
                  Arsip &amp; Dokumentasi
                </p>
                <h2 className="mt-4 text-4xl font-normal leading-[0.98] tracking-[-0.03em] text-[#17382c] sm:text-6xl">
                  Potret nyata perjalanan belajar di Kairo.
                </h2>
                <p className="mt-4 text-base leading-7 text-[#557064]">
                  Dokumentasi otentik kegiatan talaqqi kitab turats, bimbingan imtihan mahasiswa Universitas Al-Azhar, dan silaturahmi para pembelajar bersama Al Madraj Edu.
                </p>
              </motion.div>

              {/* Filter Kategori Foto */}
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-[#d6e7dc] bg-[#edf6f0] p-1.5 self-start lg:self-end">
                {(['Semua', 'Dars', 'Bimbel', 'Komunitas'] as const).map((cat) => {
                  const count = cat === 'Semua' ? galleryPhotos.length : galleryPhotos.filter((p) => p.category === cat).length;
                  const label = cat === 'Semua' ? `Semua (${count})` : cat === 'Dars' ? `Dars Turats (${count})` : cat === 'Bimbel' ? `Bimbel Imtihan (${count})` : `Komunitas (${count})`;
                  return (
                    <button
                      key={cat}
                      onClick={() => setGalleryCategory(cat)}
                      className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                        galleryCategory === cat
                          ? 'bg-[#006d77] text-white shadow-xs'
                          : 'text-[#587365] hover:text-[#006d77]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid Semua Foto Dokumentasi */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {visiblePhotos.map((photo, index) => (
                <motion.figure
                  key={photo.id}
                  {...reveal}
                  transition={{ ...reveal.transition, delay: index * 0.04 }}
                  onClick={() => setSelectedGalleryPhoto(photo)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedGalleryPhoto(photo);
                  }}
                  aria-label={`Buka foto ${photo.title}`}
                  className="group flex flex-col cursor-pointer overflow-hidden rounded-[22px] border border-[#d6e7dc] bg-white shadow-[0_4px_18px_rgba(7,84,71,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#8fd0aa] hover:shadow-[0_18px_38px_rgba(7,84,71,0.12)]"
                >
                  <div className="aspect-[4/3] w-full overflow-hidden bg-[#e5f2ea]">
                    <img
                      src={photo.src}
                      alt={photo.title}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                      loading="lazy"
                    />
                  </div>

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

            <div className="mt-8 flex items-center justify-between border-t border-[#e2ede6] pt-4 text-xs text-[#6f8a7a]">
              <span>Dokumentasi otentik kegiatan mahasiswa Universitas Al-Azhar Kairo bersama Al Madraj Edu</span>
              <span className="font-semibold text-[#006d77]">Klik foto untuk melihat ukuran penuh</span>
            </div>
          </div>
        </section>

        <section className="border-y border-[#dce9df] bg-[#006d77] px-5 py-16 text-white sm:px-8 sm:py-24 lg:px-10">
          <div className="mx-auto grid max-w-[1160px] gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <motion.div {...reveal}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#83c5be]">Pendiri dan pengurus</p>
              <h2 className="mt-4 text-4xl font-normal leading-[0.98] tracking-[-0.03em] sm:text-6xl">Dikembangkan bersama oleh alumni Rumah Syariah Mesir.</h2>
              <p className="mt-6 max-w-md text-sm leading-6 text-[#c9eee0]">Al-Madraj didirikan dan dikembangkan oleh alumni Rumah Syariah Mesir Angkatan ke-7.</p>
            </motion.div>
            <div className="grid gap-3 sm:grid-cols-2">
              {leadershipGroups.map((group, index) => (
                <motion.article key={group.title} {...reveal} transition={{ ...reveal.transition, delay: index * 0.04 }} className="rounded-2xl border border-white/15 bg-white/[0.06] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#83c5be]">{group.title}</p>
                  <div className="mt-3 space-y-1.5 text-sm leading-5 text-white">{group.members.map((member) => <p key={member}>{member}</p>)}</div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#e8f5ed] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="mx-auto flex max-w-[1160px] flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#247d48]">Lanjutkan</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-normal leading-[0.98] tracking-[-0.03em] text-[#17382c] sm:text-6xl">Kenali ruang belajar Al-Madraj.</h2>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <a href="/#katalog" className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white hover:bg-[#01757f]">Lihat katalog <ArrowRight className="h-4 w-4" /></a>
              <a href="mailto:admin@almadraj.com" className="inline-flex items-center gap-2 text-sm font-semibold text-[#006d77]"><Mail className="h-4 w-4" />admin@almadraj.com</a>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-[1160px] border-t border-[#cfe5d6] pt-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#7b9280]">Ikuti Al-Madraj</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {socialLinks.map(({ label, platform, href, icon: Icon }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#b8d8c1] bg-white/70 px-3.5 text-xs font-semibold text-[#315747] hover:border-[#006d77] hover:text-[#006d77]" aria-label={`${platform} ${label}`}>
                  <Icon className="h-3.5 w-3.5" />{label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#cfe5d6] bg-[#f7fbf8] px-5 py-6 text-xs text-[#6e8775] sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[1160px] flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Al-Madraj Edu</span>
          <a href="/" className="font-semibold text-[#006d77] hover:text-[#006d77]">Kembali ke Al Madraj <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></a>
        </div>
      </footer>

      {selectedGalleryPhoto && (
        <GalleryLightboxModal
          photo={selectedGalleryPhoto}
          photos={visiblePhotos}
          onClose={() => setSelectedGalleryPhoto(null)}
          onSelectPhoto={(photo) => setSelectedGalleryPhoto(photo)}
        />
      )}
    </div>
  );
};

const ProfileFact = ({ icon: Icon, label, value, detail }: { icon: React.ElementType; label: string; value: string; detail: string }) => (
  <article className="rounded-2xl border border-[#cfe5d6] bg-white p-5">
    <Icon className="h-5 w-5 text-[#006d77]" />
    <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-[#7b9280]">{label}</p>
    <p className="mt-2 text-lg font-semibold text-[#17382c]">{value}</p>
    <p className="mt-1 text-sm text-[#6e8775]">{detail}</p>
  </article>
);

const ArrowDownIcon = () => <ArrowRight className="h-4 w-4 rotate-90" />;

export default ProfilePage;
