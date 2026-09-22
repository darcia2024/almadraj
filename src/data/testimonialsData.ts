import { supabase, supabaseConfigured } from '../lib/supabase';

export type TestimonialItem = {
  id: string;
  name: string;
  initials: string;
  role: string;
  university: string;
  tag: string;
  course: string;
  year: string;
  rating: number;
  avatarColor: string;
  avatar_url?: string;
  quote: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
};

export const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'testi-1',
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
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'testi-2',
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
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'testi-3',
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
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'testi-4',
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
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'testi-5',
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
    is_active: true,
    sort_order: 5,
  },
  {
    id: 'testi-6',
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
    is_active: true,
    sort_order: 6,
  },
];

const STORAGE_KEY = 'almadraj_testimonials_v1';

export const getStoredTestimonials = (): TestimonialItem[] => {
  if (typeof window === 'undefined') return DEFAULT_TESTIMONIALS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TESTIMONIALS));
      return DEFAULT_TESTIMONIALS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TESTIMONIALS;
  } catch {
    return DEFAULT_TESTIMONIALS;
  }
};

export const setStoredTestimonials = (items: TestimonialItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('almadraj_testimonials_updated'));
  } catch (err) {
    console.error('Failed to write testimonials to local storage', err);
  }
};

export const loadTestimonials = async (): Promise<TestimonialItem[]> => {
  if (supabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: TestimonialItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          initials: d.initials || (d.name ? d.name.slice(0, 2).toUpperCase() : 'AL'),
          role: d.role || '',
          university: d.university || '',
          tag: d.tag || 'Masisir Kairo',
          course: d.course || '',
          year: d.year || '',
          rating: Number(d.rating) || 5,
          avatarColor: d.avatar_color || 'from-[#006d77] to-[#148369]',
          avatar_url: d.avatar_url || '',
          quote: d.quote || '',
          is_active: d.is_active ?? true,
          sort_order: Number(d.sort_order) || 0,
          created_at: d.created_at,
        }));
        setStoredTestimonials(mapped);
        return mapped;
      }
    } catch {
      // Fallback to local storage if Supabase table is not yet created
    }
  }

  return getStoredTestimonials();
};

export const saveTestimonial = async (item: TestimonialItem): Promise<TestimonialItem> => {
  const current = getStoredTestimonials();
  const index = current.findIndex((t) => t.id === item.id);
  let updatedList: TestimonialItem[];

  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = item;
  } else {
    updatedList = [item, ...current];
  }

  setStoredTestimonials(updatedList);

  if (supabaseConfigured && supabase) {
    try {
      const payload: any = {
        name: item.name,
        initials: item.initials,
        role: item.role,
        university: item.university,
        tag: item.tag,
        course: item.course,
        year: item.year,
        rating: item.rating,
        avatar_color: item.avatarColor,
        avatar_url: item.avatar_url || '',
        quote: item.quote,
        is_active: item.is_active,
        sort_order: item.sort_order,
      };

      // If uuid format, pass id
      if (item.id && !item.id.startsWith('testi-')) {
        payload.id = item.id;
      }

      const { data, error } = await supabase
        .from('testimonials')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        item.id = data.id;
        const freshList = updatedList.map((t) => (t.id === item.id || t.name === item.name ? { ...t, id: data.id } : t));
        setStoredTestimonials(freshList);
      }
    } catch {
      // Ignored for offline/fallback
    }
  }

  return item;
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  const current = getStoredTestimonials();
  const filtered = current.filter((t) => t.id !== id);
  setStoredTestimonials(filtered);

  if (supabaseConfigured && supabase && !id.startsWith('testi-')) {
    try {
      await supabase.from('testimonials').delete().eq('id', id);
    } catch {
      // Ignored
    }
  }
};
