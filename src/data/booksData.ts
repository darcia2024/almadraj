import { supabase, supabaseConfigured } from '../lib/supabase';

export type BookCategory = 
  | 'Semua' 
  | 'Aqidah' 
  | 'Tazkiyah'
  | 'Fikih'
  | 'Hadits'
  | 'Lughah'
  | (string & {});

export interface ContactPerson {
  name: string;
  whatsapp: string;
  whatsappDisplay: string;
}

export interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
}

export interface BookItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  arabicTitle: string;
  author: string;
  foreword?: string;
  category: string;
  publisher: string;
  coverImage?: string;
  gradientCover: string;
  price: number;
  originalPrice?: number;
  stockStatus: 'ready' | 'preorder' | 'out_of_stock';
  targetRegion?: string;
  contactPerson?: ContactPerson;
  bankAccount?: BankAccount;
  orderSteps?: string[];
  pages: number;
  coverType: 'Hard Cover' | 'Soft Cover' | 'Mujallad Lux' | string;
  paperType: 'Kertas Shamois (Kuning)' | 'Kertas HVS Putih' | 'Kertas Bookpaper' | string;
  weight: string;
  description: string;
  keyFeatures: string[];
  purchaseUrl?: string;
  whatsappMessage?: string;
  is_published?: boolean;
  sort_order?: number;
}

export const BOOK_CATEGORIES: BookCategory[] = [
  'Semua',
  'Aqidah',
  'Tazkiyah',
  'Fikih',
  'Hadits',
  'Lughah'
];

