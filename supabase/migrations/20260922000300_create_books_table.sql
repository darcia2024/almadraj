-- Migration: Create books table for dynamic Pustaka Al Madraj management
-- Run this script in Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table if not exists public.books (
  id text primary key,
  slug text not null unique,
  title text not null,
  subtitle text default '',
  arabic_title text default '',
  author text not null,
  foreword text default '',
  category text not null default 'Aqidah',
  publisher text not null default 'Al-Madraj Publishing',
  cover_image text default '',
  gradient_cover text default 'from-[#0b2b30] via-[#006d77] to-[#83c5be]',
  price numeric not null default 0,
  original_price numeric,
  stock_status text not null default 'ready',
  target_region text default '',
  contact_person jsonb default '{}'::jsonb,
  bank_account jsonb default '{}'::jsonb,
  order_steps text[] default '{}'::text[],
  pages integer default 0,
  cover_type text default 'Soft Cover',
  paper_type text default 'Kertas Bookpaper',
  weight text default '',
  description text not null default '',
  key_features text[] default '{}'::text[],
  purchase_url text default '',
  whatsapp_message text default '',
  is_published boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.books enable row level security;

-- Policy 1: Public Read
drop policy if exists books_public_read on public.books;
create policy books_public_read
  on public.books
  for select
  using (true);

-- Policy 2: Admin Manage
drop policy if exists books_admin_manage on public.books;
create policy books_admin_manage
  on public.books
  for all
  to authenticated
  using (public.is_lms_admin())
  with check (public.is_lms_admin());

-- Seed initial books (Using PostgreSQL dollar-quoting $$ for maximum safety)
insert into public.books (
  id, slug, title, subtitle, arabic_title, author, foreword, category, publisher,
  cover_image, gradient_cover, price, original_price, stock_status, target_region,
  contact_person, bank_account, order_steps, pages, cover_type, paper_type, weight,
  description, key_features, whatsapp_message, is_published, sort_order
)
values (
  'book-almadraj-01',
  'gerbang-akidah-ahlusunnah',
  'Gerbang Akidah Ahlusunnah',
  'Terjemah, Syarah dan Catatan atas Nazam Al-Kharidah Al-Bahiyyah',
  'الخريدة البهية في العقيدة السنية',
  'Ulul Albab Fatahillah',
  '',
  'Aqidah',
  'Al-Madraj Publishing',
  '/books/gerbang-akidah-ahlusunnah.png',
  'from-[#0b2b30] via-[#006d77] to-[#83c5be]',
  100000,
  120000,
  'preorder',
  'Khusus Domisili Mesir (Masisir)',
  '{"name": "Ust. M. Zulfikar Sulkhi A., Lc., Dipl.", "whatsapp": "6282310462582", "whatsappDisplay": "+62 823-1046-2582"}'::jsonb,
  '{"bank": "Bank Jago Syariah", "accountNumber": "102149984572", "accountName": "M Zulfikar Sulkhi Aunillah"}'::jsonb,
  array[
    'Hubungi Contact Person atau isi Google Form pemesanan resmi',
    'Isi data pemesan & alamat pengantaran di Kairo',
    'Lakukan transfer ke Bank Jago Syariah 102149984572 a.n M Zulfikar Sulkhi Aunillah',
    'Kirimkan bukti transfer untuk validasi pesanan'
  ],
  210,
  'Soft Cover',
  'Kertas Bookpaper',
  '280 gram',
  $$Buku panduan dasar dan rujukan akidah Ahlussunnah wal Jama'ah (Asy'ariyyah) yang mengupas tuntas Nazham Al-Kharidah Al-Bahiyyah karya Al-Imam Ahmad Ad-Dardir. Disajikan dengan terjemah kontekstual, syarah terperinci, ta'liq metodologis, dan argumentasi aqli-naqli yang mudah dipahami penuntut ilmu.$$,
  array[
    $$Terjemah, syarah, dan catatan analitis atas Nazham Al-Kharidah Al-Bahiyyah$$,
    $$Edisi cetak pre-order perdana Al-Madraj Publishing khusus domisili Mesir$$,
    $$Dilengkapi bagan logika sifat 20 dan dalil-dalil Asy'ariyyah mu'tamad$$,
    $$Karya alumni Al-Azhar Kairo dengan bahasa ilmiah yang santun dan jernih$$
  ],
  $$Assalamu'alaikum Ust. M. Zulfikar Sulkhi, saya ingin memesan Pre-Order Buku 'Gerbang Akidah Ahlusunnah' (Rp100.000). Mohon panduan pemesanan dan link form.$$,
  true,
  1
)
on conflict (id) do nothing;

