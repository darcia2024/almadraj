# Panduan Integrasi Pembayaran Mayar.id — Al Madraj

Dokumen ini adalah panduan lengkap langkah-demi-langkah untuk mengaktifkan pembayaran otomatis menggunakan **Mayar.id** di platform Al Madraj.

Platform Al Madraj telah dirancang siap pakai (*production-ready*) dengan **3 opsi pembayaran**:
1. **Otomatis via Mayar API (Disarankan)**: Pembeli memilih QRIS, Virtual Account (BCA, Mandiri, BSI, BRI, BNI), atau E-Wallet -> Webhook Mayar memvalidasi pembayaran -> Kelas langsung aktif otomatis tanpa campur tangan admin.
2. **Direct Mayar Payment Link**: Cukup buat payment link satuan di dashboard Mayar, lalu tempelkan link tersebut pada pengaturan kelas di Panel Admin Al Madraj.
3. **Fallback WhatsApp**: Jika akun Mayar belum aktif atau sedang dalam verifikasi, sistem secara otomatis menyediakan tombol konfirmasi via WhatsApp admin agar tidak ada potensi peserta yang gagal mendaftar.

---

## 1. Registrasi Akun Mayar

1. Buka [https://mayar.id](https://mayar.id) dan klik **Daftar**.
2. Anda dapat mendaftar sebagai **Perorangan** (Freelancer/Creator) atau **Badan Usaha / Yayasan**.
3. Selesaikan verifikasi identitas (KYC):
   - KTP pemilik akun.
   - Rekening bank tujuan pencairan (*payout*).
   - Nomor WhatsApp aktif.
4. Mayar menyediakan 2 lingkungan:
   - **Sandbox / Testnet**: Untuk mencoba transaksi simulasi tanpa uang sungguhan.
   - **Production (Live)**: Untuk menerima pembayaran resmi dari jamaah/peserta.

---

## 2. Mengambil API Key Mayar

1. Masuk ke Dashboard Mayar Anda.
2. Buka menu **Integrasi** atau **Developer Settings** -> **API Keys**.
3. Klik **Generate API Key** (atau salin API Token yang sudah ada).
4. Simpan API Key ini secara aman. Jangan pernah membagikan API Key ini di forum publik atau menyimpannya di file frontend.

---

## 3. Menyiapkan Webhook Mayar

Webhook berfungsi agar server Mayar memberi tahu server Al Madraj seketika jamaah selesai membayar (QRIS ter-scan / VA terbayar), sehingga materi kelas otomatis terbuka.

### A. Tentukan Webhook Secret
Buat satu kata sandi rahasia acak, misalnya:
```text
almadraj_mayar_secret_2026
```
*(Bisa menggunakan kombinasi huruf dan angka bebas)*.

### B. Konfigurasi di Dashboard Mayar
1. Di Dashboard Mayar, buka menu **Integrasi** -> **Webhooks**.
2. Masukkan URL Webhook Al Madraj:
   ```text
   https://[DOMAIN-WEBSITE-KAMU]/api/mayar/webhook?secret=almadraj_mayar_secret_2026
   ```
   *Contoh:* `https://almadraj.com/api/mayar/webhook?secret=almadraj_mayar_secret_2026`
   *(Catatan: Anda juga dapat melihat dan menyalin URL siap pakai langsung dari Panel Admin Al Madraj di tab **"Integrasi Mayar"**)*.
3. Pilih Event yang ingin dikirim oleh Mayar:
   - Centang: `payment.received`
   - Centang: `payment.successful` (jika ada)
   - Centang: `invoice.paid` (jika ada)
4. Simpan konfigurasi Webhook.

---

## 4. Pengaturan Environment Variables di Vercel

Buka dashboard hosting Vercel Anda di:
`Project Settings` -> `Environment Variables`, lalu tambahkan key berikut:

| Nama Variabel | Contoh Nilai | Keterangan |
| :--- | :--- | :--- |
| `MAYAR_API_KEY` | `eyJhbGciOi...` | API Key dari Dashboard Mayar |
| `MAYAR_WEBHOOK_SECRET` | `almadraj_mayar_secret_2026` | Kode rahasia yang sama dengan parameter `?secret=` pada Webhook |
| `SUPABASE_SECRET_KEY` | `sb_secret_...` | Supabase Service Role Key (untuk update database enrollment) |
| `APP_URL` | `https://almadraj.com` | URL domain publik website Al Madraj |
| `MAYAR_API_URL` *(Opsional)* | `https://api.mayar.id/hl/v1/payment/create` | Default endpoint Mayar API |

> **PENTING**: Setelah menambahkan atau mengubah Environment Variables di Vercel, lakukan **Redeploy** pada deployment terakhir agar variabel baru terbaca oleh Serverless Function.

---

## 5. Menggunakan Jalur Direct Link Mayar (Alternatif Cepat)

Jika Anda belum sempat mengonfigurasi API dan Webhook, Anda tetap bisa memakai Mayar dengan cara paling mudah:

1. Di Dashboard Mayar, buka menu **Pembayaran** -> **Buat Pembayaran / Single Payment Link**.
2. Buat link dengan nominal sesuai harga kelas (misal: "Dars Kitab Tauhid - Rp 150.000").
3. Salin link pembayaran yang dihasilkan (misal: `https://mayar.link/p/dars-tauhid`).
4. Masuk ke **Panel Admin Al Madraj** (`/admin`), edit kelas yang bersangkutan pada tab **Informasi Dasar**.
5. Isi kolom **"Direct Mayar Payment Link"** dengan link tersebut.
6. Simpan kelas. Sekarang ketika peserta mengklik checkout, mereka langsung diarahkan ke link pembayaran Mayar tersebut.

---

## 6. Fitur Bantuan di Panel Admin Al Madraj

Untuk memudahkan admin, di Panel Admin Al Madraj (`/admin`) telah tersedia tab khusus:
**"Integrasi Mayar"** (ikon petir ⚡ di bilah navigasi admin).

Pada tab ini, Admin dapat:
- Melihat format Webhook URL yang otomatis menyesuaikan domain saat ini.
- Menekan tombol **Salin Webhook URL** 1-klik untuk langsung ditempel ke dashboard Mayar.
- Memeriksa daftar checklist environment variables yang wajib ada di server.
- Mengikuti 4 langkah praktis panduan aktivasi.

---

## 7. Verifikasi & Pengujian Alur Pembayaran

1. Buka website Al Madraj sebagai peserta (bisa memakai mode incognito atau akun Google test).
2. Pilih salah satu kelas berbayar dan klik **Daftar Sekarang**.
3. Pada halaman checkout (`/checkout/:slug`), periksa opsi pembayaran Mayar:
   - Klik **Bayar Otomatis (Mayar)**.
   - Sistem akan membuat tagihan resmi Mayar dan membuka halaman pembayaran (QRIS / VA / E-Wallet).
4. Lakukan pembayaran (di mode Sandbox Mayar, Anda bisa klik tombol bayar simulasi).
5. Mayar akan memicu webhook `/api/mayar/webhook`.
6. Sistem Al Madraj memverifikasi transaksi:
   - Status order diubah menjadi `paid`.
   - Status enrollment diubah menjadi `active`.
   - Notifikasi masuk ke akun peserta.
7. Peserta otomatis diarahkan ke ruang belajar (`/belajar/:slug`) dan materi sudah terbuka.

---

## 8. Bantuan & Dukungan Teknis

Jika mengalami kendala pada saat pengujian:
- **Periksa Log Vercel**: Buka Vercel -> tab **Logs** -> cari request ke `/api/mayar/create-checkout` atau `/api/mayar/webhook` untuk melihat respon dari Mayar.
- **Periksa Log Webhook Mayar**: Di Dashboard Mayar menu **Webhooks**, klik detail riwayat pengiriman. Status HTTP 200 menandakan webhook berhasil diterima oleh Al Madraj.
- **Hubungi Mayar**: Dokumentasi resmi Mayar dapat diakses di [https://docs.mayar.id](https://docs.mayar.id).