export const BOOKS_DATA: BookItem[] = [
  {
    id: 'book-almadraj-01',
    slug: 'gerbang-akidah-ahlusunnah',
    title: 'Gerbang Akidah Ahlusunnah',
    subtitle: 'Terjemah, Syarah dan Catatan atas Nazam Al-Kharidah Al-Bahiyyah',
    arabicTitle: 'الخريدة البهية في العقيدة السنية',
    author: 'Ulul Albab Fatahillah',
    category: 'Aqidah',
    publisher: 'Al-Madraj Publishing',
    coverImage: '/books/gerbang-akidah-ahlusunnah.png',
    gradientCover: 'from-[#0b2b30] via-[#006d77] to-[#83c5be]',
    price: 100000,
    originalPrice: 120000,
    stockStatus: 'preorder',
    targetRegion: 'Khusus Domisili Mesir (Masisir)',
    contactPerson: {
      name: 'Ust. M. Zulfikar Sulkhi A., Lc., Dipl.',
      whatsapp: '6282310462582',
      whatsappDisplay: '+62 823-1046-2582'
    },
    bankAccount: {
      bank: 'Bank Jago Syariah',
      accountNumber: '102149984572',
      accountName: 'M Zulfikar Sulkhi Aunillah'
    },
    orderSteps: [
      'Hubungi Contact Person atau isi Google Form pemesanan resmi',
      'Isi data pemesan & alamat pengantaran di Kairo',
      'Lakukan transfer ke Bank Jago Syariah 102149984572 a.n M Zulfikar Sulkhi Aunillah',
      'Kirimkan bukti transfer untuk validasi pesanan'
    ],
    pages: 210,
    coverType: 'Soft Cover',
    paperType: 'Kertas Bookpaper',
    weight: '280 gram',
    description: 'Buku panduan dasar dan rujukan akidah Ahlussunnah wal Jama\'ah (Asy\'ariyyah) yang mengupas tuntas Nazham Al-Kharidah Al-Bahiyyah karya Al-Imam Ahmad Ad-Dardir. Disajikan dengan terjemah kontekstual, syarah terperinci, ta\'liq metodologis, dan argumentasi aqli-naqli yang mudah dipahami penuntut ilmu.',
    keyFeatures: [
      'Terjemah, syarah, dan catatan analitis atas Nazham Al-Kharidah Al-Bahiyyah',
      'Edisi cetak pre-order perdana Al-Madraj Publishing khusus domisili Mesir',
      'Dilengkapi bagan logika sifat 20 dan dalil-dalil Asy\'ariyyah mu\'tamad',
      'Karya alumni Al-Azhar Kairo dengan bahasa ilmiah yang santun dan jernih'
    ],
    whatsappMessage: "Assalamu'alaikum Ust. M. Zulfikar Sulkhi, saya ingin memesan Pre-Order Buku 'Gerbang Akidah Ahlusunnah' (Rp100.000). Mohon panduan pemesanan dan link form.",
    is_published: true,
    sort_order: 1
  },
  {
    id: 'book-almadraj-02',
    slug: 'syekh-ibnu-taimiyah-antara-pujian-dan-kritikan',
    title: 'Syekh Ibnu Taimiyah: Antara Pujian dan Kritikan',
    subtitle: 'Pemaparan dan Kritik Metodologi Syekh Ibnu Taimiyah dalam Penetapan Sifat-sifat Allah taala',
    arabicTitle: 'منهج الشيخ ابن تيمية في إثبات الصفات بين الثناء والنقد',
    author: 'Ulul Albab Fatahillah',
    foreword: 'KH. Ma\'ruf Khozin (Rais Syuriah PCNU Kab. Malang & Direktur Madinatunnajah Malang Timur)',
    category: 'Aqidah',
    publisher: 'Al-Madraj Publishing',
    coverImage: '/books/syekh-ibnu-taimiyah.png',
    gradientCover: 'from-[#2d1b16] via-[#633a2f] to-[#d4a373]',
    price: 130000,
    stockStatus: 'preorder',
    targetRegion: 'Indonesia & Mesir',
    contactPerson: {
      name: 'Ust. M. Zulfikar Sulkhi A., Lc., Dipl.',
      whatsapp: '6282310462582',
      whatsappDisplay: '+62 823-1046-2582'
    },
    orderSteps: [
      'Konfirmasi pemesanan awal via WhatsApp Admin Al Madraj',
      'Pilih wilayah pengiriman (Indonesia atau Kairo)',
      'Lakukan pembayaran DP / lunas sesuai panduan admin',
      'Buku siap didistribusikan saat peluncuran resmi'
    ],
    pages: 264,
    coverType: 'Soft Cover',
    paperType: 'Kertas Bookpaper',
    weight: '340 gram',
    description: 'Kajian objektif, ilmiah, dan berimbang yang menelaah metodologi kalamiah Syekh Ibnu Taimiyah dalam penetapan sifat-sifat Allah ta\'ala. Disusun dengan adab ilmiah tinggi — merangkum sanjungan para ulama atas kedalaman ilmunya sekaligus memaparkan kritik terukur ulama Ahlussunnah wal Jama\'ah terhadap pokok-pokok pandangan kontroversialnya.',
    keyFeatures: [
      'Kata Pengantar kehormatan oleh KH. Ma\'ruf Khozin (MUI & Aswaja Center PWNU Jatim)',
      'Ulasan ilmiah perbandingan metodologi Salaf, Khalaf (Asy\'ariyyah), dan Ibnu Taimiyah',
      'Dilengkapi ta\'liq dan takhrij teks dari kitab-kitab induk turats',
      'Penerbitan resmi di bawah naungan Al-Madraj Publishing'
    ],
    whatsappMessage: "Assalamu'alaikum Ust. Zulfikar / Admin Al Madraj, saya ingin ikut Pre-Order Buku 'Syekh Ibnu Taimiyah: Antara Pujian dan Kritikan' karya Ulul Albab Fatahillah (Rp130.000). Mohon info pemesanannya.",
    is_published: true,
    sort_order: 2
  },
  {
    id: 'book-almadraj-03',
    slug: 'beragama-dengan-tenang',
    title: 'Beragama Dengan Tenang',
    subtitle: 'Membedah Batas Ihtiyath dan Jebakan Waswas',
    arabicTitle: 'السكينة في الدين: بين ضوابط الاحتياط ومزالق الوسواس',
    author: 'Watra Sarajeva',
    foreword: 'Habib Ahmad Mujtaba bin Syihab',
    category: 'Tazkiyah',
    publisher: 'Al-Madraj Publishing',
    coverImage: '/books/beragama-dengan-tenang.png',
    gradientCover: 'from-[#204037] via-[#2a9d8f] to-[#e76f51]',
    price: 75000,
    originalPrice: 90000,
    stockStatus: 'preorder',
    targetRegion: 'Tersedia Jalur Pemesanan Mesir & Indonesia',
    contactPerson: {
      name: 'Ust. Watra Sarajeva',
      whatsapp: '6285210731963',
      whatsappDisplay: '+62 852-1073-1963'
    },
    orderSteps: [
      'Pilih jalur pemesanan sesuai lokasi (Mesir atau Indonesia)',
      'Isi Google Form pemesanan resmi',
      'Lakukan pembayaran harga promo Pre-Order (Rp75.000)',
      'Upload bukti transfer di Google Form untuk pengiriman buku'
    ],
    pages: 188,
    coverType: 'Soft Cover',
    paperType: 'Kertas Bookpaper',
    weight: '230 gram',
    description: 'Panduan aplikatif penyejuk hati dalam menjalankan syariat Islam. Mengurai secara jernih batas tipis antara sikap kehati-hatian (ihtiyath) yang dianjurkan agama dengan jebakan waswas yang kerap menyiksa dan membebani batin dalam thaharah, shalat, dan amalan harian. Menuntun pembaca beribadah dengan tenang, yakin, dan selaras dengan kemudahan syariat.',
    keyFeatures: [
      'Kata Pengantar dari Habib Ahmad Mujtaba bin Syihab',
      'Tersedia 2 jalur pemesanan & distribusi resmi: Mesir & Indonesia',
      'Solusi praktis berbasis fikih mazhab Syafi\'i dan tazkiyatun nufus',
      'Harga promo spesial pre-order Rp75.000 (hemat Rp15.000)'
    ],
    whatsappMessage: "Assalamu'alaikum Ust. Watra Sarajeva, saya ingin memesan Pre-Order Buku 'Beragama Dengan Tenang' (Harga PO Rp75.000). Mohon link Google Form untuk wilayah saya.",
    is_published: true,
    sort_order: 3
  }
];

