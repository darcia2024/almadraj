# Al Madraj

## Checklist Kesiapan Production

Dokumen ini menjadi acuan singkat untuk penjelasan hari Senin dan persiapan sebelum data asli dimasukkan.

## Status Saat Ini

**Status:** fondasi aplikasi dan UI sudah siap untuk dipresentasikan. Build production berhasil.

**Catatan:** sistem belum boleh dianggap live sepenuhnya sebelum koneksi Supabase, pembayaran Mayar, data asli, dan pengujian end-to-end selesai.

## Pembagian Pekerjaan

### Sudah Dikerjakan di Kode

- Alur Google Auth, proteksi route, dan sinkronisasi tombol Back/Forward.
- Katalog landing dan dashboard dari satu sumber data Supabase.
- Order idempotent, masa berlaku invoice, callback status pembayaran, dan polling status.
- Webhook Mayar untuk `payment.received` dan `payment.reminder`, validasi secret dan nominal, notifikasi, serta audit log.
- Tracker video native dan YouTube, resume posisi, serta penyimpanan progress.
- Avatar privat melalui Supabase Storage dan signed URL.
- Validasi data kelas dan materi sebelum publish.
- RLS progress dan pembatasan RPC aktivasi pembayaran ke service role.

### Harus Dikerjakan Manual oleh Pemilik Project

- Menjalankan migration `20260913000100_lms_hardening.sql` pada Supabase production.
- Mengisi environment secret di Vercel dan memastikan `APP_URL` memakai domain final.
- Menambahkan URL webhook berserta secret di dashboard Mayar dan melakukan pembayaran uji nyata.
- Mengubah Google OAuth dari Testing ke Production, mengatur domain resmi, dan menambahkan redirect URL production.
- Mengisi profil pengajar, foto kelas, testimonial berizin, kebijakan privasi, syarat penggunaan, dan refund.
- Memutuskan hosting video berbayar. Video YouTube publik/unlisted tetap dapat dibagikan di luar aplikasi; gunakan hosting privat bila kontrol akses ketat dibutuhkan.

## Yang Sudah Tersedia

- Landing page Al Madraj dengan katalog, positioning, testimonial, galeri, CTA, dan footer.
- Login Google, logout, dashboard mahasiswa, katalog, detail kelas, ruang belajar, checkout, status pembayaran, transaksi, notifikasi, dan pengaturan akun.
- Panel admin untuk mengelola kelas, bab/lesson, materi, publish status, peserta, progress, dan transaksi.
- Supabase schema, profile role, enrollment, order, lesson progress, notifikasi, audit log, RLS, dan private storage.
- Tracking progress video native dan YouTube berdasarkan waktu tontonan.
- Endpoint checkout Mayar dan webhook pembayaran.
- Katalog landing tersambung ke tabel `courses` dengan lima data asli sebagai fallback lokal.
- Validasi publish kelas dan materi pada panel admin.
- Build terakhir berhasil dengan `npm run build`.

## Yang Masih Harus Diselesaikan

### 1. Supabase Production

- [ ] Jalankan migration LMS pada project Supabase production yang benar.
- [ ] Pastikan tabel, enum, RPC, trigger profile, RLS, dan policy storage aktif.
- [ ] Pastikan bucket `lms-materials` dan `profile-avatars` bersifat private.
- [ ] Pastikan environment lokal dan Vercel mengarah ke project Supabase yang sama.
- [ ] Uji akses mahasiswa dan admin dengan akun yang berbeda.

### 2. Akun Admin

- [ ] Buat akun admin pada Supabase Auth.
- [ ] Set `profiles.role` akun tersebut menjadi `admin`.
- [ ] Uji login ke `/admin`.
- [ ] Pastikan mahasiswa biasa tidak dapat membuka fitur admin.

### 3. Data Kelas Asli

Untuk setiap kelas, siapkan:

