export type CourseLessonItem = {
  sortOrder: number;
  title: string;
  youtubeId: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  duration?: string;
  description?: string;
};

export type CourseDetail = {
  slug: string;
  title: string;
  kitabName: string;
  authorName: string;
  faculty: 'Syariah' | 'Ushuluddin' | 'Lughah Arabiyyah';
  programType: 'Dars' | 'Bimbel';
  tutorName: string;
  tutorTitle: string;
  tutorBio: string;
  tutorAlmamater: string;
  price: number;
  priceFormatted: string;
  duration: string;
  schedule: string;
  channelName: string;
  overview: string;
  outcomes: string[];
  targetAudience: string[];
  facilities: string[];
  lessons: CourseLessonItem[];
};

export const COURSES_DETAIL_DATA: Record<string, CourseDetail> = {
  'kajian-tajwid-online': {
    slug: 'kajian-tajwid-online',
    title: 'Kajian Tajwid Online',
    kitabName: 'Kaidah Ilmu Tajwid & Sifatul Huruf',
    authorName: 'Ustadz Ziyad Ayaturrahman, Lc., Dipl.',
    faculty: 'Lughah Arabiyyah',
    programType: 'Dars',
    tutorName: 'Ustadz Ziyad Ayaturrahman, Lc., Dipl.',
    tutorTitle: 'Mentor Tajwid & Qira\'at Al-Qur\'an',
    tutorBio: 'Alumni Universitas Al-Azhar Kairo dengan spesialisasi tahsin, makharijul huruf, dan disiplin qira\'at mutawatirah.',
    tutorAlmamater: 'Universitas Al-Azhar, Kairo',
    price: 0,
    priceFormatted: 'Gratis',
    duration: '3 pertemuan',
    schedule: 'Akses kapan saja (Self-paced)',
    channelName: 'Al-Madraj Edu',
    overview: 'Dauroh kajian tajwid aplikatif yang dirancang khusus untuk membedah kaidah pelafalan makhraj huruf hijaiyyah, sifat lazimah dan \'aridlah, serta hukum nun sukun, mim sukun, dan mad secara fasih sesuai kaidah riwayat Hafsh \'an \'Ashim.',
    outcomes: [
      'Membedah titik makhraj huruf agar terhindar dari lahn jaliy (kesalahan fatal) dan lahn khafiy.',
      'Memahami sifat tebal (tafkhim) dan tipis (tarqiq) pada huruf isti\'la dan istifal secara presisi.',
      'Menguasai hukum nun sukun, tanwin, mim sukun, idgham, ikhfa, dan iqlab secara tartil.',
      'Praktik talaqqi mandiri melalui audio dan video peragaan makhraj dari pengajar.'
    ],
    targetAudience: [
      'Mahasiswa Al-Azhar yang ingin memperkokoh tahsin sebelum ujian tilawah dan hifdzul Qur\'an.',
      'Santri dan pelajar yang ingin memperbaiki kualitas bacaan Al-Qur\'an sesuai kaidah tajwid mu\'tamad.',
      'Masyarakat umum pembelajar Al-Qur\'an dari dasar hingga mahir.'
    ],
    facilities: [
      'Akses gratis seluruh rekaman video kajian di Al-Madraj Edu',
      'Video demonstrasi makhraj & sifat huruf dari Kairo',
      'Materi catatan kaidah tajwid ringkas & mudah dihafal',
      'Tersimpan di dashboard akun mahasiswa untuk muroja\'ah kapan saja'
    ],
    lessons: [
      {
        sortOrder: 1,
        title: 'Pertemuan pertama - Dauroh Kajian Tajwid',
        youtubeId: 'BrFTpmC-Or0',
        youtubeUrl: 'https://youtu.be/BrFTpmC-Or0',
        thumbnailUrl: 'https://i.ytimg.com/vi/BrFTpmC-Or0/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pengantar ilmu tajwid, urgensi makharijul huruf, dan adab-adab mulia pembaca Al-Qur\'an.'
      },
      {
        sortOrder: 2,
        title: 'Pertemuan ke-2 - Dauroh Kajian Tajwid',
        youtubeId: 'C7vvg8Q_TE0',
        youtubeUrl: 'https://youtu.be/C7vvg8Q_TE0',
        thumbnailUrl: 'https://i.ytimg.com/vi/C7vvg8Q_TE0/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pembahasan sifatul huruf (Hams, Jahr, Syiddah, Rakhawah), serta ahkam nun sukun dan tanwin.'
      },
      {
        sortOrder: 3,
        title: 'Pertemuan ke-3 - Dauroh Kajian Tajwid',
        youtubeId: 'mQ3wpX2k70g',
        youtubeUrl: 'https://youtu.be/mQ3wpX2k70g',
        thumbnailUrl: 'https://i.ytimg.com/vi/mQ3wpX2k70g/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Kaidah Mad dan Qashr, hukum waqaf wal ibtida\', serta penutupan talaqqi surah-surah pilihan.'
      }
    ]
  },

  'kajian-fikih-matan-abi-syuja': {
    slug: 'kajian-fikih-matan-abi-syuja',
    title: 'Kajian Fikih Matan Abi Syuja\'',
    kitabName: 'Al-Ghayah wa at-Taqrib (Matan Abi Syuja\')',
    authorName: 'Al-Qadhi Ahmad bin al-Husain Abu Syuja\' al-Ashfahani',
    faculty: 'Syariah',
    programType: 'Dars',
    tutorName: 'Ustaz Alif Watra Sarajeva, Lc., Dipl.',
    tutorTitle: 'Dewan Guru & Pengajar Turats Rumah Syariah Mesir',
    tutorBio: 'Alumni Fakultas Syariah Islamiyyah Universitas Al-Azhar Kairo. Aktif mengajar dars turats fikih mazhab Syafi\'i dan membimbing mahasiswa di Kairo.',
    tutorAlmamater: 'Fakultas Syariah Islamiyyah Univ. Al-Azhar, Kairo',
    price: 200000,
    priceFormatted: 'Rp200.000',
    duration: '25 pertemuan',
    schedule: 'Akses kapan saja (16 video siap tonton)',
    channelName: 'Al-Madraj Edu',
    overview: 'Kajian fikih komprehensif bermazhab Syafi\'i yang membedah matan rujukan Matan Abi Syuja\' (Ghayat al-Ikhtishar) kata demi kata. Dirancang membantu mahasiswa memetakan dhabith, ta\'lil, dan rincian furu\'iyah fikih ibadah hingga muamalah secara runtut dan terstruktur.',
    outcomes: [
      'Memahami ibarat turats fikih matan klasik dengan penjelasan lugas dan terarah.',
      'Memetakan syarat, rukun, sunnah, dan pembatal ibadah (Thaharah, Shalat, Jenazah, Zakat, Puasa, Haji).',
      'Mengetahui pendapat mu\'tamad dalam mazhab Syafi\'i yang sering diujikan pada imtihan kuliah.',
      'Membangun pondasi kokoh sebelum mempelajari kitab lanjutan seperti Fathul Qarib dan Kifayatul Akhyar.'
    ],
    targetAudience: [
      'Mahasiswa Fakultas Syariah Islamiyyah & Dirasat Islamiyyah Universitas Al-Azhar Kairo.',
      'Santri pondok pesantren dan alumni yang ingin mematangkan fikih Syafi\'iyyah secara manhaji.',
      'Pembelajar yang ingin memahami hukum ibadah sehari-hari berdasarkan dalil dan kaidah mazhab.'
    ],
    facilities: [
      '16 Video pembelajaran YouTube Al-Madraj Edu dengan visual jernih',
      'Akses ke bab-bab lanjutan yang terus di-update secara berkala',
      'Diktat teks matan Abi Syuja\' & catatan faedah ibarat kitab',
      'Watermark proteksi akun dan tracker progress belajar otomatis'
    ],
    lessons: [
      {
        sortOrder: 1,
        title: 'Dars Matan Abu Syuja\' (Pertemuan-1)',
        youtubeId: 'LqylY5ovn_8',
        youtubeUrl: 'https://youtu.be/LqylY5ovn_8',
        thumbnailUrl: 'https://i.ytimg.com/vi/LqylY5ovn_8/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Muqaddimah Ilmu Fikih, Biografi Pengarang, dan Pengantar Kitab Thaharah.'
      },
      {
        sortOrder: 2,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-2)',
        youtubeId: 'V-2adEO-hGg',
        youtubeUrl: 'https://youtu.be/V-2adEO-hGg',
        thumbnailUrl: 'https://i.ytimg.com/vi/V-2adEO-hGg/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pembagian jenis air bersuci, hukum wadah bejana, dan kesunnahan siwak.'
      },
      {
        sortOrder: 3,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-3)',
        youtubeId: '_Fc86zNl0q4',
        youtubeUrl: 'https://youtu.be/_Fc86zNl0q4',
        thumbnailUrl: 'https://i.ytimg.com/vi/_Fc86zNl0q4/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Fardhu-fardhu wudhu, rukun, dan sunnah-sunnah dalam berwudhu.'
      },
      {
        sortOrder: 4,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-4)',
        youtubeId: 'Wn0Z1rVmjaQ',
        youtubeUrl: 'https://youtu.be/Wn0Z1rVmjaQ',
        thumbnailUrl: 'https://i.ytimg.com/vi/Wn0Z1rVmjaQ/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Adab istinja\', hal-hal yang membatalkan wudhu, dan kewajiban mandi junub.'
      },
      {
        sortOrder: 5,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-5)',
        youtubeId: 'HiebLgYZDOQ',
        youtubeUrl: 'https://youtu.be/HiebLgYZDOQ',
        thumbnailUrl: 'https://i.ytimg.com/vi/HiebLgYZDOQ/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Mengusap khuff, rukun & syarat tayammum, serta cara menyucikan berbagai najis.'
      },
      {
        sortOrder: 6,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-6)',
        youtubeId: '19K5nbumSbg',
        youtubeUrl: 'https://youtu.be/19K5nbumSbg',
        thumbnailUrl: 'https://i.ytimg.com/vi/19K5nbumSbg/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Bab darah wanita (Haid, Nifas, Istihadhah) dan pengantar Kitab Shalat Fardhu.'
      },
      {
        sortOrder: 7,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-7)',
        youtubeId: 'd76T_1WV_mU',
        youtubeUrl: 'https://youtu.be/d76T_1WV_mU',
        thumbnailUrl: 'https://i.ytimg.com/vi/d76T_1WV_mU/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Syarat wajib & sah shalat, rukun shalat 18 perkara, dan perbedaan laki-laki/perempuan.'
      },
      {
        sortOrder: 8,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-8)',
        youtubeId: 'IA8WG3tFGbQ',
        youtubeUrl: 'https://youtu.be/IA8WG3tFGbQ',
        thumbnailUrl: 'https://i.ytimg.com/vi/IA8WG3tFGbQ/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pembatal shalat, rukun rakaat, sujud sahwi, waktu makruh shalat, dan shalat sunnah.'
      },
      {
        sortOrder: 9,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-9)',
        youtubeId: 'uNgG_XUMbNg',
        youtubeUrl: 'https://youtu.be/uNgG_XUMbNg',
        thumbnailUrl: 'https://i.ytimg.com/vi/uNgG_XUMbNg/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Shalat berjamaah, kriteria imam dan makmum, serta shalat musafir (Qashar & Jama\').'
      },
      {
        sortOrder: 10,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-10)',
        youtubeId: 'XeUsGMhI68A',
        youtubeUrl: 'https://youtu.be/XeUsGMhI68A',
        thumbnailUrl: 'https://i.ytimg.com/vi/XeUsGMhI68A/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Shalat Jum\'at, syarat khutbah, shalat dua hari raya (Idain), shalat gerhana, dan istisqa\'.'
      },
      {
        sortOrder: 11,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-11)',
        youtubeId: '3z4BZ6HTPPs',
        youtubeUrl: 'https://youtu.be/3z4BZ6HTPPs',
        thumbnailUrl: 'https://i.ytimg.com/vi/3z4BZ6HTPPs/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Shalat khauf, larangan sutra & emas, serta kewajiban merawat jenazah muslim.'
      },
      {
        sortOrder: 12,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-12)',
        youtubeId: 'j2ndt415wSU',
        youtubeUrl: 'https://youtu.be/j2ndt415wSU',
        thumbnailUrl: 'https://i.ytimg.com/vi/j2ndt415wSU/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Kafan, tata cara shalat jenazah, adab pemakaman kubur, dan hukum ta\'ziyah.'
      },
      {
        sortOrder: 13,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-13)',
        youtubeId: '0phO_rNI3Sk',
        youtubeUrl: 'https://youtu.be/0phO_rNI3Sk',
        thumbnailUrl: 'https://i.ytimg.com/vi/0phO_rNI3Sk/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Kitab Zakat: Nisab dan syarat zakat hewan ternak, emas perak, pertanian, dan tijarah.'
      },
      {
        sortOrder: 14,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-14)',
        youtubeId: 'SMp4aQm5hEc',
        youtubeUrl: 'https://youtu.be/SMp4aQm5hEc',
        thumbnailUrl: 'https://i.ytimg.com/vi/SMp4aQm5hEc/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Zakat fitrah, 8 asnaf mustahiq zakat, serta pengantar Kitab Puasa Ramadhan.'
      },
      {
        sortOrder: 15,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-15)',
        youtubeId: 'GzB3kt3QbC8',
        youtubeUrl: 'https://youtu.be/GzB3kt3QbC8',
        thumbnailUrl: 'https://i.ytimg.com/vi/GzB3kt3QbC8/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Rukun & syarat puasa, qadha dan fidyah, hukum i\'tikaf, dan Kitab Haji Umrah.'
      },
      {
        sortOrder: 16,
        title: 'Dars Matan Abi Syuja\' (Pertemuan-16)',
        youtubeId: 'jcQYEQ6VoGY',
        youtubeUrl: 'https://youtu.be/jcQYEQ6VoGY',
        thumbnailUrl: 'https://i.ytimg.com/vi/jcQYEQ6VoGY/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Syarat & rukun haji, kewajiban ihram dari miqat, serta rincian dam pelanggaran.'
      }
    ]
  },

  'kajian-aqidah-ithaf-al-murid': {
    slug: 'kajian-aqidah-ithaf-al-murid',
    title: 'Kajian Aqidah Ithaf al-Murid',
    kitabName: 'Ithaf al-Murid bi Syarh Jawharat at-Tawhid',
    authorName: 'Syaikh Ibrahim al-Bajuri / Imam Ibrahim al-Laqqani',
    faculty: 'Ushuluddin',
    programType: 'Dars',
    tutorName: 'Ustaz Ulul Albab Fatahillah, Lc., Dipl.',
    tutorTitle: 'Mentor Aqidah & Mantiq Ushuluddin Kairo',
    tutorBio: 'Alumni Fakultas Ushuluddin Universitas Al-Azhar Kairo. Berpengalaman luas mengampu materi aqidah Asy\'ariyyah, mantiq, dan filsafat Islam di Kairo.',
    tutorAlmamater: 'Fakultas Ushuluddin Univ. Al-Azhar, Kairo',
    price: 240000,
    priceFormatted: 'Rp240.000',
    duration: '24 pertemuan',
    schedule: 'Akses kapan saja (15 video siap tonton)',
    channelName: 'Al-Madraj Edu',
    overview: 'Kajian mendalam ilmu tauhid berhaluan Ahlussunnah wal Jama\'ah (Asy\'ariyyah-Maturidiyyah) menguraikan bait-bait nazham Jawharat at-Tawhid karya Imam al-Laqqani beserta penjelasannya dalam syarah Ithaf al-Murid. Mengokohkan dalil naqli dan rasional aqli dalam berakidah.',
    outcomes: [
      'Memahami Al-Mabadi al-\'Asyrah (sepuluh pondasi dasar) dalam kajian disiplin Ilmu Kalam.',
      'Menguasai hukum akal: Wajib \'Aqli, Mustahil \'Aqli, dan Jaiz \'Aqli beserta aplikasinya.',
      'Memahami dalil 20 Sifat Wajib bagi Allah, Sifat Mustahil, dan Sifat Jaiz secara analitis.',
      'Membantah syubuhat pemikiran ilhad (ateisme) dan pemahaman menyimpang dengan nalar mantiq yang kuat.'
    ],
    targetAudience: [
      'Mahasiswa Fakultas Ushuluddin (Aqidah Filsafat, Tafsir, Hadits, Dakwah) Universitas Al-Azhar.',
      'Santri ma\'had \'ali dan peminat kajian kalam yang ingin memahami tauhid berdalil aqli & naqli.',
      'Para guru dan asatidz yang mengajarkan akidah Ahlussunnah wal Jama\'ah.'
    ],
    facilities: [
      '15 Video rekaman materi YouTube Al-Madraj Edu beresolusi tinggi',
      'Akses ke bab-bab lanjutan yang terus diunggah sesuai kurikulum',
      'Matan nazham Jawharat at-Tawhid dan transkrip pembahasan kitab',
      'Penyimpanan progress otomatis dan evaluasi pemahaman mandiri'
    ],
    lessons: [
      {
        sortOrder: 1,
        title: 'Dars Ithaf Al-murid, (Pertemuan-1 Muqaddimah)',
        youtubeId: 'Wjn2_aLLiIU',
        youtubeUrl: 'https://youtu.be/Wjn2_aLLiIU',
        thumbnailUrl: 'https://i.ytimg.com/vi/Wjn2_aLLiIU/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Muqaddimah Ilmu Kalam, Al-Mabadi al-\'Asyrah, serta urgensi tauhid bagi keselamatan mukallaf.'
      },
      {
        sortOrder: 2,
        title: 'Dars Ithaf Al-Murid, Pertemuan-2',
        youtubeId: 'a5PY_Js1dC4',
        youtubeUrl: 'https://youtu.be/a5PY_Js1dC4',
        thumbnailUrl: 'https://i.ytimg.com/vi/a5PY_Js1dC4/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Hukum akal (Wajib, Mustahil, Jaiz) dan kewajiban pertama bagi setiap insan berakal.'
      },
      {
        sortOrder: 3,
        title: 'Dars Ithaf Al Murid (Pertemuan - 3)',
        youtubeId: 'x_g9I54hhnc',
        youtubeUrl: 'https://youtu.be/x_g9I54hhnc',
        thumbnailUrl: 'https://i.ytimg.com/vi/x_g9I54hhnc/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pembuktian Wujud Allah SWT melalui Dalil Huduts al-\'Alam dan keteraturan semesta.'
      },
      {
        sortOrder: 4,
        title: 'Dars Ithaf Al Murid (Pertemuan - 4)',
        youtubeId: 's4rZchc7XgU',
        youtubeUrl: 'https://youtu.be/s4rZchc7XgU',
        thumbnailUrl: 'https://i.ytimg.com/vi/s4rZchc7XgU/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat Salbiyyah: Qidam (Terdahulu), Baqa\' (Kekal), dan Mukhalafatu lil Hawadits.'
      },
      {
        sortOrder: 5,
        title: 'Dars Ithaf Al Murid (Pertemuan - 5)',
        youtubeId: 'hRB9fay1wZk',
        youtubeUrl: 'https://youtu.be/hRB9fay1wZk',
        thumbnailUrl: 'https://i.ytimg.com/vi/hRB9fay1wZk/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat Qiyamuhu Binafsihi dan Wahdaniyyah (Keesaan pada Dzat, Sifat, dan Perbuatan).'
      },
      {
        sortOrder: 6,
        title: 'Dars Ithaf Al Murid (Pertemuan - 6)',
        youtubeId: 'W6Bka5L3NjE',
        youtubeUrl: 'https://youtu.be/W6Bka5L3NjE',
        thumbnailUrl: 'https://i.ytimg.com/vi/W6Bka5L3NjE/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat Ma\'ani: Qudrah (Kuasa), Iradah (Berkehendak), dan Ta\'alluq keduanya.'
      },
      {
        sortOrder: 7,
        title: 'Dars Ithaf Al Murid (Pertemuan - 7)',
        youtubeId: 'TytM8PC6_5k',
        youtubeUrl: 'https://youtu.be/TytM8PC6_5k',
        thumbnailUrl: 'https://i.ytimg.com/vi/TytM8PC6_5k/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat \'Ilmu, Hayat, Sama\', Bashar, dan Sifat Kalam (Kalam Nafsi).'
      },
      {
        sortOrder: 8,
        title: 'Dars Ithaf Al Murid (Pertemuan - 8)',
        youtubeId: '0FDIspeqdJk',
        youtubeUrl: 'https://youtu.be/0FDIspeqdJk',
        thumbnailUrl: 'https://i.ytimg.com/vi/0FDIspeqdJk/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat Ma\'nawiyyah serta hal-hal yang mustahil secara mutlak bagi Allah.'
      },
      {
        sortOrder: 9,
        title: 'Dars Ithaf Al Murid (Pertemuan - 9)',
        youtubeId: 'e-MtRnEM82s',
        youtubeUrl: 'https://youtu.be/e-MtRnEM82s',
        thumbnailUrl: 'https://i.ytimg.com/vi/e-MtRnEM82s/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Sifat Jaiz bagi Allah SWT dan ikhtiar hamba dalam menciptakan perbuatan (Kasb).'
      },
      {
        sortOrder: 10,
        title: 'Dars Ithaf Al Murid (Pertemuan - 10)',
        youtubeId: 'THdI8zq3zBU',
        youtubeUrl: 'https://youtu.be/THdI8zq3zBU',
        thumbnailUrl: 'https://i.ytimg.com/vi/THdI8zq3zBU/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Ru\'yatullah fi al-Akhirah (Melihat Allah di surga) menurut Ahlussunnah vs Mu\'tazilah.'
      },
      {
        sortOrder: 11,
        title: 'Dars Ithaf Al Murid (Pertemuan - 11)',
        youtubeId: 'CKVppMr0p6w',
        youtubeUrl: 'https://youtu.be/CKVppMr0p6w',
        thumbnailUrl: 'https://i.ytimg.com/vi/CKVppMr0p6w/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Bab Nubuwwat: Sifat wajib, mustahil, dan jaiz bagi para nabi dan rasul utusan Allah.'
      },
      {
        sortOrder: 12,
        title: 'Dars Ithaf Al Murid (Pertemuan - 12)',
        youtubeId: 'nW3xM97Q4OE',
        youtubeUrl: 'https://youtu.be/nW3xM97Q4OE',
        thumbnailUrl: 'https://i.ytimg.com/vi/nW3xM97Q4OE/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Perbedaan Mu\'jizat, Karamah, Ma\'unah, dan Istidraj serta keutamaan Nabi Muhammad ﷺ.'
      },
      {
        sortOrder: 13,
        title: 'Dars Ithaf Al Murid (Pertemuan - 13)',
        youtubeId: 'MHmbzyhWhKg',
        youtubeUrl: 'https://youtu.be/MHmbzyhWhKg',
        thumbnailUrl: 'https://i.ytimg.com/vi/MHmbzyhWhKg/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Bab Sam\'iyyat: Pertanyaan Malaikat Munkar-Nakir, serta nikmat dan azab kubur.'
      },
      {
        sortOrder: 14,
        title: 'Dars Ithaf Al Murid (Pertemuan - 14)',
        youtubeId: 'vyl4JF8ju6M',
        youtubeUrl: 'https://youtu.be/vyl4JF8ju6M',
        thumbnailUrl: 'https://i.ytimg.com/vi/vyl4JF8ju6M/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Hari Kebangkitan (Ba\'ats), Mahsyar, Mizan, Hisab amal, dan Shirathal Mustaqim.'
      },
      {
        sortOrder: 15,
        title: 'Dars Ithaf Al Murid (Pertemuan - 15)',
        youtubeId: '6y83OdHbzX4',
        youtubeUrl: 'https://youtu.be/6y83OdHbzX4',
        thumbnailUrl: 'https://i.ytimg.com/vi/6y83OdHbzX4/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Syafa\'at \'Uzhma Nabi ﷺ, keabadian Surga dan Neraka, serta khulasah Ithaf al-Murid.'
      }
    ]
  },

  'kajian-risalah-al-adudiyah': {
    slug: 'kajian-risalah-al-adudiyah',
    title: 'Kajian Risalah al-\'Adudiyah',
    kitabName: 'Ar-Risalah al-\'Adudiyyah fi \'Ilm al-Wadh\'',
    authorName: 'Al-Qadhi \'Adud ad-Din Abdurrahman bin Ahmad al-Iji',
    faculty: 'Ushuluddin',
    programType: 'Dars',
    tutorName: 'Ustaz Ulul Albab Fatahillah, Lc.',
    tutorTitle: 'Mentor Turats & Ushuluddin',
    tutorBio: 'Alumni Universitas Al-Azhar Kairo. Aktif dalam forum kajian kitab turats, telaah teks klasik, dan bimbingan akademik di Rumah Syariah Mesir.',
    tutorAlmamater: 'Universitas Al-Azhar, Kairo',
    price: 0,
    priceFormatted: 'Gratis',
    duration: '3 pertemuan',
    schedule: 'Akses kapan saja (Kajian Ramadhan)',
    channelName: 'Rumah Syariah Mesir',
    overview: 'Kajian spesial Ramadhan membedah risalah induk dalam disiplin Ilmu Wadh\' (filsafat bahasa dan semantik turats Islam) karya Imam al-Iji. Ilmu ini menjadi instrumen esensial untuk memahami hubungan antara lafazh, makna, dan kehendak penutur dalam teks Al-Qur\'an, Hadits, dan kaidah ushul fikih.',
    outcomes: [
      'Memahami definisi Ilmu Wadh\', obyek kajian, dan korelasi eratnya dengan Ushul Fikih dan Balaghah.',
      'Menguasai klasifikasi wadh\': Wadh\' Syakhshi, Wadh\' Nau\'i, Wadh\' \'Amm li Maudhu\' \'Amm / Khas.',
      'Menganalisis dalalah lafazh mufrad, murakkab, asma\' al-isyarah, dan dhomir secara semantik mendalam.',
      'Melatih ketajaman berpikir kritis dalam menafsirkan ibarat kitab kuning berbobot tinggi.'
    ],
    targetAudience: [
      'Mahasiswa tingkat sarjana dan pascasarjana Al-Azhar yang mempelajari Ushul Fikih, Mantiq, atau Balaghah.',
      'Peneliti dan pengkaji teks turats bahasa Arab dan hukum Islam.',
      'Santri senior yang ingin memperluas wawasan keilmuan lughawiyyah lanjutan.'
    ],
    facilities: [
      '3 Video kajian intensif Rumah Syariah Mesir',
      'Penjelasan runut matan Ar-Risalah al-\'Adudiyyah',
      'Diagram pembagian wadh\' dan skema pemaknaan lafazh',
      'Akses gratis tanpa syarat pendaftaran berbayar'
    ],
    lessons: [
      {
        sortOrder: 1,
        title: 'Kajian Kitab Risalah al-Adudiyah | Kajian Spesial Ramadan (1)',
        youtubeId: 'G1xHqUYSN2g',
        youtubeUrl: 'https://youtu.be/G1xHqUYSN2g',
        thumbnailUrl: 'https://i.ytimg.com/vi/G1xHqUYSN2g/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Pengantar \'Ilm al-Wadh\', Ta\'rif al-Lafzh wal Ma\'na, serta pembagian dasar al-Wadh\'.'
      },
      {
        sortOrder: 2,
        title: 'Kajian Kitab Risalah al-Adudiyah | Kajian Spesial Ramadan (2)',
        youtubeId: 'iXoJwiBappc',
        youtubeUrl: 'https://youtu.be/iXoJwiBappc',
        thumbnailUrl: 'https://i.ytimg.com/vi/iXoJwiBappc/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Wadh\' Syakhshi vs Wadh\' Nau\'i, serta analisis dalalah makna \'amm dan khas.'
      },
      {
        sortOrder: 3,
        title: 'Kajian Kitab Risalah al-Adudiyah | Kajian Spesial Ramadan (3)',
        youtubeId: '17xarGaNIwI',
        youtubeUrl: 'https://youtu.be/17xarGaNIwI',
        thumbnailUrl: 'https://i.ytimg.com/vi/17xarGaNIwI/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Asma\' al-Isyarah, Huruf Ma\'ani, dan aplikasi Ilmu Wadh\' dalam Ushul Fikih.'
      }
    ]
  },

  'kitab-hujjah-ahli-sunah-wal-jamaah': {
    slug: 'kitab-hujjah-ahli-sunah-wal-jamaah',
    title: 'Kitab Hujjah Ahli Sunah wal Jama\'ah',
    kitabName: 'Risalah Hujjah Ahl as-Sunnah wa al-Jama\'ah',
    authorName: 'Hadratussyaikh KH. Muhammad Hasyim Asy\'ari',
    faculty: 'Ushuluddin',
    programType: 'Dars',
    tutorName: 'Ustaz Alif Watra Sarajeva, Lc., Dipl.',
    tutorTitle: 'Dewan Guru & Pengajar Turats Rumah Syariah Mesir',
    tutorBio: 'Alumni Fakultas Syariah Islamiyyah Universitas Al-Azhar Kairo dengan dedikasi tinggi dalam pelestarian khazanah turats ulama Nusantara.',
    tutorAlmamater: 'Universitas Al-Azhar, Kairo',
    price: 0,
    priceFormatted: 'Gratis',
    duration: '6 pertemuan',
    schedule: 'Akses kapan saja (6 video lengkap)',
    channelName: 'Al-Madraj Edu',
    overview: 'Ngaji kitab turats ulama Nusantara karya Pendiri Nahdlatul Ulama, Hadratussyaikh KH. M. Hasyim Asy\'ari. Menghimpun dalil-dalil sharih dari nash Al-Qur\'an, Sunnah Nabawiyyah, dan ijma\' fuqaha mengenai tradisi amaliah Ahlussunnah wal Jama\'ah seperti tahlil, ziarah kubur, tawassul, dan maulid.',
    outcomes: [
      'Memahami definisi Sunnah dan Bid\'ah secara jernih sesuai kaidah para imam mazhab.',
      'Mengetahui argumentasi naqli dan aqli mengenai sampainya pahala bacaan doa dan sedekah untuk mayit.',
      'Memahami keabsahan tawassul, tabarruk, ziarah kubur, dan peringatan Maulid Nabi ﷺ.',
      'Meneguhkan komitmen bermadzhab dan menjaga ukhuwah persatuan umat Islam.'
    ],
    targetAudience: [
      'Mahasiswa Masisir Kairo dan santri Nusantara yang ingin memiliki hujah dalil amaliah yang kokoh.',
      'Asatidz, dai, dan pengurus majelis taklim di tanah air maupun perantauan.',
      'Umat Islam yang ingin mempelajari turats para ulama mu\'tabar Nusantara.'
    ],
    facilities: [
      '6 Video pengajian lengkap Al-Madraj Edu',
      'Teks matan kitab Risalah Hujjah Ahl as-Sunnah wal Jama\'ah',
      'Peta dalil hadits-hadits shahih amaliah aswaja',
      'Dapat diakses langsung di ruang belajar Al-Madraj'
    ],
    lessons: [
      {
        sortOrder: 1,
        title: 'Ngaji Hujjah Ahl Sunnah wa al-Jama\'ah (Pertemuan Pertama)',
        youtubeId: 'gzgxAqNviH0',
        youtubeUrl: 'https://youtu.be/gzgxAqNviH0',
        thumbnailUrl: 'https://i.ytimg.com/vi/gzgxAqNviH0/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Mukaddimah, definisi Sunnah & Bid\'ah, serta kemunculan ragam firqah dalam sejarah.'
      },
      {
        sortOrder: 2,
        title: 'Ngaji Hujjah Ahl al-Sunnah wa al-Jamaah (Pertemuan ke-2)',
        youtubeId: 'xWXqI4pVQ0g',
        youtubeUrl: 'https://youtu.be/xWXqI4pVQ0g',
        thumbnailUrl: 'https://i.ytimg.com/vi/xWXqI4pVQ0g/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Dalil-dalil amaliah tahlilan, sedekah atas nama mayit, dan kirim doa.'
      },
      {
        sortOrder: 3,
        title: 'Ngaji Kitab Hujjah Ahl al-Sunnah wa al-Jama\'ah (Pertemuan ke-3)',
        youtubeId: 'CnS6dgz_iss',
        youtubeUrl: 'https://youtu.be/CnS6dgz_iss',
        thumbnailUrl: 'https://i.ytimg.com/vi/CnS6dgz_iss/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Keabsahan ziarah kubur, adab berziarah, dan tawassul dengan para kekasih Allah.'
      },
      {
        sortOrder: 4,
        title: 'Ngaji Kitab Hujjah Ahl al-Sunnah wa al-Jama\'ah (Pertemuan ke-4)',
        youtubeId: '7Wo53bQEZ0k',
        youtubeUrl: 'https://youtu.be/7Wo53bQEZ0k',
        thumbnailUrl: 'https://i.ytimg.com/vi/7Wo53bQEZ0k/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Dalil peringatan Maulid Nabi Muhammad ﷺ dan pembacaan pujian qasidah.'
      },
      {
        sortOrder: 5,
        title: 'Ngaji Kitab Hujjah Ahl al-Sunnah wa al-Jama\'ah (Pertemuan ke-5)',
        youtubeId: 'jyHE8N61yH0',
        youtubeUrl: 'https://youtu.be/jyHE8N61yH0',
        thumbnailUrl: 'https://i.ytimg.com/vi/jyHE8N61yH0/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Talqin mayit setelah pemakaman, tradisi shalat Tarawih 20 rakaat, dan amaliah jama\'ah.'
      },
      {
        sortOrder: 6,
        title: 'Ngaji Kitab Hujjah Ahl al-Sunnah wa al-Jama\'ah (Pertemuan ke-6)',
        youtubeId: 'YCMqc1v1oBo',
        youtubeUrl: 'https://youtu.be/YCMqc1v1oBo',
        thumbnailUrl: 'https://i.ytimg.com/vi/YCMqc1v1oBo/hqdefault.jpg',
        duration: 'Video Pembahasan',
        description: 'Urgensi bermadzhab empat bagi awam, larangan talfiq batil, dan wasiat persatuan umat.'
      }
    ]
  }
};

export const getCourseDetail = (slug: string): CourseDetail | undefined => {
  return COURSES_DETAIL_DATA[slug];
};

export const getCourseTutorName = (slug?: string, fallbackTutor?: string): string => {
  if (slug) {
    const detail = COURSES_DETAIL_DATA[slug];
    if (detail?.tutorName && !['Al-Madraj Edu', 'Rumah Syariah Mesir', 'Al-Madraj'].includes(detail.tutorName)) {
      return detail.tutorName;
    }
  }
  if (fallbackTutor && !['Al-Madraj Edu', 'Rumah Syariah Mesir', 'Al-Madraj', 'Asatidz Al-Azhar'].includes(fallbackTutor.trim())) {
    return fallbackTutor.trim();
  }
  if (slug) {
    const detail = COURSES_DETAIL_DATA[slug];
    if (detail?.tutorName) return detail.tutorName;
  }
  return fallbackTutor?.trim() || 'Asatidz Al-Azhar';
};
