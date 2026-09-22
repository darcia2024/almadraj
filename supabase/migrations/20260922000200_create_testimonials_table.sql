-- Migration: Create testimonials table for dynamic landing page reviews
-- Run this in Supabase SQL Editor if table does not exist

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initials text,
  role text not null,
  university text default '',
  tag text default 'Masisir Kairo',
  course text default '',
  year text default '',
  rating numeric default 5.0,
  avatar_color text default 'from-[#006d77] to-[#148369]',
  avatar_url text default '',
  quote text not null,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.testimonials enable row level security;

-- Public can read all active testimonials
create policy "Allow public read active testimonials"
  on public.testimonials
  for select
  using (true);

-- Authenticated admins can manage (insert/update/delete) testimonials
create policy "Allow admins to manage testimonials"
  on public.testimonials
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Seed default authentic testimonials
insert into public.testimonials (name, initials, role, university, tag, course, year, rating, avatar_color, quote, is_active, sort_order)
values
  ('Muhammad Fatih Al-Azhari', 'MF', 'Fakultas Syariah Islamiyyah (FSI)', 'Tingkat 3 · Darrasa, Kairo', 'Masisir Kairo', 'Kajian Fikih Matan Abi Syuja', 'Masisir 2022', 5, 'from-[#006d77] to-[#148369]', 'Pembahasan muqarrar fikih per bab bikin saya jauh lebih gampang membedah ibarat kitab sebelum imtihan. Catatan faedah dan murojaah bersama mentor ngebantu banget pas belajar di Darrasa.', true, 1),
  ('Hilman Syauqil Haq', 'HS', 'Fakultas Ushuluddin (Tafsir & Hadits)', 'Tingkat 4 · Hay ''Asyir, Kairo', 'Masisir Kairo', 'Kajian Aqidah Ithaf al-Murid', 'Masisir 2021', 5, 'from-[#0a485c] to-[#157a99]', 'Nggak lagi bingung mulai dari mana saat buka diktat muqarrar tebal. Alur syarah aqidah di Al Madraj runut dari penjelasan matan sampai takhrij dalil, sangat pas buat amunisi imtihan termin.', true, 2),
  ('Nida Khairunnisa, Lc.', 'NK', 'Fak. Dirasat Islamiyyah Banat (FDIA)', 'Alumni 2024 · Madinat Nashr, Kairo', 'Alumni Kairo', 'Kajian Adab Mabahits Turats', 'Alumni Masisir', 5, 'from-[#2e4735] to-[#456950]', 'Ibarat sastra klasik dan kaidah balaghah yang sering muncul di lembar soal imtihan dibedah sangat tuntas. Ini platform dars digital pertama yang benar-benar memahami kebutuhan anak Masisir.', true, 3),
  ('Faris Naufal As-Suyuthi', 'FN', 'Fakultas Lughah Arabiyyah (FLA)', 'Tingkat 2 · Hay Tsamin, Kairo', 'Masisir Kairo', 'Kelas Tajwid Al-Qawl As-Sadid', 'Masisir 2023', 5, 'from-[#006d77] to-[#15805e]', 'Talaqqi tajwidnya berasa seperti duduk langsung di halaqah masjid. Penjelasan makharijul huruf dan sanad matan Al-Qawl As-Sadid sangat sistematis, bisa disimak ulang kapan pun.', true, 4),
  ('Ahmad Syakir Zulfikar', 'AS', 'Peserta Bimbel Rumah Sinai', 'FSI Tingkat 2 · Darrasa, Kairo', 'Bimbel Imtihan', 'Bimbel Imtihan Al-Azhar', 'Termin II 2024', 5, 'from-[#094d40] to-[#187563]', 'Pas minggu tenang imtihan, video rekaman materi dan rangkuman PDF di dashboard ini penyelamat banget. Nggak perlu lagi pusing nyari link rekaman tercecer di grup angkatan.', true, 5),
  ('Zulfa Mumtazah Al-Hafizhah', 'ZM', 'Persiapan Masuk Al-Azhar (Maba)', 'Belajar dari Jombang, Jawa Timur', 'Calon Masisir', 'Dars Turats & Bahasa Arab Dasar', 'Maba 2025', 5, 'from-[#1b4332] to-[#2d6a4f]', 'Walaupun masih di Indonesia menunggu jadwal keberangkatan ke Kairo, saya sudah bisa adaptasi dengan muqarrar dan ritme belajar dars turats Al-Azhar. Akses webnya super cepat dan enteng di HP.', true, 6);