insert into public.books (
  id, slug, title, subtitle, arabic_title, author, foreword, category, publisher,
  cover_image, gradient_cover, price, original_price, stock_status, target_region,
  contact_person, bank_account, order_steps, pages, cover_type, paper_type, weight,
  description, key_features, whatsapp_message, is_published, sort_order
)
values (
  'book-almadraj-02',
  'syekh-ibnu-taimiyah-antara-pujian-dan-kritikan',
  'Syekh Ibnu Taimiyah: Antara Pujian dan Kritikan',
  'Pemaparan dan Kritik Metodologi Syekh Ibnu Taimiyah dalam Penetapan Sifat-sifat Allah taala',
  'منهج الشيخ ابن تيمية في إثبات الصفات بين الثناء والنقد',
  'Ulul Albab Fatahillah',
  $$KH. Ma'ruf Khozin (Rais Syuriah PCNU Kab. Malang & Direktur Madinatunnajah Malang Timur)$$,
  'Aqidah',
  'Al-Madraj Publishing',
  '/books/syekh-ibnu-taimiyah.png',
  'from-[#2d1b16] via-[#633a2f] to-[#d4a373]',
  130000,
  null,
  'preorder',
  'Indonesia & Mesir',
  '{"name": "Ust. M. Zulfikar Sulkhi A., Lc., Dipl.", "whatsapp": "6282310462582", "whatsappDisplay": "+62 823-1046-2582"}'::jsonb,
  null,
  array[
    'Konfirmasi pemesanan awal via WhatsApp Admin Al Madraj',
    'Pilih wilayah pengiriman (Indonesia atau Kairo)',
    'Lakukan pembayaran DP / lunas sesuai panduan admin',
    'Buku siap didistribusikan saat peluncuran resmi'
  ],
  264,
  'Soft Cover',
  'Kertas Bookpaper',
  '340 gram',
  $$Kajian objektif, ilmiah, dan berimbang yang menelaah metodologi kalamiah Syekh Ibnu Taimiyah dalam penetapan sifat-sifat Allah ta'ala. Disusun dengan adab ilmiah tinggi — merangkum sanjungan para ulama atas kedalaman ilmunya sekaligus memaparkan kritik terukur ulama Ahlussunnah wal Jama'ah terhadap pokok-pokok pandangan kontroversialnya.$$,
  array[
    $$Kata Pengantar kehormatan oleh KH. Ma'ruf Khozin (MUI & Aswaja Center PWNU Jatim)$$,
    $$Ulasan ilmiah perbandingan metodologi Salaf, Khalaf (Asy'ariyyah), dan Ibnu Taimiyah$$,
    $$Dilengkapi ta'liq dan takhrij teks dari kitab-kitab induk turats$$,
    $$Penerbitan resmi di bawah naungan Al-Madraj Publishing$$
  ],
  $$Assalamu'alaikum Ust. Zulfikar / Admin Al Madraj, saya ingin ikut Pre-Order Buku 'Syekh Ibnu Taimiyah: Antara Pujian dan Kritikan' karya Ulul Albab Fatahillah (Rp130.000). Mohon info pemesanannya.$$,
  true,
  2
)
on conflict (id) do nothing;

insert into public.books (
  id, slug, title, subtitle, arabic_title, author, foreword, category, publisher,
  cover_image, gradient_cover, price, original_price, stock_status, target_region,
  contact_person, bank_account, order_steps, pages, cover_type, paper_type, weight,
  description, key_features, whatsapp_message, is_published, sort_order
)
values (
  'book-almadraj-03',
  'beragama-dengan-tenang',
  'Beragama Dengan Tenang',
  'Membedah Batas Ihtiyath dan Jebakan Waswas',
  'السكينة في الدين: بين ضوابط الاحتياط ومزالق الوسواس',
  'Watra Sarajeva',
  'Habib Ahmad Mujtaba bin Syihab',
  'Tazkiyah',
  'Al-Madraj Publishing',
  '/books/beragama-dengan-tenang.png',
  'from-[#204037] via-[#2a9d8f] to-[#e76f51]',
  75000,
  90000,
  'preorder',
  'Tersedia Jalur Pemesanan Mesir & Indonesia',
  '{"name": "Ust. Watra Sarajeva", "whatsapp": "6285210731963", "whatsappDisplay": "+62 852-1073-1963"}'::jsonb,
  null,
  array[
    'Pilih jalur pemesanan sesuai lokasi (Mesir atau Indonesia)',
    'Isi Google Form pemesanan resmi',
    'Lakukan pembayaran harga promo Pre-Order (Rp75.000)',
    'Upload bukti transfer di Google Form untuk pengiriman buku'
  ],
  188,
  'Soft Cover',
  'Kertas Bookpaper',
  '230 gram',
  $$Panduan aplikatif penyejuk hati dalam menjalankan syariat Islam. Mengurai secara jernih batas tipis antara sikap kehati-hatian (ihtiyath) yang dianjurkan agama dengan jebakan waswas yang kerap menyiksa dan membebani batin dalam thaharah, shalat, dan amalan harian. Menuntun pembaca beribadah dengan tenang, yakin, dan selaras dengan kemudahan syariat.$$,
  array[
    $$Kata Pengantar dari Habib Ahmad Mujtaba bin Syihab$$,
    $$Tersedia 2 jalur pemesanan & distribusi resmi: Mesir & Indonesia$$,
    $$Solusi praktis berbasis fikih mazhab Syafi'i dan tazkiyatun nufus$$,
    $$Harga promo spesial pre-order Rp75.000 (hemat Rp15.000)$$
  ],
  $$Assalamu'alaikum Ust. Watra Sarajeva, saya ingin memesan Pre-Order Buku 'Beragama Dengan Tenang' (Harga PO Rp75.000). Mohon link Google Form untuk wilayah saya.$$,
  true,
  3
)
on conflict (id) do nothing;