export const BOOKSTORE_CONTACT = {
  whatsappNumber: '6282310462582', // Ust. M. Zulfikar Sulkhi A.
  whatsappDisplay: '+62 823-1046-2582',
  telegramUser: 'almadraj_edu',
  instagram: '@almadraj_edu',
  publishingInstagram: '@almadraj.publishing',
  shopeeStoreUrl: '',
  tokopediaStoreUrl: '',
  deliveryNotes: 'Melayani pengiriman resmi di wilayah Kairo (Mesir) khusus Masisir & pengiriman ke seluruh pelosok Indonesia via ekspedisi terpercaya.'
};

const BOOKS_STORAGE_KEY = 'almadraj_books_v1';
const CONTACT_STORAGE_KEY = 'almadraj_bookstore_contact_v1';

export const getStoredBooks = (): BookItem[] => {
  if (typeof window === 'undefined') return BOOKS_DATA;
  try {
    const raw = window.localStorage.getItem(BOOKS_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(BOOKS_DATA));
      return BOOKS_DATA;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : BOOKS_DATA;
  } catch {
    return BOOKS_DATA;
  }
};

export const setStoredBooks = (items: BookItem[]): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('almadraj_books_updated'));
  } catch (err) {
    console.error('Failed to write books to local storage', err);
  }
};

export const getStoredBookstoreContact = (): typeof BOOKSTORE_CONTACT => {
  if (typeof window === 'undefined') return BOOKSTORE_CONTACT;
  try {
    const raw = window.localStorage.getItem(CONTACT_STORAGE_KEY);
    if (!raw) return BOOKSTORE_CONTACT;
    return { ...BOOKSTORE_CONTACT, ...JSON.parse(raw) };
  } catch {
    return BOOKSTORE_CONTACT;
  }
};

export const setStoredBookstoreContact = (contact: typeof BOOKSTORE_CONTACT): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contact));
    window.dispatchEvent(new Event('almadraj_books_updated'));
  } catch (err) {
    console.error('Failed to write bookstore contact to local storage', err);
  }
};

