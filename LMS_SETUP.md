# Al Madraj LMS Production Setup

Runtime LMS sekarang memakai Supabase Auth, PostgreSQL, RLS, dan endpoint server-side Mayar. Tidak ada akun, enrollment, atau progress yang disimpan di browser.

## 1. Supabase

1. Buat project Supabase khusus LMS. Jangan gunakan project barbershop lama.
2. Jalankan migrasi pada folder [supabase/migrations](./supabase/migrations) berurutan, termasuk `20260912000600_seed_dars_programs.sql`, `20260912000700_remove_demo_courses.sql`, dan `20260913000100_lms_hardening.sql`; atau jalankan [supabase_lms_schema.sql](./supabase_lms_schema.sql) sekali di SQL Editor untuk instalasi manual baru. Migration seed mengisi 2 Dars berbayar, 3 Dars gratis, URL video YouTube yang sudah tersedia, dan fungsi enrollment gratis. Migration cleanup menghapus seluruh kelas dummy selain lima program Al-Madraj yang sudah disuplai.
3. Pastikan bucket `lms-materials` dan `profile-avatars` tetap private. Akses file memakai signed URL; materi hanya diberikan kepada peserta dengan enrollment aktif dan avatar hanya kepada pemilik akun.
4. Buat akun admin melalui Auth, lalu ubah role-nya setelah profil terbentuk:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_AKUN_ADMIN';
```

5. Salin `.env.example` menjadi `.env.local` dan isi URL serta publishable key project.

## 2. Mayar

Isi secret berikut hanya di environment server/Vercel, jangan di source code dan jangan memakai `VITE_`:

```text
SUPABASE_SECRET_KEY=...
MAYAR_API_KEY=...
APP_URL=https://domain-produksi-al-madraj.com
```

Isi `MAYAR_WEBHOOK_SECRET` dengan string acak panjang buatan sendiri. Endpoint menerima secret lewat query URL atau header `x-webhook-secret`, membatasi request, memvalidasi nominal, menjaga idempotensi order, mengaktifkan enrollment, menulis notifikasi, dan mencatat audit.

Set webhook Mayar ke:

```text
https://domain-produksi-al-madraj.com/api/mayar/webhook?secret=ISI_DENGAN_MAYAR_WEBHOOK_SECRET
```

Event yang diproses adalah `payment.received` dan `payment.reminder`. Enrollment baru berubah menjadi `active` setelah `payment.received` berhasil diproses. Jangan menaruh URL webhook yang memuat secret di source code atau tangkapan layar publik.

## 3. Operasional

- `admin@...` mengelola kelas, materi, peserta, akses, progress, dan transaksi dari `/admin`.
- Peserta masuk hanya melalui Google Auth, lalu memakai `/pengaturan` dan `/transaksi`.
- Progress video native dan YouTube disimpan berdasarkan waktu tonton aktual, bukan sekadar klik selesai.
- Setelah kembali dari Mayar, `/pembayaran/:order` memeriksa status otomatis dan mengarahkan peserta ke ruang belajar setelah akses aktif.
- Katalog landing dan dashboard membaca tabel `courses`, sehingga harga dan publish status memiliki satu sumber data.
- Notifikasi pembayaran masuk ke tabel `notifications`; email pembayaran dikirim jika `RESEND_API_KEY` dan `NOTIFICATION_FROM_EMAIL` diisi.
- `admin_audit_logs` menyimpan perubahan admin dan event pembayaran.
- Aktifkan Point-in-Time Recovery/backup sesuai paket Supabase, pantau Vercel Functions dan Supabase Logs, serta atur alert error di provider sebelum go-live.

## 4. Verifikasi

```powershell
npm run build
npm run dev -- --host 127.0.0.1
```

Buka `/register`, buat akun, masuk ke `/dashboard`, pilih kelas, dan lanjutkan checkout. Tanpa environment variable Supabase, aplikasi sengaja berhenti di halaman konfigurasi backend dan tidak membuat data demo.
