# Panduan pemasangan GASPOL

GASPOL adalah situs statis. Tidak perlu memasang database, Node.js, atau Python. Yang dipasang adalah isi folder `gaspol-web`: `index.html`, `css`, `js`, dan `favicon.svg`.

Data akun, pesanan, kelas, dan voucher tersimpan di peramban masing-masing pengunjung, bukan di satu server bersama. Pesanan yang dibuat di ponsel Anda tidak muncul di ponsel orang lain.

## 1. Menjalankan di komputer

Cara paling sederhana: buka File Explorer ke folder ini, lalu klik dua kali `index.html`. Situs terbuka di peramban.

Alamat folder:

`C:\Users\DOMAS PC\OneDrive\ドキュメント\Cursor\Proyek GAS\1 Gaspol\gaspol-web`

Kalau pratinjau lokal masih hidup, buka juga `http://127.0.0.1:8765`.

### Akun percobaan

| Peran | Email | Kata sandi |
| --- | --- | --- |
| Admin utama | atang@gaspol.id | GaspolAdmin1 |
| Tim admin | tim@gaspol.id | GaspolTim1 |
| Peserta | peserta@gaspol.id | Peserta123 |

Kode voucher: `COBA-GAS` dan `COBA-JUAL` masih bisa dipakai. `COBA-NOL` hanya untuk akun yang belum punya kelas dari nol. `COBA-HABIS` sudah terpakai, `COBA-LAMA` kedaluwarsa, `COBA-MATI` nonaktif.

Tombol **Kembalikan data contoh** di halaman Masuk mengembalikan katalog dan akun di atas pada peramban itu saja.

## 2. Siapkan sebelum dipublikasikan

1. Masuk sebagai `atang@gaspol.id`.
2. Buka **Panel admin → Pengaturan**.
3. Ganti rekening, e-wallet, unggah QRIS asli, isi WhatsApp (diawali 62), email admin, dan tautan Lynk.id.
4. Simpan. Peringatan "masih contoh" hilang setelah nomor `1234567890` dan kata `CONTOH` tidak ada lagi di rekening maupun e-wallet.
5. Di **Akun**, ganti kata sandi admin.
6. Di **Kelas & modul**, ganti tautan Lynk.id tiap kelas dengan tautan produk Anda.
7. Di **Pengaturan → Cadangan**, unduh berkas JSON dan simpan sebagai salinan.

Kata sandi yang diubah lewat layar hanya berlaku di peramban itu. Pengunjung baru tetap mendapat akun contoh dari kode situs. Sebelum situs dipakai sungguhan, ganti juga kata sandi awal di `js/store.js` (teks `GaspolAdmin1`, `GaspolTim1`, dan `Peserta123`) dan hapus kotak "Akun percobaan" di `js/app.js`.

## 3. Pasang di GitHub Pages

1. Buka [github.com/new](https://github.com/new) dan masuk ke akun GitHub.
2. Isi nama repositori, misalnya `gaspol`. Pilih **Public**.
3. Buat repositori tanpa menambah README, supaya unggahan tidak bentrok.
4. Di halaman repositori yang kosong, pilih **uploading an existing file**.
5. Seret **isi** folder `gaspol-web` (harus terlihat `index.html` di daftar, bukan folder induknya).
6. Tulis pesan commit, lalu **Commit changes**.
7. Buka **Settings → Pages**.
8. Source: **Deploy from a branch**. Branch: `main`. Folder: `/ (root)`. Simpan.
9. Tunggu satu sampai dua menit, lalu muat ulang Settings. Alamat situs muncul, berbentuk `https://namapengguna.github.io/gaspol/`.

Kalau yang diunggah adalah folder `gaspol-web` itu sendiri, situs ada di `https://namapengguna.github.io/gaspol/gaspol-web/`. Lebih rapi jika `index.html` berada di akar repositori.

Setiap kali berkas diubah, unggah lagi berkas yang berubah ke repo yang sama. GitHub Pages memperbarui situs beberapa menit kemudian.

## 4. Pasang di Vercel

1. Selesaikan dulu unggahan GitHub di atas.
2. Buka [vercel.com](https://vercel.com) dan daftar memakai akun GitHub.
3. Pilih **Add New… → Project**, lalu **Import** repositori `gaspol`.
4. Isi pengaturan ini:
   - Framework Preset: **Other**
   - Root Directory: `./` jika `index.html` ada di akar repo. Jika repo berisi folder `gaspol-web`, pilih folder itu.
   - Build Command: kosongkan
   - Output Directory: kosongkan
   - Install Command: kosongkan
5. Pilih **Deploy**.
6. Setelah selesai, salin alamat `https://nama-proyek.vercel.app`.

Pembaruan dari GitHub akan dipasang ulang oleh Vercel secara otomatis.

Domain sendiri bisa ditambahkan lewat **Settings → Domains** pada proyek Vercel, lalu ikuti dua catatan DNS yang ditampilkan di sana.

## 5. Sematkan di Blogspot

Blogspot tidak menyimpan aplikasi ini. Yang dipasang adalah jendela ke alamat Vercel atau GitHub Pages. Selesaikan bagian 3 atau 4 lebih dulu.

1. Salin alamat situs, misalnya `https://nama-proyek.vercel.app`.
2. Buka [blogspot.com](https://www.blogspot.com), pilih blog, lalu **Tema → Sesuaikan → Tata letak**.
3. Pilih **Tambahkan Gadget → HTML/JavaScript**.
4. Buka berkas `sematkan-blogspot.html`, salin isinya, tempel ke gadget.
5. Ganti `https://NAMA-PROYEK.vercel.app` dengan alamat situs Anda. Jangan menghapus `https://`.
6. Simpan gadget, lalu simpan tata letak.
7. Buka blog dan pastikan GASPOL tampil.

Kalau tema tidak punya menu Tata letak, buat **Halaman baru**, ubah editor ke mode HTML, lalu tempel kode yang sama. Iframe di dalam postingan biasa sering dibuang Blogspot, jadi gadget atau halaman HTML lebih aman.

Tautan TikTok bio diisi dengan alamat Vercel atau GitHub Pages, bukan alamat Blogspot, supaya pengunjung langsung masuk ke aplikasi.

## 6. Setelah situs hidup

- Buka situs di ponsel dan di komputer.
- Coba masuk, pesan satu aplikasi, tukar `COBA-GAS`, lalu buka kelas.
- Masuk sebagai admin, setujui pesanan itu, dan buka bukti pesanan.
- Dari bukti pesanan, pilih **Cetak atau simpan PDF** bila perlu arsip.
- Unduh cadangan JSON secara berkala.

Email pada situs ini ditampilkan sebagai pratinjau. Pengiriman Gmail dan PDF ke Google Drive baru ada bila backend-nya dipasang sebagai Google Apps Script, sesuai PRD. Hosting Vercel, GitHub Pages, dan Blogspot tidak menjalankan Apps Script.
