export type GalleryCategory = 'Semua' | 'Dars' | 'Bimbel' | 'Komunitas';

export type GalleryPhoto = {
  id: string;
  src: string;
  title: string;
  subtitle: string;
  location: string;
  category: 'Dars' | 'Bimbel' | 'Komunitas';
  tag: string;
  description: string;
};

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: 'halaqah',
    src: '/gallery/almadraj-halaqah-santri.jpg',
    title: 'Halaqah Pembahasan Maddah',
    subtitle: 'Halaqah Masisir · Kairo',
    location: 'Kairo, Mesir',
    category: 'Dars',
    tag: 'Dars Turats',
    description: 'Diskusi kelompok dan pembedahan ibarat kitab bersama mentor dan rekan mahasiswa Al-Azhar.',
  },
  {
    id: 'tafsir',
    src: '/gallery/almadraj-rumah-juang-tafsir.jpg',
    title: 'Kajian Tafsir Ayat Al-Ahkam',
    subtitle: 'Rumah Juang · Fak. Syariah',
    location: 'Rumah Juang, Kairo',
    category: 'Dars',
    tag: 'Tafsir Ahkam',
    description: 'Pembahasan kitab tafsir muqarrar perkuliahan Al-Azhar secara runtut dan mendalam.',
  },
  {
    id: 'tajwid',
    src: '/gallery/almadraj-tajwid-qawl-sadid.jpg',
    title: 'Kelas Tajwid Al-Qawl As-Sadid',
    subtitle: 'Talaqqi Tajwid · Kairo',
    location: 'Ruang Masisir, Kairo',
    category: 'Dars',
    tag: 'Tajwid & Tahsin',
    description: 'Sesi talaqqi, makharijul huruf, dan kaidah tajwid berbasis matan kitab turats.',
  },
  {
    id: 'khayamiya',
    src: '/gallery/almadraj-khayamiya-gathering.jpg',
    title: 'Silaturahmi Pembelajar Masisir',
    subtitle: 'Tenda Khayamiya · Kairo',
    location: 'Tenda Khayamiya, Kairo',
    category: 'Komunitas',
    tag: 'Komunitas Masisir',
    description: 'Pertemuan akrab mahasiswa dan pembelajar Al Madraj di bawah tenda tradisional Mesir.',
  },
  {
    id: 'sinai-maddah',
    src: '/gallery/almadraj-sinai-maddah.jpg',
    title: 'Pendampingan Kuliah & Imtihan',
    subtitle: 'Rumah Sinai · Bimbel Imtihan',
    location: 'Rumah Sinai, Kairo',
    category: 'Bimbel',
    tag: 'Bimbel Imtihan',
    description: 'Sesi penguatan materi kuliah, pembahasan soal imtihan termin lalu, dan tanya jawab diktat.',
  },
  {
    id: 'sinai-wisuda',
    src: '/gallery/almadraj-rumah-sinai-wisuda.jpg',
    title: 'Bimbel Imtihan Pra-Ujian',
    subtitle: 'Rumah Sinai · Mahasiswa Al-Azhar',
    location: 'Rumah Sinai, Kairo',
    category: 'Bimbel',
    tag: 'Bimbel Terpadu',
    description: 'Keluarga pembelajar Al Madraj berkumpul usai pendampingan intensif masa imtihan.',
  },
  {
    id: 'adab',
    src: '/gallery/almadraj-rumah-juang-adab.jpg',
    title: 'Kajian Adab Arab & Turats',
    subtitle: 'Rumah Juang · Fak. Lughah',
    location: 'Rumah Juang, Kairo',
    category: 'Dars',
    tag: 'Sastra Arab',
    description: 'Murojaah dan bedah materi Mabahits fi Ajnas Al-Adab Al-Arabi bersama penuntut ilmu.',
  },
  {
    id: 'mabit',
    src: '/gallery/almadraj-mabit-khayamiya.jpg',
    title: 'Temu Ramah & Ukhuwah Pembelajar',
    subtitle: 'Ukhuwah Masisir · Kairo',
    location: 'Kairo, Mesir',
    category: 'Komunitas',
    tag: 'Ukhuwah Masisir',
    description: 'Membangun kebersamaan dan ritme belajar yang sehat bersama komunitas Masisir.',
  },
];

// 3 foto terpilih untuk landing page yang mewakili Dars, Bimbel, dan Komunitas
export const landingGalleryPhotos: GalleryPhoto[] = [
  galleryPhotos[0], // Halaqah Pembahasan Maddah (Dars)
  galleryPhotos[4], // Pendampingan Kuliah & Imtihan (Bimbel)
  galleryPhotos[3], // Silaturahmi Pembelajar Masisir (Komunitas)
];

export const getCourseCoverImage = (idOrTitle: string, faculty?: string): string => {
  const norm = `${idOrTitle || ''} ${faculty || ''}`.toLowerCase();
  if (norm.includes('fikih') || norm.includes('syuja') || norm.includes('syariah')) {
    return '/courses/cover-fikih-matan-abi-syuja.png';
  }
  if (norm.includes('ithaf') || (norm.includes('aqidah') && !norm.includes('hujjah'))) {
    return '/courses/cover-aqidah-ithaf-al-murid.png';
  }
  if (norm.includes('tajwid') || norm.includes('sifatul') || norm.includes('huruf') || norm.includes('quran')) {
    return '/courses/cover-tajwid-online.png';
  }
  if (norm.includes('adudiyah') || norm.includes('adudiyyah') || norm.includes('risalah')) {
    return '/courses/cover-risalah-al-adudiyah.png';
  }
  if (norm.includes('hujjah') || norm.includes('ahli sunah') || norm.includes('sunnah')) {
    return '/courses/cover-hujjah-ahli-sunnah.png';
  }
  return '/courses/cover-fikih-matan-abi-syuja.png';
};

