/* GASPOL — penyimpanan lokal yang meniru tabel di PRD. */
(function () {
  const DB_KEY = "gaspol_db";
  const TOKEN_KEY = "gaspol_token";
  const GUARD_KEY = "gaspol_voucher_guard";
  const SNAP_KEY = "gaspol_snap";
  const VERSION = 1;

  const ROLES = {
    pengunjung: "Pengunjung",
    peserta: "Peserta kelas",
    tim_admin: "Tim admin",
    admin_utama: "Admin utama"
  };

  let db = null;
  let urutanKirim = 0;
  let urutanSelesai = 0;
  let cacheAwal = false;

  function alamatJembatan() {
    if (typeof window === "undefined" || !window.GASPOL_URL) return "";
    const match = String(window.GASPOL_URL).trim().match(/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec/);
    return match ? match[0] : "";
  }
  const REMOTE_URL = alamatJembatan();
  const REMOTE = !!REMOTE_URL;
  const URL_SALAH = typeof window !== "undefined" && !!String(window.GASPOL_URL || "").trim() && !REMOTE;

  function dbKosong() {
    return {
      meta: { versi: VERSION, dibuat: "" },
      pengaturan: {
        nama_web: "GASPOL",
        rekening_bank: "",
        e_wallet: "",
        gambar_QRIS: "",
        kontak_WhatsApp: "",
        email_admin: "",
        link_lynk: "https://lynk.id/",
        templat_email: ""
      },
      pengguna: [],
      produk: [],
      kelas: [],
      modul: [],
      pesanan: [],
      peserta: [],
      voucher: [],
      log: [],
      sesi: [],
      reset: []
    };
  }

  function rapikanCuplikan(snap) {
    const next = snap && typeof snap === "object" ? snap : dbKosong();
    if (!next.pengaturan) next.pengaturan = dbKosong().pengaturan;
    ["pengguna", "produk", "kelas", "modul", "pesanan", "peserta", "voucher", "log", "sesi", "reset"].forEach((key) => {
      if (!Array.isArray(next[key])) next[key] = [];
    });
    next.produk.forEach((item) => {
      item.harga_mulai = Number(item.harga_mulai) || 0;
      item.urutan = Number(item.urutan) || 0;
      item.bisa_custom = item.bisa_custom === true || String(item.bisa_custom).toUpperCase() === "YA";
    });
    next.kelas.forEach((item) => { item.harga = Number(item.harga) || 0; });
    next.modul.forEach((item) => { item.urutan = Number(item.urutan) || 0; });
    next.pesanan.forEach((item) => { item.nominal = Number(item.nominal) || 0; });
    next.sesi.forEach((item) => { item.exp = Number(item.exp) || 0; });
    return next;
  }

  function pendekData(nilai) {
    return typeof nilai === "string" && nilai.indexOf("data:") === 0 && nilai.length > 8000 ? "" : nilai;
  }
  function simpanSnap() {
    try {
      const next = JSON.parse(JSON.stringify(db));
      next.produk.forEach((item) => { item.gambar_url = pendekData(item.gambar_url); });
      next.kelas.forEach((item) => { item.gambar_url = pendekData(item.gambar_url); });
      next.modul.forEach((item) => { item.url_atau_file_id = pendekData(item.url_atau_file_id); });
      next.pesanan.forEach((item) => { item.bukti_file_id = pendekData(item.bukti_file_id); });
      if (next.pengaturan) next.pengaturan.gambar_QRIS = pendekData(next.pengaturan.gambar_QRIS);
      localStorage.setItem(SNAP_KEY, JSON.stringify(next));
    } catch (err) {}
  }
  function tampilCache() {
    try {
      const raw = localStorage.getItem(SNAP_KEY);
      if (!raw) return false;
      db = rapikanCuplikan(JSON.parse(raw));
      if (!localStorage.getItem(TOKEN_KEY)) {
        db.pesanan = [];
        db.peserta = [];
        db.voucher = [];
        db.log = [];
        db.sesi = [];
        db.reset = [];
        db.modul.forEach((item) => { item.url_atau_file_id = ""; });
        db.pengguna = db.pengguna.map((item) => ({
          id_pengguna: item.id_pengguna, nama: item.nama, email: "", whatsapp: "", peran: "", status: "aktif"
        }));
      }
      return true;
    } catch (err) {
      return false;
    }
  }
  function kirim(aksi, data) {
    const tokenNow = localStorage.getItem(TOKEN_KEY) || "";
    const saya = ++urutanKirim;
    return fetch(REMOTE_URL, {
      method: "POST",
      cache: "no-store",
      body: JSON.stringify({ aksi: aksi, token: tokenNow, data: data || {} })
    }).then(async (res) => {
      const text = await res.text();
      let payload;
      try {
        payload = JSON.parse(text.replace(/^\)]\}',?\s*/, ""));
      } catch (err) {
        throw new Error("Data tidak menjawab. Periksa tautan di config.js, lalu muat ulang.");
      }
      if (!payload.ok) throw new Error(payload.pesan || "Permintaan gagal.");
      if (saya < urutanSelesai) return payload.hasil;
      urutanSelesai = saya;
      if (payload.hapusToken) localStorage.removeItem(TOKEN_KEY);
      else if (payload.token) localStorage.setItem(TOKEN_KEY, payload.token);
      if (payload.cuplikan) {
        db = rapikanCuplikan(payload.cuplikan);
        simpanSnap();
      }
      return payload.hasil;
    });
  }

  function rotr(x, n) {
    return (x >>> n) | (x << (32 - n));
  }

  function sha256(str) {
    const bytes = new TextEncoder().encode(String(str));
    const bitLen = bytes.length * 8;
    const padLen = ((bytes.length + 9 + 63) >> 6) << 6;
    const padded = new Uint8Array(padLen);
    padded.set(bytes);
    padded[bytes.length] = 0x80;
    const view = new DataView(padded.buffer);
    view.setUint32(padLen - 8, Math.floor(bitLen / 0x100000000));
    view.setUint32(padLen - 4, bitLen >>> 0);

    const K = new Uint32Array([
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    const H = new Uint32Array([
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    const W = new Uint32Array(64);

    for (let i = 0; i < padLen; i += 64) {
      for (let t = 0; t < 16; t++) W[t] = view.getUint32(i + t * 4);
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ (W[t - 15] >>> 3);
        const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + temp1) >>> 0; d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    return Array.from(H).map((x) => x.toString(16).padStart(8, "0")).join("");
  }

  function isoDays(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    d.setHours(10, 0, 0, 0);
    return d.toISOString();
  }

  function dateOnly(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function nid(prefix) {
    const rand = new Uint8Array(4);
    crypto.getRandomValues(rand);
    const tail = Array.from(rand).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
    return prefix + "-" + Date.now().toString(36).toUpperCase() + tail.slice(0, 4);
  }

  function token() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  function clean(value, max) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
  }

  function uang(value) {
    const digits = String(value || "").replace(/[^\d]/g, "");
    if (!digits) throw new Error("Isi nominal dengan angka.");
    const n = Number(digits);
    if (!Number.isFinite(n)) throw new Error("Nominal tidak valid.");
    return n;
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function fail(message) {
    throw new Error(message);
  }

  function coverArt(judul, atas, bawah) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${atas}"/><stop offset="1" stop-color="${bawah}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="680" cy="80" r="74" fill="rgba(255,255,255,0.16)"/><text x="48" y="250" fill="#ffffff" font-family="Arial" font-size="46" font-weight="700">${judul}</text></svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function diagram() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="360" viewBox="0 0 880 360">
      <rect width="880" height="360" rx="28" fill="#F0FDFA"/>
      <rect x="40" y="110" width="200" height="120" rx="22" fill="#0F766E"/>
      <rect x="340" y="110" width="200" height="120" rx="22" fill="#0D9488"/>
      <rect x="640" y="110" width="200" height="120" rx="22" fill="#115E59"/>
      <path d="M250 170h80M550 170h80" stroke="#99F6E4" stroke-width="8" stroke-linecap="round"/>
      <text x="140" y="168" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="700">Pilih</text>
      <text x="140" y="198" text-anchor="middle" fill="#CCFBF1" font-family="Arial" font-size="16">aplikasi / kelas</text>
      <text x="440" y="168" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="700">Bayar</text>
      <text x="440" y="198" text-anchor="middle" fill="#CCFBF1" font-family="Arial" font-size="16">transfer / Lynk.id</text>
      <text x="740" y="168" text-anchor="middle" fill="#fff" font-family="Arial" font-size="22" font-weight="700">Pakai</text>
      <text x="740" y="198" text-anchor="middle" fill="#CCFBF1" font-family="Arial" font-size="16">setelah disetujui</text>
    </svg>`;
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function createSeed() {
    const adminHash = sha256("GaspolAdmin1");
    const timHash = sha256("GaspolTim1");
    const pesertaHash = sha256("Peserta123");
    return {
      meta: { versi: VERSION, dibuat: new Date().toISOString() },
      pengaturan: {
        nama_web: "GASPOL",
        rekening_bank: "Bank BCA\n1234567890\na.n. Atang Wiharto (CONTOH)",
        e_wallet: "DANA\n081200000000\na.n. Atang Wiharto (CONTOH)",
        gambar_QRIS: "",
        kontak_WhatsApp: "",
        email_admin: "atang@gaspol.id",
        link_lynk: "https://lynk.id/",
        templat_email: "Halo {{nama}},\n\nPesanan {{id}} sebesar {{nominal}} sekarang berstatus: {{status}}.\nCatatan: {{catatan}}\n\nPembayaran dicek manual oleh admin. Akses atau pengerjaan dibuka setelah status disetujui.\n\n— GASPOL, builder by Atang Wiharto"
      },
      pengguna: [
        { id_pengguna: "USR-ADMIN", nama: "Atang Wiharto", email: "atang@gaspol.id", whatsapp: "620000000001", hash_kata_sandi: adminHash, peran: "admin_utama", status: "aktif", tanggal_daftar: isoDays(-40) },
        { id_pengguna: "USR-TIM", nama: "Tim GASPOL", email: "tim@gaspol.id", whatsapp: "620000000002", hash_kata_sandi: timHash, peran: "tim_admin", status: "aktif", tanggal_daftar: isoDays(-20) },
        { id_pengguna: "USR-PESERTA", nama: "Peserta Demo", email: "peserta@gaspol.id", whatsapp: "620000000003", hash_kata_sandi: pesertaHash, peran: "peserta", status: "aktif", tanggal_daftar: isoDays(-12) }
      ],
      produk: [
        { id_produk: "PRD-BIO", nama: "Link Bio Usaha", deskripsi: "Satu halaman untuk tautan WhatsApp, jam buka, lokasi, dan daftar layanan. Cocok dipasang di bio TikTok.", harga_mulai: 50000, bisa_custom: true, gambar_url: "", status: "aktif", urutan: 1 },
        { id_produk: "PRD-FORM", nama: "Form Pesanan", deskripsi: "Pelanggan mengisi pesanan, Anda menerima rekapnya tanpa aplikasi tambahan.", harga_mulai: 75000, bisa_custom: true, gambar_url: "", status: "aktif", urutan: 2 },
        { id_produk: "PRD-TAMU", nama: "Buku Tamu", deskripsi: "Catat tamu acara, kelas, atau stan. Rekap bisa diunduh kapan saja.", harga_mulai: 50000, bisa_custom: true, gambar_url: "", status: "aktif", urutan: 3 },
        { id_produk: "PRD-ABSEN", nama: "Absensi Kegiatan", deskripsi: "Daftar hadir untuk kelas, rapat, atau arisan, lengkap dengan nama dan waktu.", harga_mulai: 100000, bisa_custom: true, gambar_url: "", status: "aktif", urutan: 4 },
        { id_produk: "PRD-KATALOG", nama: "Katalog UMKM", deskripsi: "Etalase produk dengan harga dan tombol chat WhatsApp. Tampil rapi di ponsel.", harga_mulai: 150000, bisa_custom: true, gambar_url: "", status: "aktif", urutan: 5 },
        { id_produk: "PRD-UMUM", nama: "Papan Pengumuman", deskripsi: "Pengumuman untuk warga, sekolah, atau komunitas. Cukup kirim tautannya.", harga_mulai: 100000, bisa_custom: false, gambar_url: "", status: "aktif", urutan: 6 },
        { id_produk: "PRD-LAMA", nama: "Paket Lama", deskripsi: "Contoh produk arsip. Tidak tampil di katalog.", harga_mulai: 50000, bisa_custom: false, gambar_url: "", status: "arsip", urutan: 9 }
      ],
      kelas: [
        { id_kelas: "KLS-NOL", judul: "Web Tanpa Koding dari Nol", deskripsi: "Dipandu langkah demi langkah sampai web pertama Anda hidup, tanpa membeli hosting.", harga: 149000, link_lynk: "https://lynk.id/", gambar_url: coverArt("Web dari nol", "#0f766e", "#134e4a"), status: "aktif" },
        { id_kelas: "KLS-GAS", judul: "Merakit Aplikasi Google Sendiri", deskripsi: "Pahami alur data, formulir, dan tampilan agar Anda bisa mengubah aplikasi sendiri.", harga: 199000, link_lynk: "https://lynk.id/", gambar_url: coverArt("Aplikasi Google", "#115e59", "#0d9488"), status: "aktif" },
        { id_kelas: "KLS-JUAL", judul: "Jualan Produk Digital", deskripsi: "Siapkan penawaran, kode voucher, dan cara menyerahkan akses ke pembeli.", harga: 99000, link_lynk: "https://lynk.id/", gambar_url: coverArt("Jualan digital", "#155e75", "#0f766e"), status: "aktif" }
      ],
      modul: [
        { id_modul: "MOD-1", id_kelas: "KLS-NOL", judul: "Mulai dari pekerjaan, bukan dari tampilan", tipe: "pdf", url_atau_file_id: "teks:Web sederhana bisa hidup di akun Google Anda. Anda tidak perlu membeli hosting.\n\nTentukan satu pekerjaan yang berulang, misalnya mencatat pesanan. Tuliskan data apa yang ingin disimpan: nama, pesanan, dan tanggal.\n\nSetelah datanya jelas, barulah buat tampilan yang memudahkan orang mengisinya dari ponsel.", urutan: 1 },
        { id_modul: "MOD-2", id_kelas: "KLS-NOL", judul: "Contoh pemutar video", tipe: "youtube", url_atau_file_id: "https://www.youtube.com/watch?v=jNQXAC9IVRw", urutan: 2 },
        { id_modul: "MOD-3", id_kelas: "KLS-NOL", judul: "Alur pembeli", tipe: "gambar", url_atau_file_id: diagram(), urutan: 3 },
        { id_modul: "MOD-4", id_kelas: "KLS-NOL", judul: "Video besar lewat Google Drive", tipe: "video_drive", url_atau_file_id: "", urutan: 4 },
        { id_modul: "MOD-5", id_kelas: "KLS-NOL", judul: "Bantuan Google Drive", tipe: "tautan", url_atau_file_id: "https://support.google.com/drive", urutan: 5 },
        { id_modul: "MOD-6", id_kelas: "KLS-GAS", judul: "Satu spreadsheet, satu tugas", tipe: "pdf", url_atau_file_id: "teks:Anggap spreadsheet sebagai buku catatan yang rapi. Satu lembar untuk produk, satu lembar untuk pesanan, satu lembar untuk peserta.\n\nJangan mencampur semuanya di satu tabel. Nama kolom yang konsisten membuat laporan mudah dibaca.", urutan: 1 },
        { id_modul: "MOD-7", id_kelas: "KLS-GAS", judul: "Dokumentasi Google Sheets", tipe: "tautan", url_atau_file_id: "https://support.google.com/docs", urutan: 2 },
        { id_modul: "MOD-8", id_kelas: "KLS-JUAL", judul: "Urutan jual yang tenang", tipe: "pdf", url_atau_file_id: "teks:Tuliskan apa yang pembeli dapatkan, berapa harganya, dan kapan akses dibuka.\n\nUntuk kelas, kirim kode voucher setelah pembayaran terlihat. Untuk aplikasi, minta bukti transfer hanya jika pembeli membayar langsung, bukan lewat Lynk.id.", urutan: 1 }
      ],
      pesanan: [
        { id_pesanan: "PSN-1001", tanggal: isoDays(-2), id_pengguna: "USR-PESERTA", nama_pembeli: "Peserta Demo", jenis: "aplikasi", id_produk: "PRD-BIO", nama_produk: "Link Bio Usaha", ringkasan_kebutuhan: "Untuk bio TikTok kedai kopi.", nominal: 50000, metode: "bank", bukti_file_id: "", status: "menunggu", catatan_admin: "", diverifikasi_oleh: "", tanggal_verifikasi: "" },
        { id_pesanan: "PSN-1002", tanggal: isoDays(-6), id_pengguna: "USR-PESERTA", nama_pembeli: "Peserta Demo", jenis: "aplikasi", id_produk: "PRD-FORM", nama_produk: "Form Pesanan", ringkasan_kebutuhan: "", nominal: 75000, metode: "QRIS", bukti_file_id: "", status: "disetujui", catatan_admin: "Pembayaran sudah dicocokkan.", diverifikasi_oleh: "USR-ADMIN", tanggal_verifikasi: isoDays(-5) },
        { id_pesanan: "PSN-1003", tanggal: isoDays(-1), id_pengguna: "USR-PESERTA", nama_pembeli: "Peserta Demo", jenis: "custom", id_produk: "PRD-ABSEN", nama_produk: "Absensi Kegiatan", ringkasan_kebutuhan: "Absensi untuk 3 kelas mingguan, plus rekap bulanan yang bisa diunduh.", nominal: 250000, metode: "", bukti_file_id: "", status: "menunggu", catatan_admin: "", diverifikasi_oleh: "", tanggal_verifikasi: "" },
        { id_pesanan: "PSN-1004", tanggal: isoDays(-3), id_pengguna: "USR-PESERTA", nama_pembeli: "Peserta Demo", jenis: "aplikasi", id_produk: "PRD-KATALOG", nama_produk: "Katalog UMKM", ringkasan_kebutuhan: "", nominal: 150000, metode: "e-wallet", bukti_file_id: "", status: "disetujui", catatan_admin: "Sudah masuk.", diverifikasi_oleh: "USR-ADMIN", tanggal_verifikasi: isoDays(-3) },
        { id_pesanan: "PSN-1005", tanggal: isoDays(0), id_pengguna: "USR-PESERTA", nama_pembeli: "Peserta Demo", jenis: "aplikasi", id_produk: "PRD-TAMU", nama_produk: "Buku Tamu", ringkasan_kebutuhan: "Untuk acara akhir pekan.", nominal: 50000, metode: "Lynk.id", bukti_file_id: "", status: "disetujui", catatan_admin: "Lunas di Lynk.id.", diverifikasi_oleh: "USR-TIM", tanggal_verifikasi: isoDays(0) }
      ],
      peserta: [
        { id_peserta: "PST-1", id_pengguna: "USR-PESERTA", id_kelas: "KLS-NOL", sumber_akses: "voucher", tanggal_akses: isoDays(-8) }
      ],
      voucher: [
        { kode: "COBA-NOL", id_kelas: "KLS-NOL", status: "tersedia", masa_berlaku: dateOnly(120), dipakai_oleh: "", tanggal_pakai: "" },
        { kode: "COBA-GAS", id_kelas: "KLS-GAS", status: "tersedia", masa_berlaku: dateOnly(120), dipakai_oleh: "", tanggal_pakai: "" },
        { kode: "COBA-JUAL", id_kelas: "KLS-JUAL", status: "tersedia", masa_berlaku: dateOnly(120), dipakai_oleh: "", tanggal_pakai: "" },
        { kode: "COBA-HABIS", id_kelas: "KLS-NOL", status: "terpakai", masa_berlaku: dateOnly(30), dipakai_oleh: "USR-PESERTA", tanggal_pakai: isoDays(-8) },
        { kode: "COBA-LAMA", id_kelas: "KLS-GAS", status: "tersedia", masa_berlaku: dateOnly(-1), dipakai_oleh: "", tanggal_pakai: "" },
        { kode: "COBA-MATI", id_kelas: "KLS-JUAL", status: "nonaktif", masa_berlaku: dateOnly(30), dipakai_oleh: "", tanggal_pakai: "" }
      ],
      log: [
        { waktu: isoDays(-8), id_pengguna: "USR-PESERTA", aksi: "tukar_voucher", detail: "COBA-HABIS untuk KLS-NOL" },
        { waktu: isoDays(-5), id_pengguna: "USR-ADMIN", aksi: "setujui_pesanan", detail: "PSN-1002" }
      ],
      sesi: [],
      reset: []
    };
  }

  function persist() {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db));
    } catch (err) {
      fail("Penyimpanan peramban penuh. Hapus bukti lama atau kembalikan data contoh.");
    }
  }

  function ensureShape(data) {
    if (!data || !data.meta || data.meta.versi !== VERSION) return false;
    const lists = ["pengguna", "produk", "kelas", "modul", "pesanan", "peserta", "voucher", "log", "sesi", "reset"];
    if (!lists.every((key) => Array.isArray(data[key]))) return false;
    if (!data.pengaturan || typeof data.pengaturan !== "object") return false;
    return true;
  }

  function load() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return createSeed();
      const parsed = JSON.parse(raw);
      if (!ensureShape(parsed)) return createSeed();
      return parsed;
    } catch (err) {
      return createSeed();
    }
  }

  function pruneSessions() {
    const now = Date.now();
    db.sesi = db.sesi.filter((item) => item.exp > now);
    db.reset = db.reset.filter((item) => item.exp > now);
  }

  function init() {
    if (REMOTE) {
      db = dbKosong();
      cacheAwal = tampilCache();
      return;
    }
    db = load();
    pruneSessions();
    persist();
  }

  function reload() {
    db = load();
    pruneSessions();
  }

  function userById(id) {
    return db.pengguna.find((item) => item.id_pengguna === id) || null;
  }

  function currentUser() {
    pruneSessions();
    const current = localStorage.getItem(TOKEN_KEY);
    if (!current) return null;
    const session = db.sesi.find((item) => item.token === current);
    if (!session) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    const person = userById(session.id_pengguna);
    if (!person || person.status !== "aktif") return null;
    return person;
  }

  function requireUser() {
    const person = currentUser();
    if (!person) fail("Masuk dulu untuk melanjutkan.");
    return person;
  }

  function isStaff(person) {
    return !!person && (person.peran === "tim_admin" || person.peran === "admin_utama");
  }

  function isMain(person) {
    return !!person && person.peran === "admin_utama";
  }

  function requireStaff() {
    const person = requireUser();
    if (!isStaff(person)) fail("Panel ini hanya untuk tim admin.");
    return person;
  }

  function requireMain() {
    const person = requireUser();
    if (!isMain(person)) fail("Tindakan ini hanya untuk admin utama.");
    return person;
  }

  function writeLog(action, detail, person) {
    const actor = person || currentUser();
    db.log.unshift({
      waktu: new Date().toISOString(),
      id_pengguna: actor ? actor.id_pengguna : "",
      aksi: action,
      detail: clean(detail, 240)
    });
    db.log = db.log.slice(0, 300);
  }

  function publicUser(person) {
    if (!person) return null;
    return {
      id_pengguna: person.id_pengguna,
      nama: person.nama,
      email: person.email,
      whatsapp: person.whatsapp,
      peran: person.peran,
      peran_label: ROLES[person.peran] || person.peran,
      status: person.status
    };
  }

  function openSession(person) {
    const value = token();
    db.sesi.push({ token: value, id_pengguna: person.id_pengguna, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
    localStorage.setItem(TOKEN_KEY, value);
    persist();
  }

  function register(input) {
    const nama = clean(input.nama, 80);
    const email = clean(input.email, 120).toLowerCase();
    const whatsapp = String(input.whatsapp || "").replace(/[^\d]/g, "").slice(0, 16);
    const password = String(input.password || "");
    if (nama.length < 2) fail("Nama masih terlalu singkat.");
    if (!validEmail(email)) fail("Email belum benar.");
    if (whatsapp.length < 10) fail("Nomor WhatsApp belum lengkap.");
    if (password.length < 8) fail("Kata sandi minimal 8 karakter.");
    if (password !== String(input.confirm || "")) fail("Ulangan kata sandi tidak sama.");
    if (db.pengguna.some((item) => item.email === email)) fail("Email ini sudah terdaftar. Silakan masuk.");
    const person = {
      id_pengguna: nid("USR"),
      nama,
      email,
      whatsapp,
      hash_kata_sandi: sha256(password),
      peran: "pengunjung",
      status: "aktif",
      tanggal_daftar: new Date().toISOString()
    };
    db.pengguna.push(person);
    writeLog("daftar", email, person);
    openSession(person);
    return publicUser(person);
  }

  function login(email, password) {
    const found = db.pengguna.find((item) => item.email === clean(email, 120).toLowerCase());
    const hash = sha256(String(password || ""));
    if (!found || found.hash_kata_sandi !== hash) fail("Email atau kata sandi salah.");
    if (found.status !== "aktif") fail("Akun dinonaktifkan. Hubungi admin.");
    writeLog("masuk", found.email, found);
    openSession(found);
    return publicUser(found);
  }

  function logout() {
    const current = localStorage.getItem(TOKEN_KEY);
    db.sesi = db.sesi.filter((item) => item.token !== current);
    localStorage.removeItem(TOKEN_KEY);
    persist();
  }

  function requestReset(email) {
    const found = db.pengguna.find((item) => item.email === clean(email, 120).toLowerCase());
    if (!found) fail("Email tidak ditemukan.");
    const code = String(Math.floor(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000)));
    db.reset = db.reset.filter((item) => item.email !== found.email);
    db.reset.push({ email: found.email, hash: sha256(code), exp: Date.now() + 15 * 60 * 1000 });
    writeLog("minta_pulihan", found.email, found);
    persist();
    return { email: found.email, demoCode: code };
  }

  function confirmReset(email, code, password) {
    const found = db.pengguna.find((item) => item.email === clean(email, 120).toLowerCase());
    if (!found) fail("Email tidak ditemukan.");
    const row = db.reset.find((item) => item.email === found.email && item.exp > Date.now());
    if (!row || row.hash !== sha256(clean(code, 12))) fail("Kode pulihan salah atau sudah kedaluwarsa.");
    if (String(password || "").length < 8) fail("Kata sandi baru minimal 8 karakter.");
    found.hash_kata_sandi = sha256(password);
    db.reset = db.reset.filter((item) => item.email !== found.email);
    db.sesi = db.sesi.filter((item) => item.id_pengguna !== found.id_pengguna);
    writeLog("pulihkan_sandi", found.email, found);
    persist();
  }

  function changePassword(oldPassword, newPassword) {
    const person = requireUser();
    if (sha256(String(oldPassword || "")) !== person.hash_kata_sandi) fail("Kata sandi lama salah.");
    if (String(newPassword || "").length < 8) fail("Kata sandi baru minimal 8 karakter.");
    person.hash_kata_sandi = sha256(newPassword);
    writeLog("ubah_sandi", person.email, person);
    persist();
  }

  function productsPublic() {
    return db.produk.filter((item) => item.status === "aktif").slice().sort((a, b) => a.urutan - b.urutan);
  }

  function classesPublic() {
    return db.kelas.filter((item) => item.status === "aktif").slice();
  }

  function productById(id) {
    return db.produk.find((item) => item.id_produk === id) || null;
  }

  function classById(id) {
    return db.kelas.find((item) => item.id_kelas === id) || null;
  }

  function modulesOf(classId) {
    return db.modul.filter((item) => item.id_kelas === classId).slice().sort((a, b) => a.urutan - b.urutan);
  }

  function samplePayment() {
    const blob = (db.pengaturan.rekening_bank || "") + "\n" + (db.pengaturan.e_wallet || "");
    return blob.includes("1234567890") || blob.includes("CONTOH");
  }

  function needsProof(method) {
    return method === "bank" || method === "e-wallet" || method === "QRIS";
  }

  function createOrder(input) {
    const person = requireUser();
    const product = productById(input.id_produk);
    if (!product || product.status !== "aktif") fail("Produk tidak tersedia.");
    const method = clean(input.metode, 20);
    if (!["bank", "e-wallet", "QRIS", "Lynk.id"].includes(method)) fail("Pilih cara pembayaran.");
    if (needsProof(method) && isStaff(person)) {
      fail("Akun tim tidak mengunggah bukti untuk pesanan sendiri. Gunakan akun pembeli untuk mencoba alur ini.");
    }
    const order = {
      id_pesanan: nid("PSN"),
      tanggal: new Date().toISOString(),
      id_pengguna: person.id_pengguna,
      nama_pembeli: person.nama,
      jenis: "aplikasi",
      id_produk: product.id_produk,
      nama_produk: product.nama,
      ringkasan_kebutuhan: clean(input.catatan, 400),
      nominal: product.harga_mulai,
      metode: method,
      bukti_file_id: "",
      status: "menunggu",
      catatan_admin: "",
      diverifikasi_oleh: "",
      tanggal_verifikasi: ""
    };
    db.pesanan.unshift(order);
    writeLog("buat_pesanan", order.id_pesanan + " " + product.nama, person);
    persist();
    return order;
  }

  function attachProof(orderId, dataUrl) {
    const person = requireUser();
    if (isStaff(person)) fail("Tim admin tidak mengunggah bukti pesanan sendiri.");
    const order = db.pesanan.find((item) => item.id_pesanan === orderId);
    if (!order || order.id_pengguna !== person.id_pengguna) fail("Pesanan tidak ditemukan.");
    if (order.status !== "menunggu") fail("Bukti hanya bisa diunggah saat pesanan masih menunggu.");
    if (!needsProof(order.metode)) fail("Cara bayar ini tidak membutuhkan bukti transfer.");
    if (!String(dataUrl || "").startsWith("data:image/")) fail("Bukti harus berupa gambar.");
    if (dataUrl.length > 1200000) fail("Gambar masih terlalu besar.");
    order.bukti_file_id = dataUrl;
    writeLog("unggah_bukti", order.id_pesanan, person);
    persist();
    return order;
  }

  function createCustom(input) {
    const person = requireUser();
    const kebutuhan = clean(input.kebutuhan, 2000);
    if (kebutuhan.length < 10) fail("Ceritakan kebutuhannya sedikit lebih jelas.");
    const product = input.id_produk ? productById(input.id_produk) : null;
    const order = {
      id_pesanan: nid("PSN"),
      tanggal: new Date().toISOString(),
      id_pengguna: person.id_pengguna,
      nama_pembeli: person.nama,
      jenis: "custom",
      id_produk: product ? product.id_produk : "",
      nama_produk: product ? product.nama : "Aplikasi custom",
      ringkasan_kebutuhan: kebutuhan,
      nominal: uang(input.budget),
      metode: "",
      bukti_file_id: "",
      status: "menunggu",
      catatan_admin: "",
      diverifikasi_oleh: "",
      tanggal_verifikasi: ""
    };
    db.pesanan.unshift(order);
    writeLog("pesan_custom", order.id_pesanan, person);
    persist();
    return order;
  }

  function myOrders() {
    const person = requireUser();
    if (isStaff(person)) fail("Riwayat pembeli tidak dipakai untuk akun tim. Buka panel pesanan.");
    return db.pesanan.filter((item) => item.id_pengguna === person.id_pengguna);
  }

  function allOrders() {
    requireStaff();
    return db.pesanan.slice();
  }

  function visibleOrder(id) {
    const person = requireUser();
    const order = db.pesanan.find((item) => item.id_pesanan === id);
    if (!order) fail("Pesanan tidak ditemukan.");
    if (!isStaff(person) && order.id_pengguna !== person.id_pengguna) fail("Anda tidak dapat membuka pesanan ini.");
    return order;
  }

  function decide(id, status, note) {
    const person = requireStaff();
    const order = db.pesanan.find((item) => item.id_pesanan === id);
    if (!order) fail("Pesanan tidak ditemukan.");
    if (order.status !== "menunggu") fail("Pesanan ini sudah diverifikasi.");
    if (status === "ditolak" && clean(note, 400).length < 5) fail("Tuliskan alasan penolakan.");
    order.status = status;
    order.catatan_admin = clean(note, 400);
    order.diverifikasi_oleh = person.id_pengguna;
    order.tanggal_verifikasi = new Date().toISOString();
    writeLog(status === "disetujui" ? "setujui_pesanan" : "tolak_pesanan", order.id_pesanan, person);
    persist();
    return order;
  }

  function guardState() {
    try {
      return JSON.parse(localStorage.getItem(GUARD_KEY) || "{}");
    } catch (err) {
      return {};
    }
  }

  function redeem(code) {
    const person = requireUser();
    if (isStaff(person)) fail("Akun tim tidak menukar voucher.");
    const guard = guardState();
    const now = Date.now();
    if (guard.until && guard.until > now) {
      const detik = Math.ceil((guard.until - now) / 1000);
      fail("Terlalu banyak percobaan. Coba lagi dalam " + detik + " detik.");
    }
    const kode = clean(code, 40).toUpperCase().replace(/\s+/g, "");
    if (!kode) fail("Masukkan kode voucher.");
    const row = db.voucher.find((item) => item.kode.toUpperCase() === kode);
    const bumpFail = () => {
      const fails = (guard.fails || 0) + 1;
      const next = fails >= 5 ? { fails: 0, until: Date.now() + 60000 } : { fails, until: 0 };
      localStorage.setItem(GUARD_KEY, JSON.stringify(next));
    };
    if (!row) {
      bumpFail();
      persist();
      fail("Kode tidak ditemukan.");
    }
    if (row.status === "terpakai") fail("Kode sudah dipakai.");
    if (row.status === "nonaktif") fail("Kode tidak aktif.");
    if (row.masa_berlaku && row.masa_berlaku < dateOnly(0)) fail("Kode sudah kedaluwarsa.");
    const kelas = classById(row.id_kelas);
    if (!kelas || kelas.status !== "aktif") fail("Kelas untuk kode ini tidak tersedia.");
    const already = db.peserta.some((item) => item.id_pengguna === person.id_pengguna && item.id_kelas === kelas.id_kelas);
    if (already) fail("Anda sudah memiliki akses ke kelas ini. Kode tidak dipakai.");
    row.status = "terpakai";
    row.dipakai_oleh = person.id_pengguna;
    row.tanggal_pakai = new Date().toISOString();
    db.peserta.push({
      id_peserta: nid("PST"),
      id_pengguna: person.id_pengguna,
      id_kelas: kelas.id_kelas,
      sumber_akses: "voucher",
      tanggal_akses: new Date().toISOString()
    });
    if (person.peran === "pengunjung") person.peran = "peserta";
    localStorage.setItem(GUARD_KEY, JSON.stringify({ fails: 0, until: 0 }));
    writeLog("tukar_voucher", row.kode + " untuk " + kelas.id_kelas, person);
    persist();
    return kelas;
  }

  function canAccess(classId) {
    const person = currentUser();
    if (!person) return false;
    if (isStaff(person)) return true;
    return db.peserta.some((item) => item.id_pengguna === person.id_pengguna && item.id_kelas === classId);
  }

  function myClasses() {
    const person = requireUser();
    if (isStaff(person)) return classesPublic();
    const ids = db.peserta.filter((item) => item.id_pengguna === person.id_pengguna).map((item) => item.id_kelas);
    return db.kelas.filter((item) => ids.includes(item.id_kelas) && item.status === "aktif");
  }

  function learnModules(classId) {
    if (!canAccess(classId)) fail("Materi hanya terbuka untuk peserta kelas ini.");
    return modulesOf(classId);
  }

  function participants(classId) {
    requireStaff();
    return db.peserta.filter((item) => !classId || item.id_kelas === classId).map((item) => {
      const person = userById(item.id_pengguna);
      const kelas = classById(item.id_kelas);
      return {
        ...item,
        nama: person ? person.nama : "Akun dihapus",
        email: person ? person.email : "",
        whatsapp: person ? person.whatsapp : "",
        judul_kelas: kelas ? kelas.judul : item.id_kelas
      };
    });
  }

  function saveProduct(input) {
    requireMain();
    const nama = clean(input.nama, 80);
    const deskripsi = clean(input.deskripsi, 600);
    if (nama.length < 2) fail("Nama produk belum diisi.");
    if (deskripsi.length < 8) fail("Deskripsi masih terlalu singkat.");
    const gambar = String(input.gambar_url || "");
    if (gambar && !gambar.startsWith("data:image/") && !gambar.startsWith("https://")) fail("Gambar produk tidak valid.");
    if (input.clear_gambar === "ya") input.gambar_url = "";
    let row = input.id_produk ? productById(input.id_produk) : null;
    if (!row) {
      row = { id_produk: nid("PRD"), urutan: db.produk.reduce((max, item) => Math.max(max, item.urutan), 0) + 1 };
      db.produk.push(row);
    }
    row.nama = nama;
    row.deskripsi = deskripsi;
    row.harga_mulai = uang(input.harga_mulai);
    row.bisa_custom = String(input.bisa_custom) === "ya";
    row.status = input.status === "arsip" ? "arsip" : "aktif";
    if (input.clear_gambar === "ya") row.gambar_url = "";
    else if (gambar) row.gambar_url = gambar;
    const demo = clean(input.tautan_demo, 240);
    const aplikasi = clean(input.tautan_aplikasi, 240);
    if (demo && !/^https:\/\//.test(demo)) fail("Tautan demo harus diawali https://");
    if (aplikasi && !/^https:\/\//.test(aplikasi)) fail("Tautan aplikasi harus diawali https://");
    row.tautan_demo = demo;
    row.tautan_aplikasi = aplikasi;
    writeLog("simpan_produk", row.nama);
    persist();
    return row;
  }

  function moveProduct(id, dir) {
    requireMain();
    const list = db.produk.slice().sort((a, b) => a.urutan - b.urutan);
    const index = list.findIndex((item) => item.id_produk === id);
    const swap = index + (dir === "naik" ? -1 : 1);
    if (index < 0 || swap < 0 || swap >= list.length) return;
    const current = list[index].urutan;
    list[index].urutan = list[swap].urutan;
    list[swap].urutan = current;
    if (list[index].urutan === list[swap].urutan) list[index].urutan += dir === "naik" ? -1 : 1;
    writeLog("urut_produk", id);
    persist();
  }

  function deleteProduct(id) {
    requireMain();
    const row = productById(id);
    if (!row) fail("Produk tidak ditemukan.");
    db.produk = db.produk.filter((item) => item.id_produk !== id);
    writeLog("hapus_produk", row.nama);
    persist();
  }

  function saveClass(input) {
    requireMain();
    const judul = clean(input.judul, 100);
    const deskripsi = clean(input.deskripsi, 600);
    if (judul.length < 2) fail("Judul kelas belum diisi.");
    const link = clean(input.link_lynk, 240);
    if (link && !/^https:\/\//.test(link)) fail("Tautan Lynk.id harus diawali https://");
    let row = input.id_kelas ? classById(input.id_kelas) : null;
    if (!row) {
      row = { id_kelas: nid("KLS"), gambar_url: "" };
      db.kelas.push(row);
    }
    row.judul = judul;
    row.deskripsi = deskripsi;
    row.harga = uang(input.harga);
    row.link_lynk = link || "https://lynk.id/";
    row.status = input.status === "arsip" ? "arsip" : "aktif";
    const gambar = String(input.gambar_url || "");
    if (gambar && !gambar.startsWith("data:image/") && !gambar.startsWith("https://")) fail("Gambar kelas tidak valid.");
    if (input.clear_gambar === "ya") row.gambar_url = "";
    else if (gambar) row.gambar_url = gambar;
    writeLog("simpan_kelas", row.judul);
    persist();
    return row;
  }

  function deleteClass(id) {
    requireMain();
    const row = classById(id);
    if (!row) fail("Kelas tidak ditemukan.");
    db.kelas = db.kelas.filter((item) => item.id_kelas !== id);
    db.modul = db.modul.filter((item) => item.id_kelas !== id);
    writeLog("hapus_kelas", row.judul);
    persist();
  }

  function saveModule(input) {
    requireStaff();
    const kelas = classById(input.id_kelas);
    if (!kelas) fail("Kelas tidak ditemukan.");
    const judul = clean(input.judul, 120);
    const tipe = clean(input.tipe, 20);
    if (judul.length < 2) fail("Judul modul belum diisi.");
    if (!["video_drive", "youtube", "pdf", "gambar", "tautan", "dokumen", "video"].includes(tipe)) fail("Tipe materi tidak dikenali.");
    let url = String(input.url_atau_file_id || "").trim();
    if (tipe === "pdf" && input.teks) url = "teks:" + String(input.teks).trim().slice(0, 5000);
    if (tipe === "gambar") {
      if (url && !url.startsWith("data:image/") && !url.startsWith("https://")) fail("Gambar materi tidak valid.");
    } else if (tipe === "dokumen" || tipe === "video" || url.startsWith("data:")) {
      if (url.startsWith("data:")) {
        if (url.length > 2200000) fail("Berkas masih terlalu besar. Tempel tautan https.");
      } else if (url && !/^https:\/\//.test(url)) fail("Tautan materi harus diawali https://");
    } else if (tipe !== "pdf" || !url.startsWith("teks:")) {
      if (url && tipe !== "video_drive" && !/^https:\/\//.test(url) && tipe !== "youtube") fail("Tautan materi harus diawali https://");
    }
    if (!url && tipe !== "video_drive") fail("Isi tautan, unggah berkas, atau tulis materi.");
    let row = input.id_modul ? db.modul.find((item) => item.id_modul === input.id_modul) : null;
    if (!row) {
      const siblings = modulesOf(kelas.id_kelas);
      row = { id_modul: nid("MOD"), id_kelas: kelas.id_kelas, urutan: siblings.reduce((max, item) => Math.max(max, item.urutan), 0) + 1 };
      db.modul.push(row);
    }
    row.judul = judul;
    row.tipe = tipe;
    row.url_atau_file_id = url;
    row.nama_berkas = clean(input.nama_berkas, 140);
    row.id_kelas = kelas.id_kelas;
    writeLog("simpan_modul", row.judul);
    persist();
    return row;
  }

  function moveModule(id, dir) {
    requireStaff();
    const row = db.modul.find((item) => item.id_modul === id);
    if (!row) return;
    const list = modulesOf(row.id_kelas);
    const index = list.findIndex((item) => item.id_modul === id);
    const swap = index + (dir === "naik" ? -1 : 1);
    if (swap < 0 || swap >= list.length) return;
    const current = list[index].urutan;
    list[index].urutan = list[swap].urutan;
    list[swap].urutan = current;
    writeLog("urut_modul", id);
    persist();
  }

  function deleteModule(id) {
    requireStaff();
    const row = db.modul.find((item) => item.id_modul === id);
    if (!row) fail("Modul tidak ditemukan.");
    db.modul = db.modul.filter((item) => item.id_modul !== id);
    writeLog("hapus_modul", row.judul);
    persist();
  }

  function generateVouchers(input) {
    requireMain();
    const kelas = classById(input.id_kelas);
    if (!kelas) fail("Pilih kelas tujuan.");
    const jumlah = Number(input.jumlah);
    if (!Number.isInteger(jumlah) || jumlah < 1 || jumlah > 30) fail("Jumlah kode antara 1 dan 30.");
    const masa = clean(input.masa_berlaku, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(masa)) fail("Isi masa berlaku.");
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const made = [];
    for (let i = 0; i < jumlah; i++) {
      let kode = "";
      do {
        const bytes = new Uint8Array(6);
        crypto.getRandomValues(bytes);
        kode = "GAS-" + Array.from(bytes).map((b) => alphabet[b % alphabet.length]).join("");
      } while (db.voucher.some((item) => item.kode === kode));
      const row = { kode, id_kelas: kelas.id_kelas, status: "tersedia", masa_berlaku: masa, dipakai_oleh: "", tanggal_pakai: "" };
      db.voucher.unshift(row);
      made.push(row);
    }
    writeLog("buat_voucher", jumlah + " kode " + kelas.id_kelas);
    persist();
    return made;
  }

  function setVoucherStatus(kode, status) {
    requireMain();
    const row = db.voucher.find((item) => item.kode === kode);
    if (!row) fail("Voucher tidak ditemukan.");
    if (row.status === "terpakai") fail("Kode yang sudah dipakai tidak diubah.");
    if (!["tersedia", "nonaktif"].includes(status)) fail("Status tidak valid.");
    row.status = status;
    writeLog("status_voucher", kode + " " + status);
    persist();
  }

  function deleteVoucher(kode) {
    requireMain();
    const row = db.voucher.find((item) => item.kode === kode);
    if (!row) fail("Voucher tidak ditemukan.");
    if (row.status === "terpakai") fail("Kode yang sudah dipakai tidak dihapus.");
    db.voucher = db.voucher.filter((item) => item.kode !== kode);
    writeLog("hapus_voucher", kode);
    persist();
  }

  function voucherCsv() {
    requireMain();
    const lines = ["kode,kelas,status,masa_berlaku,dipakai_oleh"];
    db.voucher.forEach((item) => {
      lines.push([item.kode, item.id_kelas, item.status, item.masa_berlaku, item.dipakai_oleh].join(","));
    });
    return "\uFEFF" + lines.join("\n");
  }

  function saveTeam(input) {
    requireMain();
    const nama = clean(input.nama, 80);
    const email = clean(input.email, 120).toLowerCase();
    const peran = input.peran === "admin_utama" ? "admin_utama" : "tim_admin";
    if (nama.length < 2) fail("Nama belum diisi.");
    if (!validEmail(email)) fail("Email belum benar.");
    if (db.pengguna.some((item) => item.email === email)) fail("Email ini sudah terdaftar.");
    const password = String(input.password || "");
    if (password.length < 8) fail("Kata sandi awal minimal 8 karakter.");
    const person = {
      id_pengguna: nid("USR"),
      nama,
      email,
      whatsapp: String(input.whatsapp || "").replace(/[^\d]/g, "").slice(0, 16),
      hash_kata_sandi: sha256(password),
      peran,
      status: "aktif",
      tanggal_daftar: new Date().toISOString()
    };
    db.pengguna.push(person);
    writeLog("tambah_tim", email + " " + peran);
    persist();
    return publicUser(person);
  }

  function setUserStatus(id, status) {
    const actor = requireMain();
    const person = userById(id);
    if (!person) fail("Akun tidak ditemukan.");
    if (person.id_pengguna === actor.id_pengguna) fail("Anda tidak dapat menonaktifkan akun sendiri.");
    person.status = status === "nonaktif" ? "nonaktif" : "aktif";
    if (person.status === "nonaktif") db.sesi = db.sesi.filter((item) => item.id_pengguna !== person.id_pengguna);
    writeLog("status_akun", person.email + " " + person.status);
    persist();
  }

  function deleteUser(id) {
    const actor = requireMain();
    const person = userById(id);
    if (!person) fail("Akun tidak ditemukan.");
    if (person.id_pengguna === actor.id_pengguna) fail("Anda tidak dapat menghapus akun sendiri.");
    const mains = db.pengguna.filter((item) => item.peran === "admin_utama" && item.status === "aktif");
    if (person.peran === "admin_utama" && mains.length < 2) fail("Admin utama terakhir tidak boleh dihapus.");
    db.pengguna = db.pengguna.filter((item) => item.id_pengguna !== id);
    db.sesi = db.sesi.filter((item) => item.id_pengguna !== id);
    writeLog("hapus_akun", person.email);
    persist();
  }

  function saveSettings(input) {
    requireMain();
    const nama = clean(input.nama_web, 40);
    if (nama.length < 2) fail("Nama web belum diisi.");
    const link = clean(input.link_lynk, 240);
    if (link && !/^https:\/\//.test(link)) fail("Tautan Lynk.id harus diawali https://");
    const qris = String(input.gambar_QRIS || "");
    if (qris && !qris.startsWith("data:image/")) fail("Gambar QRIS tidak valid.");
    if (input.clear_qris === "ya") db.pengaturan.gambar_QRIS = "";
    else if (qris) db.pengaturan.gambar_QRIS = qris;
    db.pengaturan.nama_web = nama;
    db.pengaturan.rekening_bank = String(input.rekening_bank || "").trim().slice(0, 400);
    db.pengaturan.e_wallet = String(input.e_wallet || "").trim().slice(0, 400);
    db.pengaturan.kontak_WhatsApp = String(input.kontak_WhatsApp || "").replace(/[^\d]/g, "").slice(0, 16);
    db.pengaturan.email_admin = clean(input.email_admin, 120).toLowerCase();
    db.pengaturan.link_lynk = link || "https://lynk.id/";
    db.pengaturan.templat_email = String(input.templat_email || "").slice(0, 2000);
    writeLog("simpan_pengaturan", nama);
    persist();
  }

  function emailText(order) {
    const person = userById(order.id_pengguna);
    const template = db.pengaturan.templat_email || "";
    return template
      .replaceAll("{{nama}}", person ? person.nama : order.nama_pembeli)
      .replaceAll("{{id}}", order.id_pesanan)
      .replaceAll("{{nominal}}", "Rp" + Number(order.nominal || 0).toLocaleString("id-ID"))
      .replaceAll("{{status}}", order.status)
      .replaceAll("{{catatan}}", order.catatan_admin || "-");
  }

  function report(mode) {
    requireStaff();
    const approvedApps = db.pesanan.filter((item) => item.status === "disetujui" && item.jenis === "aplikasi");
    const bars = [];
    if (mode === "6b") {
      for (let i = 5; i >= 0; i--) {
        const start = new Date();
        start.setDate(1);
        start.setMonth(start.getMonth() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        const amount = approvedApps
          .filter((item) => {
            const t = new Date(item.tanggal_verifikasi || item.tanggal);
            return t >= start && t < end;
          })
          .reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        bars.push({ label: start.toLocaleDateString("id-ID", { month: "short" }), amount });
      }
    } else {
      for (let i = 6; i >= 0; i--) {
        const start = new Date();
        start.setDate(start.getDate() - i);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        const amount = approvedApps
          .filter((item) => {
            const t = new Date(item.tanggal_verifikasi || item.tanggal);
            return t >= start && t < end;
          })
          .reduce((sum, item) => sum + Number(item.nominal || 0), 0);
        bars.push({ label: start.toLocaleDateString("id-ID", { weekday: "short" }), amount });
      }
    }
    return {
      pendapatan: approvedApps.reduce((sum, item) => sum + Number(item.nominal || 0), 0),
      disetujui: db.pesanan.filter((item) => item.status === "disetujui").length,
      menunggu: db.pesanan.filter((item) => item.status === "menunggu" && item.jenis === "aplikasi").length,
      custom: db.pesanan.filter((item) => item.status === "menunggu" && item.jenis === "custom").length,
      peserta: db.peserta.length,
      bars
    };
  }

  function exportBackup() {
    requireMain();
    return JSON.stringify(db, null, 2);
  }

  function importBackup(raw) {
    requireMain();
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!ensureShape(data)) fail("Berkas cadangan tidak dikenali.");
    db = data;
    pruneSessions();
    persist();
    const current = localStorage.getItem(TOKEN_KEY);
    if (!db.sesi.some((item) => item.token === current)) localStorage.removeItem(TOKEN_KEY);
  }

  function resetDemo() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(GUARD_KEY);
    db = createSeed();
    persist();
  }

  window.GASPOL = {
    ROLES,
    init,
    reload: () => {
      if (REMOTE) return kirim("baca", {});
      reload();
    },
    connect: () => REMOTE ? kirim("baca", {}) : Promise.resolve(true),
    punyaCache: () => cacheAwal,
    remote: REMOTE,
    urlSalah: URL_SALAH,
    user: () => publicUser(currentUser()),
    nameOf: (id) => {
      const person = userById(id);
      return person ? person.nama : "";
    },
    isStaff: () => isStaff(currentUser()),
    isMain: () => isMain(currentUser()),
    roleLabel: (role) => ROLES[role] || role,
    settings: () => ({ ...db.pengaturan, contoh_pembayaran: samplePayment() }),
    products: productsPublic,
    productsAll: () => {
      requireMain();
      return db.produk.slice().sort((a, b) => a.urutan - b.urutan);
    },
    classes: classesPublic,
    classesAll: () => {
      requireStaff();
      return db.kelas.slice();
    },
    productById,
    classById,
    modulesOf,
    register: (input) => REMOTE ? kirim("register", input) : register(input),
    login: (email, password) => REMOTE ? kirim("login", { email: email, password: password }) : login(email, password),
    logout: () => REMOTE ? kirim("logout", {}) : logout(),
    requestReset: (email) => REMOTE ? kirim("requestReset", { email: email }) : requestReset(email),
    confirmReset: (email, code, password) => REMOTE ? kirim("confirmReset", { email: email, kode: code, password: password }) : confirmReset(email, code, password),
    changePassword: (lama, baru) => REMOTE ? kirim("changePassword", { lama: lama, baru: baru }) : changePassword(lama, baru),
    createOrder: (input) => REMOTE ? kirim("createOrder", input) : createOrder(input),
    attachProof: (id, gambar) => REMOTE ? kirim("attachProof", { id: id, gambar: gambar }) : attachProof(id, gambar),
    createCustom: (input) => REMOTE ? kirim("createCustom", input) : createCustom(input),
    myOrders,
    allOrders,
    visibleOrder,
    approve: (id, note) => REMOTE ? kirim("approve", { id: id, catatan: note }) : decide(id, "disetujui", note),
    reject: (id, note) => REMOTE ? kirim("reject", { id: id, alasan: note }) : decide(id, "ditolak", note),
    redeem: (code) => REMOTE ? kirim("redeem", { kode: code }) : redeem(code),
    canAccess,
    myClasses,
    learnModules,
    participants,
    saveProduct: (input) => REMOTE ? kirim("saveProduct", input) : saveProduct(input),
    moveProduct: (id, dir) => REMOTE ? kirim("moveProduct", { id: id, arah: dir }) : moveProduct(id, dir),
    deleteProduct: (id) => REMOTE ? kirim("deleteProduct", { id: id }) : deleteProduct(id),
    saveClass: (input) => REMOTE ? kirim("saveClass", input) : saveClass(input),
    deleteClass: (id) => REMOTE ? kirim("deleteClass", { id: id }) : deleteClass(id),
    saveModule: (input) => REMOTE ? kirim("saveModule", input) : saveModule(input),
    moveModule: (id, dir) => REMOTE ? kirim("moveModule", { id: id, arah: dir }) : moveModule(id, dir),
    deleteModule: (id) => REMOTE ? kirim("deleteModule", { id: id }) : deleteModule(id),
    generateVouchers: (input) => REMOTE ? kirim("generateVouchers", input) : generateVouchers(input),
    setVoucherStatus: (kode, status) => REMOTE ? kirim("setVoucherStatus", { kode: kode, status: status }) : setVoucherStatus(kode, status),
    deleteVoucher: (kode) => REMOTE ? kirim("deleteVoucher", { kode: kode }) : deleteVoucher(kode),
    vouchers: () => {
      requireMain();
      return db.voucher.slice();
    },
    voucherCsv: () => REMOTE ? kirim("voucherCsv", {}) : voucherCsv(),
    saveTeam: (input) => REMOTE ? kirim("saveTeam", input) : saveTeam(input),
    setUserStatus: (id, status) => REMOTE ? kirim("setUserStatus", { id: id, status: status }) : setUserStatus(id, status),
    deleteUser: (id) => REMOTE ? kirim("deleteUser", { id: id }) : deleteUser(id),
    users: () => {
      requireMain();
      return db.pengguna.map(publicUser);
    },
    saveSettings: (input) => REMOTE ? kirim("saveSettings", input) : saveSettings(input),
    emailText,
    report,
    logs: () => {
      requireStaff();
      return db.log.slice(0, 12);
    },
    exportBackup: () => REMOTE ? kirim("exportBackup", {}) : exportBackup(),
    importBackup: (raw) => REMOTE ? kirim("importBackup", { berkas: raw }) : importBackup(raw),
    resetDemo: () => {
      if (REMOTE) throw new Error("Data di spreadsheet tidak dikembalikan dari situs. Ubah isinya langsung di Google Sheets.");
      resetDemo();
    },
    needsProof
  };

  if (typeof localStorage !== "undefined") init();
})();