- [ ] Nama kelas dan slug.
- [ ] Fakultas/jurusan.
- [ ] Deskripsi singkat dan deskripsi lengkap.
- [ ] Nama pengajar dan profil singkat.
- [ ] Harga, durasi akses, jumlah pertemuan, dan status publish.
- [ ] Daftar bab atau lesson dengan urutan yang benar.
- [ ] Video, PDF, atau materi pendamping asli.
- [ ] Thumbnail atau gambar kelas.

### 4. Pembayaran Mayar

- [ ] Masukkan API key dan webhook secret pada environment production server.
- [ ] Buat `MAYAR_WEBHOOK_SECRET` acak dan daftarkan webhook ke `https://DOMAIN/api/mayar/webhook?secret=SECRET`.
- [ ] Uji checkout dari akun mahasiswa.
- [ ] Pastikan pembayaran sukses mengaktifkan enrollment secara otomatis.
- [ ] Uji webhook tanpa secret atau dengan secret yang tidak valid.
- [ ] Uji webhook duplikat agar tidak membuat enrollment atau order ganda.

### 5. Konten Marketing

Konten kelas landing sudah berasal dari Supabase. Bagian marketing berikut tetap harus disiapkan manual sebelum launch:

- [ ] Copywriting final Al Madraj.
- [ ] Foto galeri pembelajaran asli.
- [ ] Testimonial yang sudah mendapat izin penggunaan.
- [ ] Pastikan data katalog final sudah publish di Supabase.
- [ ] Link kontak, kebijakan privasi, ketentuan penggunaan, dan refund.

### 6. Pengujian Wajib

- [ ] Login pertama dengan Google dan logout.
- [ ] Melihat katalog dan detail kelas.
- [ ] Checkout, redirect Mayar, webhook, dan halaman status pembayaran.
- [ ] Akses kelas hanya setelah enrollment aktif.
- [ ] Memutar video dan menyimpan progress.
- [ ] Membuka PDF atau materi pendamping.
- [ ] Progress tetap tersimpan setelah logout dan login ulang.
- [ ] Admin membuat, mengedit, publish, dan mengarsipkan kelas.
- [ ] Mahasiswa tidak dapat melihat data mahasiswa lain atau kelas unpublished.

### 7. Deployment dan Operasional

- [ ] Deploy ke domain production dengan HTTPS.
- [ ] Isi environment variable Vercel sesuai environment production.
- [ ] Jangan memasukkan service role key atau secret ke frontend, Git, atau file `VITE_`.
- [ ] Aktifkan backup/PITR Supabase.
- [ ] Cek log Supabase dan Vercel Functions.
- [ ] Siapkan kontak teknis dan prosedur jika pembayaran atau upload materi gagal.

## Alur Demo Hari Senin

Gunakan alur ini saat menjelaskan sistem:

1. Buka landing page dan jelaskan positioning Al Madraj.
2. Login sebagai admin dan buka `/admin`.
3. Tunjukkan pembuatan kelas, lesson, materi, harga, dan publish status.
4. Buka katalog sebagai mahasiswa.
5. Buka detail kelas dan lanjut ke checkout.
6. Jelaskan alur pembayaran sampai enrollment aktif.
7. Buka ruang belajar dan tunjukkan video, materi, serta progress.
8. Kembali ke admin untuk melihat peserta, transaksi, dan progress.

> Jangan gunakan `/ui-preview` untuk menjelaskan sistem production karena route tersebut masih memakai data demo/localStorage.

## Format Data Kelas yang Perlu Disiapkan

```text
Nama kelas:
Slug:
Fakultas/jurusan:
Deskripsi singkat:
Deskripsi lengkap:
Nama pengajar:
Profil pengajar:
Harga:
Durasi akses:
Thumbnail:

Lesson 1:
- Judul:
- Deskripsi:
- Video atau file:
- Durasi:

Lesson 2:
- Judul:
- Deskripsi:
- Video atau file:
- Durasi:
```

## Definisi Siap Live

Al Madraj siap digunakan ketika admin dapat membuat dan menerbitkan kelas, mahasiswa dapat mendaftar dan membayar, webhook membuka akses otomatis, materi dapat dipelajari, progress tersimpan, dan akses yang tidak berwenang ditolak.