export const checkBooksTableStatus = async (): Promise<'checking' | 'synced' | 'table_missing' | 'offline'> => {
  if (!supabaseConfigured || !supabase) return 'offline';
  try {
    const { error } = await supabase.from('books').select('id').limit(1);
    if (error) return 'table_missing';
    return 'synced';
  } catch {
    return 'table_missing';
  }
};

export const loadBooks = async (): Promise<BookItem[]> => {
  if (supabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped: BookItem[] = data.map((d: any) => ({
          id: d.id,
          slug: d.slug,
          title: d.title,
          subtitle: d.subtitle || '',
          arabicTitle: d.arabic_title || '',
          author: d.author,
          foreword: d.foreword || '',
          category: d.category || 'Aqidah',
          publisher: d.publisher || 'Al-Madraj Publishing',
          coverImage: d.cover_image || '',
          gradientCover: d.gradient_cover || 'from-[#0b2b30] via-[#006d77] to-[#83c5be]',
          price: Number(d.price) || 0,
          originalPrice: d.original_price ? Number(d.original_price) : undefined,
          stockStatus: d.stock_status || 'ready',
          targetRegion: d.target_region || '',
          contactPerson: d.contact_person && d.contact_person.name ? d.contact_person : undefined,
          bankAccount: d.bank_account && d.bank_account.bank ? d.bank_account : undefined,
          orderSteps: Array.isArray(d.order_steps) ? d.order_steps : undefined,
          pages: Number(d.pages) || 0,
          coverType: d.cover_type || 'Soft Cover',
          paperType: d.paper_type || 'Kertas Bookpaper',
          weight: d.weight || '',
          description: d.description || '',
          keyFeatures: Array.isArray(d.key_features) ? d.key_features : [],
          purchaseUrl: d.purchase_url || '',
          whatsappMessage: d.whatsapp_message || '',
          is_published: d.is_published ?? true,
          sort_order: Number(d.sort_order) || 0,
        }));
        setStoredBooks(mapped);
        return mapped;
      }
    } catch {
      // Fallback
    }
  }

  return getStoredBooks();
};

export const saveBook = async (item: BookItem): Promise<{ item: BookItem; syncedWithDb: boolean; error?: string }> => {
  const current = getStoredBooks();
  const index = current.findIndex((b) => b.id === item.id);
  let updatedList: BookItem[];

  if (index >= 0) {
    updatedList = [...current];
    updatedList[index] = item;
  } else {
    updatedList = [item, ...current];
  }

  setStoredBooks(updatedList);

  let syncedWithDb = false;
  let dbError: string | undefined;

  if (supabaseConfigured && supabase) {
    try {
      const payload: any = {
        id: item.id,
        slug: item.slug,
        title: item.title,
        subtitle: item.subtitle || '',
        arabic_title: item.arabicTitle || '',
        author: item.author,
        foreword: item.foreword || '',
        category: item.category,
        publisher: item.publisher,
        cover_image: item.coverImage || '',
        gradient_cover: item.gradientCover,
        price: item.price,
        original_price: item.originalPrice || null,
        stock_status: item.stockStatus,
        target_region: item.targetRegion || '',
        contact_person: item.contactPerson || {},
        bank_account: item.bankAccount || {},
        order_steps: item.orderSteps || [],
        pages: item.pages || 0,
        cover_type: item.coverType || 'Soft Cover',
        paper_type: item.paperType || 'Kertas Bookpaper',
        weight: item.weight || '',
        description: item.description || '',
        key_features: item.keyFeatures || [],
        purchase_url: item.purchaseUrl || '',
        whatsapp_message: item.whatsappMessage || '',
        is_published: item.is_published ?? true,
        sort_order: item.sort_order || 0,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('books')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        syncedWithDb = true;
      } else if (error) {
        dbError = error.message;
      }
    } catch (err: any) {
      dbError = err?.message || 'Database error';
    }
  }

  return { item, syncedWithDb, error: dbError };
};

export const deleteBook = async (id: string): Promise<void> => {
  const current = getStoredBooks();
  const filtered = current.filter((b) => b.id !== id);
  setStoredBooks(filtered);

  if (supabaseConfigured && supabase) {
    try {
      await supabase.from('books').delete().eq('id', id);
    } catch {
      // Ignored
    }
  }
};
