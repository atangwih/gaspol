(function () {
  const GRADS = [
    "linear-gradient(145deg,#0f766e,#5eead4)",
    "linear-gradient(145deg,#115e59,#2dd4bf)",
    "linear-gradient(145deg,#134e4a,#99f6e4)",
    "linear-gradient(145deg,#0d9488,#f59e0b)",
    "linear-gradient(145deg,#155e75,#67e8f9)",
    "linear-gradient(145deg,#3f6212,#bef264)"
  ];
  const TIPE = {
    youtube: "Video YouTube",
    video_drive: "Video Drive",
    pdf: "Tulisan / PDF",
    gambar: "Gambar",
    tautan: "Tautan"
  };
  const AKSI = {
    daftar: "Daftar akun",
    masuk: "Masuk",
    minta_pulihan: "Minta kode pulihan",
    pulihkan_sandi: "Pulihkan kata sandi",
    ubah_sandi: "Ubah kata sandi",
    buat_pesanan: "Pesanan baru",
    unggah_bukti: "Unggah bukti",
    pesan_custom: "Pesanan custom",
    setujui_pesanan: "Setujui pesanan",
    tolak_pesanan: "Tolak pesanan",
    tukar_voucher: "Tukar voucher",
    simpan_produk: "Simpan produk",
    urut_produk: "Urutkan produk",
    hapus_produk: "Hapus produk",
    simpan_kelas: "Simpan kelas",
    hapus_kelas: "Hapus kelas",
    simpan_modul: "Simpan materi",
    urut_modul: "Urutkan materi",
    hapus_modul: "Hapus materi",
    buat_voucher: "Buat voucher",
    status_voucher: "Ubah voucher",
    hapus_voucher: "Hapus voucher",
    tambah_tim: "Tambah tim",
    status_akun: "Ubah status akun",
    hapus_akun: "Hapus akun",
    simpan_pengaturan: "Simpan pengaturan"
  };

  let pageTitle = "GASPOL";
  let liveQuery = "";
  let lastPath = "";
  let reportMode = "7d";
  let orderStatus = "semua";
  let orderJenis = "semua";
  let busy = false;
  let toastTimer = 0;
  let draft = { produk: "", step: 1, metode: "bank", catatan: "" };

  function svg(body) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }
  const I = {
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    moon: svg('<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    home: svg('<path d="m4 10.5 8-6.5 8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/>'),
    box: svg('<path d="m21 8-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'),
    book: svg('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z"/>'),
    user: svg('<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="4"/>')
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));
  }
  function rp(value) {
    return "Rp" + Number(value || 0).toLocaleString("id-ID");
  }
  function when(iso) {
    if (!iso) return "-";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return esc(iso);
    return date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  }
  function tit(title) {
    pageTitle = title + " — GASPOL";
  }
  function route() {
    let hash = location.hash.replace(/^#/, "");
    if (!hash.startsWith("/")) hash = "/" + hash;
    const cut = hash.indexOf("?");
    const path = cut >= 0 ? hash.slice(0, cut) : hash;
    const query = Object.fromEntries(new URLSearchParams(cut >= 0 ? hash.slice(cut + 1) : ""));
    return { path, query, parts: path.split("/").filter(Boolean) };
  }
  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }
  function toast(message, kind) {
    const el = document.getElementById("toast");
    el.hidden = false;
    el.className = "toast" + (kind === "bad" ? " bad" : "");
    el.textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 3800);
  }
  function openModal(html) {
    const root = document.getElementById("modal-root");
    root.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true">${html}</div></div>`;
    const focus = root.querySelector("textarea, input, button");
    if (focus) focus.focus();
  }
  function closeModal() {
    document.getElementById("modal-root").innerHTML = "";
  }
  function field(label, control, help) {
    return `<label class="field"><span>${label}</span>${control}${help ? `<small class="help">${help}</small>` : ""}</label>`;
  }
  function safeImg(url) {
    const value = String(url || "");
    if (/^data:image\/(jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value;
    if (/^data:image\/svg\+xml;charset=UTF-8,/.test(value)) return value;
    if (/^https:\/\//.test(value)) return value;
    return "";
  }
  function safeHttp(url) {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" ? parsed.toString() : "";
    } catch (err) {
      return "";
    }
  }
  function youtubeId(url) {
    const match = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/);
    if (match) return match[1];
    return /^[A-Za-z0-9_-]{11}$/.test(url) ? url : "";
  }
  function drivePreview(url) {
    const match = String(url).match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    return match ? "https://drive.google.com/file/d/" + match[1] + "/preview" : "";
  }
  function classUrl(id) {
    return location.href.split("#")[0].split("?")[0] + "?kelas=" + encodeURIComponent(id);
  }
  function waLink(text) {
    const number = String(GASPOL.settings().kontak_WhatsApp || "").replace(/\D/g, "");
    if (!number) return "";
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
  }
  function payWarn() {
    if (!GASPOL.settings().contoh_pembayaran) return "";
    return `<div class="note-warn">Rekening dan e-wallet di halaman ini masih contoh. Jangan transfer ke nomor tersebut. Admin utama menggantinya lewat pengaturan.</div>`;
  }
  function badge(status) {
    const cls = status === "disetujui" ? "b-ok" : status === "ditolak" ? "b-no" : "b-wait";
    const label = status === "disetujui" ? "Disetujui" : status === "ditolak" ? "Ditolak" : "Menunggu";
    return `<span class="badge ${cls}">${label}</span>`;
  }
  function metodeLabel(method) {
    if (method === "bank") return "Transfer bank";
    if (method === "e-wallet") return "E-wallet";
    if (!method) return "Menyusul";
    return method;
  }
  function loginWall(nextHash) {
    sessionStorage.setItem("gaspol_next", nextHash);
    tit("Masuk");
    return `<section class="card narrow"><h1>Masuk dulu</h1><p>Akun gratis membuat pesanan dan kelas terikat ke Anda.</p><div class="row-actions"><a class="btn btn-primary" href="#/masuk">Masuk</a><a class="btn btn-ghost" href="#/daftar">Daftar</a></div></section>`;
  }
  function missing() {
    tit("Tidak ditemukan");
    return `<section class="empty"><h1>Halaman tidak ada</h1><a class="btn btn-primary" href="#/">Ke beranda</a></section>`;
  }
  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }
  function readImage(file) {
    if (!file) return Promise.resolve("");
    if (!/^image\//.test(file.type)) return Promise.reject(new Error("Unggah gambar JPG atau PNG."));
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        const data = canvas.toDataURL("image/jpeg", 0.72);
        if (data.length > 1100000) reject(new Error("Gambar masih terlalu besar. Coba foto yang lebih kecil."));
        else resolve(data);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Gambar tidak bisa dibaca."));
      };
      img.src = url;
    });
  }
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    toast("Tersalin.");
  }

  function productCard(product, index) {
    const img = safeImg(product.gambar_url);
    return `<article class="pcard">
      <div class="thumb" style="background:${GRADS[index % GRADS.length]}">${img ? `<img alt="" src="${esc(img)}">` : I.box}</div>
      <div class="pbody">
        <h2>${esc(product.nama)}</h2>
        <p>${esc(product.deskripsi)}</p>
        <div class="price"><span>Mulai dari</span><strong>${rp(product.harga_mulai)}</strong></div>
        <div class="row-actions">
          <a class="btn btn-primary" href="#/checkout?produk=${encodeURIComponent(product.id_produk)}">Beli</a>
          ${product.bisa_custom ? `<a class="btn btn-ghost" href="#/custom?produk=${encodeURIComponent(product.id_produk)}">Request Custom</a>` : ""}
        </div>
      </div>
    </article>`;
  }
  function classCard(kelas) {
    const link = safeHttp(kelas.link_lynk) || "https://lynk.id/";
    return `<article class="ccard">
      <p class="kicker">Kelas</p>
      <h2>${esc(kelas.judul)}</h2>
      <p>${esc(kelas.deskripsi)}</p>
      <div class="price"><span>Harga</span><strong>${rp(kelas.harga)}</strong></div>
      <div class="row-actions">
        <a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener">Beli di Lynk.id</a>
        <a class="btn btn-ghost" href="#/voucher?kelas=${encodeURIComponent(kelas.id_kelas)}">Punya Kode</a>
      </div>
    </article>`;
  }
  function mailBox(order) {
    return `<section class="note"><h2>Pratinjau email</h2><p class="help">Pada situs ini surat ditampilkan di halaman. Saat dipasang di Google Apps Script, surat yang sama terkirim lewat Gmail, dan bukti PDF dilampirkan ketika pesanan disetujui.</p><pre class="mail">${esc(GASPOL.emailText(order))}</pre></section>`;
  }
  function orderBlock(order, staff) {
    const proof = safeImg(order.bukti_file_id);
    const search = [order.id_pesanan, order.nama_pembeli, order.nama_produk, order.status, order.jenis, order.ringkasan_kebutuhan].join(" ");
    return `<article class="item" data-search="${esc(search)}">
      <div class="split">
        <div><h2>${esc(order.nama_produk)}</h2><p class="help">${esc(order.id_pesanan)} · ${when(order.tanggal)}</p></div>
        ${badge(order.status)}
      </div>
      <div class="kv">
        <span>Pembeli</span><b>${esc(order.nama_pembeli)}</b>
        <span>Jenis</span><b>${order.jenis === "custom" ? "Custom" : "Aplikasi"}</b>
        <span>Nominal</span><b>${rp(order.nominal)}</b>
        <span>Cara bayar</span><b>${esc(metodeLabel(order.metode))}</b>
        ${order.ringkasan_kebutuhan ? `<span>Catatan</span><b>${esc(order.ringkasan_kebutuhan)}</b>` : ""}
        ${order.catatan_admin ? `<span>Catatan admin</span><b>${esc(order.catatan_admin)}</b>` : ""}
        ${order.diverifikasi_oleh ? `<span>Diverifikasi</span><b>${esc(GASPOL.nameOf(order.diverifikasi_oleh))} · ${when(order.tanggal_verifikasi)}</b>` : ""}
      </div>
      <div class="row-actions">
        <a class="btn btn-ghost btn-small" href="#/bukti/${encodeURIComponent(order.id_pesanan)}">Bukti pesanan</a>
        ${proof ? `<button type="button" class="btn btn-ghost btn-small" data-act="lihat-bukti" data-id="${esc(order.id_pesanan)}">Lihat bukti transfer</button>` : ""}
        ${staff && order.status === "menunggu" ? `<button type="button" class="btn btn-primary btn-small" data-act="buka-setujui" data-id="${esc(order.id_pesanan)}">${order.jenis === "custom" ? "Terima" : "Setujui"}</button><button type="button" class="btn btn-danger btn-small" data-act="buka-tolak" data-id="${esc(order.id_pesanan)}">Tolak</button>` : ""}
      </div>
      ${!staff && order.status === "menunggu" && GASPOL.needsProof(order.metode) ? `<form class="form" data-act="unggah-bukti"><input type="hidden" name="id" value="${esc(order.id_pesanan)}">${field(proof ? "Ganti bukti transfer" : "Unggah bukti transfer", '<input type="file" accept="image/*" required>', "JPG atau PNG, beberapa MB.")}<button class="btn btn-primary btn-small" type="submit">Kirim bukti</button></form>` : ""}
    </article>`;
  }

  function home() {
    tit("Web tanpa koding");
    const products = GASPOL.products();
    const classes = GASPOL.classes();
    const wa = waLink("Halo GASPOL, saya ingin tanya soal web.");
    const features = [
      ["Tanpa koding", "Anda tidak perlu menulis program untuk punya web sendiri."],
      ["Tanpa ribet", "Pilih aplikasi, atau ikut kelas yang dipandu dari nol."],
      ["Tanpa hosting", "Tidak perlu membeli hosting. Aplikasi berjalan di Google."],
      ["Gratis seumur hidup", "Tidak ada iuran hosting yang harus diperpanjang."],
      ["Mulai dari 50 ribu", "Ada aplikasi yang harganya mulai dari satu kopi."],
      ["Bisa custom", "Butuh alur sendiri? Kirim kebutuhan dan budget."]
    ];
    const faqs = [
      ["Apakah saya harus bisa koding?", "Tidak. Kami buatkan aplikasinya, atau Anda ikut kelas dan dipandu dari nol."],
      ["Apakah perlu membeli hosting?", "Tidak. Aplikasi berjalan di akun Google, jadi tidak ada hosting yang harus dibeli."],
      ["Bagaimana cara membayar?", "Kelas dibayar lewat Lynk.id. Aplikasi bisa lewat transfer bank, e-wallet, QRIS, atau Lynk.id. Bukti transfer hanya diminta untuk pembayaran langsung."],
      ["Kapan pesanan diproses?", "Setelah admin mencocokkan pembayaran. Statusnya menunggu, lalu disetujui atau ditolak beserta alasannya."],
      ["Bagaimana kelas dibuka?", "Tukar kode voucher, atau buka tautan yang berisi ID kelas. Materinya terbuka setelah akun Anda punya akses."],
      ["Bisakah meminta fitur sendiri?", "Bisa. Kirim nama kebutuhan dan budget lewat pesanan custom."]
    ];
    return `<section class="hero">
      <div>
        <p class="kicker">Mulai dari Rp50.000</p>
        <h1>Mau bikin web tapi tidak bisa koding? Kami bantu wujudkan impianmu.</h1>
        <p class="lede">Gabung kelas dan dipandu dari nol, atau serahkan aplikasinya kepada kami. Tanpa ribet beli hosting, gratis seumur hidup.</p>
        <div class="cta-row">
          <a class="btn btn-primary" href="#/aplikasi">Lihat aplikasi</a>
          <a class="btn btn-ghost" href="#/kelas">Lihat kelas</a>
          ${wa ? `<a class="btn btn-ghost" href="${esc(wa)}" target="_blank" rel="noopener">Tanya di WhatsApp</a>` : ""}
        </div>
      </div>
      <div class="phone" aria-hidden="true">
        <div class="phone-screen">
          <div class="notch"></div>
          ${products.slice(0, 3).map((item) => `<div class="mini"><span>${esc(item.nama)}</span><b>${rp(item.harga_mulai)}</b></div>`).join("")}
          <div class="mini accent"><span>Kelas dari nol</span><b>Siap dipandu</b></div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="features">${features.map(([title, text]) => `<article class="feature">${I.check}<div><strong>${title}</strong><p>${text}</p></div></article>`).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Cara kerja</h2></div>
      <div class="grid-3">
        <article class="card"><p class="kicker">01</p><h2>Pilih</h2><p>Aplikasi siap pakai, permintaan custom, atau kelas.</p></article>
        <article class="card"><p class="kicker">02</p><h2>Bayar</h2><p>Transfer, QRIS, e-wallet, atau Lynk.id. Kelas selalu lewat Lynk.id.</p></article>
        <article class="card"><p class="kicker">03</p><h2>Pakai</h2><p>Admin mencocokkan pembayaran. Kelas terbuka lewat kode voucher.</p></article>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Aplikasi unggulan</h2><a href="#/aplikasi">Semua aplikasi</a></div>
      <div class="grid-3">${products.slice(0, 3).map(productCard).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Kelas unggulan</h2><a href="#/kelas">Semua kelas</a></div>
      <div class="grid-2">${classes.slice(0, 2).map(classCard).join("")}</div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Pertanyaan</h2></div>
      <div class="faq">${faqs.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div>
    </section>`;
  }

  function catalogApps() {
    tit("Katalog aplikasi");
    const products = GASPOL.products();
    return `<header class="page-head"><p class="kicker">Katalog</p><h1>Aplikasi siap pakai</h1><p class="lede">Harga yang tampil adalah harga mulai. Hanya produk aktif yang ada di daftar ini.</p></header>
      <input id="live-q" class="search" placeholder="Cari aplikasi" value="${esc(liveQuery)}">
      <div class="grid-3">${products.map((item, index) => `<div data-search="${esc(item.nama + " " + item.deskripsi)}">${productCard(item, index)}</div>`).join("") || `<p>Belum ada aplikasi aktif.</p>`}</div>`;
  }
  function catalogClass() {
    tit("Katalog kelas");
    const list = GASPOL.classes();
    return `<header class="page-head"><p class="kicker">Kelas</p><h1>Belajar bikin web tanpa koding</h1><p class="lede">Bayar di Lynk.id, lalu tukar kode yang Anda terima. Atau buka kelas lewat tautan ID.</p></header>
      <div class="grid-2">${list.map(classCard).join("") || `<p>Belum ada kelas aktif.</p>`}</div>`;
  }
  function classDetail(id) {
    const kelas = GASPOL.classById(id);
    if (!kelas || (kelas.status !== "aktif" && !GASPOL.isStaff())) return missing();
    tit(kelas.judul);
    const mods = GASPOL.modulesOf(id);
    const open = GASPOL.canAccess(id);
    const link = safeHttp(kelas.link_lynk) || "https://lynk.id/";
    return `<header class="page-head"><p class="kicker">Kelas</p><h1>${esc(kelas.judul)}</h1><p class="lede">${esc(kelas.deskripsi)}</p><p class="price"><span>Harga</span><strong>${rp(kelas.harga)}</strong></p></header>
      <div class="row-actions">
        <a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener">Beli di Lynk.id</a>
        <a class="btn btn-ghost" href="#/voucher?kelas=${encodeURIComponent(id)}">Punya Kode</a>
        ${open ? `<a class="btn btn-primary" href="#/belajar/${encodeURIComponent(id)}">Buka materi</a>` : ""}
        <button type="button" class="btn btn-ghost" data-act="salin-kelas" data-id="${esc(id)}">Salin tautan kelas</button>
      </div>
      <section class="section"><h2>Materi</h2>
        ${open ? `<p class="help">Anda punya akses. Materi bisa dibuka dan diunduh.</p>` : `<div class="note">Materi terkunci. Masuk, lalu tukar voucher atau tunggu akses diberikan. Judul di bawah bisa dilihat, isinya belum.</div>`}
        <ol class="locked">${mods.map((mod) => `<li><strong>${esc(mod.judul)}</strong><br><span class="help">${TIPE[mod.tipe] || ""}</span></li>`).join("") || `<li>Materi belum dipasang.</li>`}</ol>
      </section>`;
  }

  function voucherPage(query) {
    tit("Tukar voucher");
    const user = GASPOL.user();
    const kelas = query.kelas ? GASPOL.classById(query.kelas) : null;
    if (!user) return loginWall("#/voucher" + (query.kelas ? "?kelas=" + encodeURIComponent(query.kelas) : ""));
    if (GASPOL.isStaff()) return `<section class="card narrow"><h1>Voucher dikelola admin</h1><p>Akun tim tidak menukar kode. Buat kode dari panel voucher.</p><a class="btn btn-primary" href="#/admin/voucher">Buka voucher</a></section>`;
    return `<section class="card narrow"><header class="page-head"><p class="kicker">Kelas</p><h1>Tukar kode</h1><p class="lede">${kelas ? "Kode untuk " + esc(kelas.judul) + " akan membuka kelas itu." : "Masukkan kode dari Lynk.id. Kode yang valid langsung membuka kelas."}</p></header>
      <form class="form" data-act="tukar">${field("Kode voucher", '<input class="kode" name="kode" required maxlength="40" autocomplete="off" placeholder="COBA-GAS">')}<button class="btn btn-primary btn-block" type="submit">Tukar</button></form>
      <div class="demo-box"><strong>Kode percobaan</strong><p>COBA-GAS dan COBA-JUAL masih bisa dipakai. COBA-NOL hanya untuk akun yang belum punya kelas dari nol. COBA-HABIS sudah terpakai, COBA-LAMA kedaluwarsa, COBA-MATI nonaktif.</p><p class="help">Lima kode yang tidak dikenal mengunci penukaran selama 60 detik.</p></div></section>`;
  }

  function customPage(query) {
    tit("Pesanan custom");
    const user = GASPOL.user();
    if (!user) return loginWall("#/custom" + (query.produk ? "?produk=" + encodeURIComponent(query.produk) : ""));
    const product = query.produk ? GASPOL.productById(query.produk) : null;
    return `<section class="card narrow"><header class="page-head"><p class="kicker">Custom</p><h1>Ceritakan aplikasi yang Anda butuhkan</h1><p class="lede">Permintaan masuk ke antrian admin. Tidak perlu unggah bukti pada langkah ini.</p></header>
      <form class="form" data-act="custom">
        <input type="hidden" name="id_produk" value="${esc(product ? product.id_produk : "")}">
        ${product ? `<p class="note">Produk acuan: ${esc(product.nama)}</p>` : ""}
        ${field("Kebutuhan", `<textarea name="kebutuhan" required minlength="10" maxlength="2000" placeholder="Contoh: absensi 3 kelas, rekap bulanan, dan tombol unduh."></textarea>`)}
        ${field("Perkiraan budget (Rp)", '<input name="budget" inputmode="numeric" required placeholder="250000">', "Tulis angka saja, misalnya 250000.")}
        <button class="btn btn-primary" type="submit">Kirim permintaan</button>
      </form></section>`;
  }

  function checkoutPage(query) {
    tit("Checkout");
    const user = GASPOL.user();
    const id = query.produk || "";
    if (!user) return loginWall("#/checkout?produk=" + encodeURIComponent(id));
    const product = GASPOL.productById(id);
    if (!product || product.status !== "aktif") return missing();
    if (draft.produk !== id) draft = { produk: id, step: 1, metode: "bank", catatan: "" };
    const settings = GASPOL.settings();
    const step = draft.step;
    const lynk = draft.metode === "Lynk.id";
    const steps = `<ol class="steps"><li class="${step > 1 ? "done" : "on"}">Rincian</li><li class="${step === 2 ? "on" : step > 2 ? "done" : ""}">Pembayaran</li><li class="${step === 3 ? "on" : ""}">${lynk ? "Lewati" : "Bukti"}</li></ol>`;
    let body = "";
    if (step === 1) {
      body = `<form class="form" data-act="checkout-1">
        <div class="kv"><span>Aplikasi</span><b>${esc(product.nama)}</b><span>Total</span><b>${rp(product.harga_mulai)}</b></div>
        <p>${esc(product.deskripsi)}</p>
        ${field("Catatan untuk pembuat", `<textarea name="catatan" maxlength="400" placeholder="Opsional. Contoh: untuk bio TikTok kedai kopi.">${esc(draft.catatan)}</textarea>`)}
        <div class="row-actions checkout-actions"><button class="btn btn-primary" type="submit">Lanjut ke pembayaran</button></div>
      </form>`;
    } else if (step === 2) {
      const choices = [
        ["bank", "Transfer bank", "Cocokkan ke rekening di bawah."],
        ["e-wallet", "E-wallet", "Kirim ke akun yang tercantum."],
        ["QRIS", "QRIS", "Pindai gambar jika admin sudah memasangnya."],
        ["Lynk.id", "Lynk.id", "Langkah bukti transfer dilewati."]
      ];
      body = `<form class="form" data-act="checkout-2"><div class="pays">${choices.map(([value, label, help]) => `<label class="pay"><input type="radio" name="metode" value="${value}" ${draft.metode === value ? "checked" : ""}><span><strong>${label}</strong><small>${help}</small></span></label>`).join("")}</div>
        ${payWarn()}
        <div class="pay-detail" data-for="bank"><pre class="mail">${esc(settings.rekening_bank)}</pre><button type="button" class="btn btn-ghost" data-act="salin-bank">Salin rekening</button></div>
        <div class="pay-detail" data-for="e-wallet"><pre class="mail">${esc(settings.e_wallet)}</pre><button type="button" class="btn btn-ghost" data-act="salin-wallet">Salin e-wallet</button></div>
        <div class="pay-detail" data-for="QRIS">${safeImg(settings.gambar_QRIS) ? `<img class="qris" alt="QRIS" src="${esc(safeImg(settings.gambar_QRIS))}">` : `<div class="qris-empty">Gambar QRIS belum dipasang. Pilih cara bayar lain, atau minta admin mengunggahnya.</div>`}</div>
        <div class="pay-detail" data-for="Lynk.id"><p class="note">Anda akan membuat pesanan berstatus menunggu, lalu membuka Lynk.id. Admin mencocokkan pembayaran dari pemberitahuan Lynk.id. Langkah unggah bukti dilewati.</p></div>
        <div class="row-actions checkout-actions"><button type="button" class="btn btn-ghost" data-act="checkout-mundur">Kembali</button><button class="btn btn-primary unless-lynk" type="submit">Lanjut unggah bukti</button><button class="btn btn-primary only-lynk" type="submit">Buat pesanan</button></div>
      </form>`;
    } else {
      body = `<form class="form" data-act="checkout-3">
        <p>Unggah bukti untuk ${esc(metodeLabel(draft.metode))}. Total ${rp(product.harga_mulai)}.</p>
        ${GASPOL.isStaff() ? `<div class="note-warn">Akun tim tidak mengunggah bukti untuk pesanan sendiri. Gunakan akun pembeli untuk mencoba langkah ini.</div>` : field("Bukti transfer", '<input type="file" accept="image/*" required>', "Foto atau tangkapan layar yang jelas.")}
        <div class="row-actions checkout-actions"><button type="button" class="btn btn-ghost" data-act="checkout-mundur">Kembali</button>${GASPOL.isStaff() ? "" : `<button class="btn btn-primary" type="submit">Kirim pesanan</button>`}</div>
      </form>`;
    }
    return `<section class="card narrow"><header class="page-head"><p class="kicker">Checkout</p><h1>${esc(product.nama)}</h1></header>${steps}${body}<p class="help">Pembayaran dicek manual. Akses atau pengerjaan dimulai setelah status disetujui.</p></section>`;
  }

  function authCard(mode) {
    const titles = { masuk: "Masuk", daftar: "Daftar", pulihkan: "Pulihkan kata sandi" };
    tit(titles[mode]);
    let form = "";
    if (mode === "masuk") {
      form = `<form class="form" data-act="masuk">${field("Email", '<input name="email" type="email" required autocomplete="username">')}${field("Kata sandi", '<input name="password" type="password" required autocomplete="current-password">')}<button class="btn btn-primary" type="submit">Masuk</button></form><p><a href="#/pulihkan">Lupa kata sandi?</a> · <a href="#/daftar">Buat akun</a></p>`;
    } else if (mode === "daftar") {
      form = `<form class="form" data-act="daftar">${field("Nama", '<input name="nama" required maxlength="80" autocomplete="name">')}${field("Email", '<input name="email" type="email" required autocomplete="email">')}${field("WhatsApp", '<input name="whatsapp" required inputmode="tel" placeholder="62812...">')}${field("Kata sandi", '<input name="password" type="password" required minlength="8" autocomplete="new-password">', "Minimal 8 karakter.")}${field("Ulangi kata sandi", '<input name="confirm" type="password" required minlength="8">')}<button class="btn btn-primary" type="submit">Daftar</button></form><p>Sudah punya akun? <a href="#/masuk">Masuk</a></p>`;
    } else {
      form = `<form class="form" data-act="minta-pulih">${field("Email", '<input name="email" type="email" required>')}<button class="btn btn-primary" type="submit">Buat kode</button></form><p class="help">Karena situs ini tidak mengirim email, kode pulihan muncul di layar. Pada Google Apps Script, kode itu dikirim ke email.</p>`;
    }
    const demo = mode === "masuk" ? `<div class="demo-box"><strong>Akun percobaan</strong><p>Admin: atang@gaspol.id / GaspolAdmin1<br>Tim: tim@gaspol.id / GaspolTim1<br>Peserta: peserta@gaspol.id / Peserta123</p><button type="button" class="btn btn-ghost btn-small" data-act="reset-demo">Kembalikan data contoh</button></div>` : "";
    return `<section class="card narrow"><h1>${titles[mode]}</h1>${form}${demo}</section>`;
  }

  function accountPage() {
    const user = GASPOL.user();
    if (!user) return loginWall("#/akun");
    tit("Akun");
    const staff = GASPOL.isStaff();
    return `<section class="card narrow"><p class="kicker">${esc(user.peran_label)}</p><h1>${esc(user.nama)}</h1>
      <div class="kv"><span>Email</span><b>${esc(user.email)}</b><span>WhatsApp</span><b>${esc(user.whatsapp || "-")}</b></div>
      <div class="row-actions">
        ${staff ? `<a class="btn btn-primary" href="#/admin">Panel admin</a>` : `<a class="btn btn-primary" href="#/kelas-saya">Kelas saya</a><a class="btn btn-ghost" href="#/riwayat">Riwayat pesanan</a>`}
        <button type="button" class="btn btn-ghost" data-act="keluar">Keluar</button>
      </div>
      <form class="form" data-act="sandi"><h2>Ganti kata sandi</h2>${field("Kata sandi lama", '<input type="password" name="lama" required autocomplete="current-password">')}${field("Kata sandi baru", '<input type="password" name="baru" required minlength="8" autocomplete="new-password">')}<button class="btn btn-primary" type="submit">Simpan</button></form>
    </section>`;
  }

  function historyPage() {
    const user = GASPOL.user();
    if (!user) return loginWall("#/riwayat");
    if (GASPOL.isStaff()) return `<section class="empty"><h1>Riwayat ada di panel</h1><p>Akun tim melihat semua pesanan lewat panel admin.</p><a class="btn btn-primary" href="#/admin/pesanan">Buka pesanan</a></section>`;
    tit("Riwayat pesanan");
    const orders = GASPOL.myOrders();
    return `<header class="page-head"><p class="kicker">Akun</p><h1>Riwayat pesanan</h1></header><div class="stack">${orders.map((order) => orderBlock(order, false)).join("") || `<p>Belum ada pesanan.</p>`}</div>`;
  }

  function donePage(query) {
    tit("Pesanan tercatat");
    let order;
    try { order = GASPOL.visibleOrder(query.id || ""); }
    catch (err) { return `<section class="empty"><h1>Pesanan tidak terbuka</h1><p>${esc(err.message)}</p></section>`; }
    const lynk = safeHttp(GASPOL.settings().link_lynk);
    return `<section class="card narrow"><p class="kicker">Menunggu verifikasi</p><h1>Pesanan ${esc(order.id_pesanan)} tercatat</h1><p>Status awal: menunggu. Admin mencocokkan pembayaran secara manual. Aplikasi dikerjakan atau akses dibuka setelah disetujui.</p>${badge(order.status)}${mailBox(order)}<div class="row-actions"><a class="btn btn-primary" href="#/riwayat">Lihat riwayat</a>${order.metode === "Lynk.id" && lynk ? `<a class="btn btn-ghost" href="${esc(lynk)}" target="_blank" rel="noopener">Buka Lynk.id</a>` : ""}</div></section>`;
  }

  function receiptPage(id) {
    let order;
    try { order = GASPOL.visibleOrder(id); }
    catch (err) { return `<section class="empty"><h1>Bukti tidak terbuka</h1><p>${esc(err.message)}</p></section>`; }
    tit("Bukti " + order.id_pesanan);
    const settings = GASPOL.settings();
    return `<article class="receipt"><p class="kicker">${esc(settings.nama_web)}</p><h1>Bukti pesanan</h1>
      <div class="kv"><span>Nomor</span><b>${esc(order.id_pesanan)}</b><span>Tanggal</span><b>${when(order.tanggal)}</b><span>Pembeli</span><b>${esc(order.nama_pembeli)}</b><span>Produk</span><b>${esc(order.nama_produk)}</b><span>Jenis</span><b>${order.jenis === "custom" ? "Custom" : "Aplikasi"}</b><span>Nominal</span><b>${rp(order.nominal)}</b><span>Cara bayar</span><b>${esc(metodeLabel(order.metode))}</b><span>Status</span><b>${esc(order.status)}</b><span>Catatan</span><b>${esc(order.catatan_admin || order.ringkasan_kebutuhan || "-")}</b></div>
      <p>Dokumen ini menjadi bukti pesanan di GASPOL. Pada versi Google Apps Script, salinan PDF disimpan di Drive dan dilampirkan ke email saat pesanan disetujui.</p>
    </article><p class="no-print help">Untuk menyimpan PDF: cetak, lalu pilih Simpan sebagai PDF.</p><button type="button" class="btn btn-primary no-print" data-act="cetak">Cetak atau simpan PDF</button>`;
  }

  function myClassPage() {
    const user = GASPOL.user();
    if (!user) return loginWall("#/kelas-saya");
    tit("Kelas saya");
    const list = GASPOL.myClasses();
    return `<header class="page-head"><p class="kicker">Belajar</p><h1>${GASPOL.isStaff() ? "Semua kelas aktif" : "Kelas saya"}</h1></header><div class="stack">${list.map((kelas) => `<article class="item"><h2>${esc(kelas.judul)}</h2><p>${esc(kelas.deskripsi)}</p><a class="btn btn-primary" href="#/belajar/${encodeURIComponent(kelas.id_kelas)}">Lanjut belajar</a></article>`).join("") || `<p>Anda belum memiliki kelas. Tukar kode voucher setelah membeli di Lynk.id.</p><a class="btn btn-primary" href="#/voucher">Punya kode</a>`}</div>`;
  }

  function media(mod) {
    const url = mod.url_atau_file_id || "";
    if (mod.tipe === "youtube") {
      const id = youtubeId(url);
      if (!id) return `<div class="note">Tautan YouTube belum valid.</div>`;
      return `<div class="video-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}" title="${esc(mod.judul)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
    }
    if (mod.tipe === "video_drive") {
      const src = drivePreview(url);
      if (!src) return `<div class="note">Video Drive belum dipasang. Admin menempelkan tautan berbagi di panel kelas. Video besar diunggah langsung ke Drive, bukan lewat formulir ini.</div>`;
      return `<div class="video-frame"><iframe src="${src}" title="${esc(mod.judul)}" allowfullscreen></iframe></div>`;
    }
    if (mod.tipe === "pdf") {
      if (url.startsWith("teks:")) return `<div class="prose">${esc(url.slice(5))}</div><button type="button" class="btn btn-ghost" data-act="unduh-modul" data-id="${esc(mod.id_modul)}" data-kelas="${esc(mod.id_kelas)}">Unduh materi</button>`;
      const link = safeHttp(url);
      if (!link) return `<div class="note">Materi PDF belum tersedia.</div>`;
      return `<a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener">Buka atau unduh PDF</a>`;
    }
    if (mod.tipe === "gambar") {
      const src = safeImg(url);
      if (!src) return `<div class="note">Gambar belum tersedia.</div>`;
      return `<img alt="${esc(mod.judul)}" src="${esc(src)}"><div class="row-actions"><a class="btn btn-ghost" href="${esc(src)}" download>Unduh gambar</a></div>`;
    }
    const link = safeHttp(url);
    if (!link) return `<div class="note">Tautan belum valid.</div>`;
    return `<a class="btn btn-primary" href="${esc(link)}" target="_blank" rel="noopener">Buka tautan</a>`;
  }
  function learnPage(id, query) {
    const kelas = GASPOL.classById(id);
    if (!kelas) return missing();
    if (!GASPOL.user()) return loginWall("#/belajar/" + encodeURIComponent(id));
    if (!GASPOL.canAccess(id)) return `<section class="empty"><h1>Materi terkunci</h1><p>Akun ini belum punya akses ke ${esc(kelas.judul)}.</p><a class="btn btn-primary" href="#/kelas/${encodeURIComponent(id)}">Lihat kelas</a></section>`;
    tit(kelas.judul);
    const mods = GASPOL.learnModules(id);
    const current = mods.find((item) => item.id_modul === query.m) || mods[0];
    return `<header class="page-head"><p class="kicker">Belajar</p><h1>${esc(kelas.judul)}</h1></header>
      <div class="learn">
        <div class="mod-list">${mods.map((mod) => `<button type="button" class="${current && current.id_modul === mod.id_modul ? "on" : ""}" data-act="modul" data-id="${esc(mod.id_modul)}" data-kelas="${esc(id)}">${esc(mod.judul)}<small>${TIPE[mod.tipe] || ""}</small></button>`).join("") || `<p>Belum ada materi.</p>`}</div>
        <article class="card stage">${current ? `<h2>${esc(current.judul)}</h2>${media(current)}` : `<p>Materi belum dipasang.</p>`}</article>
      </div>`;
  }

  function shell(active, body) {
    const links = GASPOL.isMain()
      ? [["dasbor", "Dasbor", "#/admin"], ["pesanan", "Pesanan", "#/admin/pesanan"], ["custom", "Custom", "#/admin/custom"], ["produk", "Produk", "#/admin/produk"], ["kelas", "Kelas & modul", "#/admin/kelas"], ["voucher", "Voucher", "#/admin/voucher"], ["peserta", "Peserta", "#/admin/peserta"], ["tim", "Akun tim", "#/admin/tim"], ["pengaturan", "Pengaturan", "#/admin/pengaturan"]]
      : [["dasbor", "Dasbor", "#/admin"], ["pesanan", "Pesanan", "#/admin/pesanan"], ["custom", "Custom", "#/admin/custom"], ["kelas", "Kelas & modul", "#/admin/kelas"], ["peserta", "Peserta", "#/admin/peserta"]];
    return `<div class="admin"><nav class="side" aria-label="Admin">${links.map(([id, label, href]) => `<a href="${href}"${id === active ? ' aria-current="page"' : ""}>${label}</a>`).join("")}</nav><div class="content">${body}</div></div>`;
  }
  function bars(rows) {
    const max = Math.max(1, ...rows.map((row) => row.amount));
    return `<div class="bars">${rows.map((row) => `<div class="bar-row"><span>${esc(row.label)}</span><div class="track"><div class="fill" style="width:${Math.round((row.amount / max) * 100)}%"></div></div><b>${rp(row.amount)}</b></div>`).join("")}</div>`;
  }
  function adminDasbor() {
    const data = GASPOL.report(reportMode);
    const logs = GASPOL.logs();
    return `<div class="split"><h1>Dasbor</h1><div class="row-actions"><button type="button" class="chip ${reportMode === "7d" ? "on" : ""}" data-act="report" data-value="7d">7 hari</button><button type="button" class="chip ${reportMode === "6b" ? "on" : ""}" data-act="report" data-value="6b">6 bulan</button></div></div>
      <p class="help">${data.peserta} peserta kelas. Angka di grafik adalah pendapatan aplikasi yang sudah disetujui.</p>
      <div class="stats"><article class="card stat"><span>Pendapatan aplikasi</span><b>${rp(data.pendapatan)}</b></article><article class="card stat"><span>Disetujui</span><b>${data.disetujui}</b></article><article class="card stat"><span>Menunggu cek</span><b>${data.menunggu}</b></article><article class="card stat"><span>Custom menunggu</span><b>${data.custom}</b></article></div>
      <section class="chart-card"><h2>Pendapatan ${reportMode === "6b" ? "6 bulan" : "7 hari"}</h2>${bars(data.bars)}</section>
      <section class="section"><h2>Jejak terakhir</h2><div class="stack">${logs.map((row) => `<article class="item"><strong>${esc(AKSI[row.aksi] || row.aksi)}</strong><p class="help">${when(row.waktu)} · ${esc(GASPOL.nameOf(row.id_pengguna) || "Sistem")} · ${esc(row.detail)}</p></article>`).join("")}</div></section>`;
  }
  function adminOrders(customOnly) {
    let orders = GASPOL.allOrders().filter((order) => customOnly ? order.jenis === "custom" : true);
    if (!customOnly && orderStatus !== "semua") orders = orders.filter((order) => order.status === orderStatus);
    if (!customOnly && orderJenis !== "semua") orders = orders.filter((order) => order.jenis === orderJenis);
    const chips = ["semua", "menunggu", "disetujui", "ditolak"].map((status) => `<button type="button" class="chip ${orderStatus === status ? "on" : ""}" data-act="status" data-value="${status}">${status === "semua" ? "Semua status" : status}</button>`).join("");
    const jenis = ["semua", "aplikasi", "custom"].map((jenisId) => `<button type="button" class="chip ${orderJenis === jenisId ? "on" : ""}" data-act="jenis" data-value="${jenisId}">${jenisId === "semua" ? "Semua jenis" : jenisId}</button>`).join("");
    return `<h1>${customOnly ? "Pesanan custom" : "Pesanan"}</h1>
      ${customOnly ? "" : `<input id="live-q" class="search" placeholder="Cari pesanan" value="${esc(liveQuery)}"><div class="filters">${chips}</div><div class="filters">${jenis}</div>`}
      <div class="stack">${orders.map((order) => orderBlock(order, true)).join("") || `<p>Tidak ada pesanan pada saringan ini.</p>`}</div>`;
  }
  function adminProduk(query) {
    if (!GASPOL.isMain()) return `<h1>Produk</h1><div class="note">Hanya admin utama yang mengubah harga dan produk.</div>`;
    const products = GASPOL.productsAll();
    const current = query.id ? GASPOL.productById(query.id) : null;
    const form = query.baru || current ? productForm(current) : `<a class="btn btn-primary" href="#/admin/produk?baru=1">Tambah produk</a>`;
    return `<div class="split"><h1>Produk</h1></div>${form}<div class="stack">${products.map((product) => `<article class="item"><div class="split"><div><h2>${esc(product.nama)}</h2><p class="help">${rp(product.harga_mulai)} · ${product.status} · ${product.bisa_custom ? "bisa custom" : "tetap"}</p></div><span class="badge b-info">${esc(product.id_produk)}</span></div><div class="row-actions"><a class="btn btn-ghost btn-small" href="#/admin/produk?id=${encodeURIComponent(product.id_produk)}">Ubah</a><button type="button" class="btn btn-ghost btn-small" data-act="urut-produk" data-id="${esc(product.id_produk)}" data-arah="naik">Naik</button><button type="button" class="btn btn-ghost btn-small" data-act="urut-produk" data-id="${esc(product.id_produk)}" data-arah="turun">Turun</button><button type="button" class="btn btn-danger btn-small" data-act="hapus-produk" data-id="${esc(product.id_produk)}">Hapus</button></div></article>`).join("")}</div>`;
  }
  function productForm(product) {
    const p = product || { id_produk: "", nama: "", deskripsi: "", harga_mulai: 50000, bisa_custom: true, status: "aktif", gambar_url: "" };
    return `<form class="card form" data-act="simpan-produk"><h2>${product ? "Ubah produk" : "Produk baru"}</h2>
      <input type="hidden" name="id_produk" value="${esc(p.id_produk)}">
      <input type="hidden" name="gambar_url" value="${esc(p.gambar_url || "")}">
      ${field("Nama", `<input name="nama" required maxlength="80" value="${esc(p.nama)}">`)}
      ${field("Deskripsi", `<textarea name="deskripsi" required maxlength="600">${esc(p.deskripsi)}</textarea>`)}
      ${field("Harga mulai", `<input name="harga_mulai" required inputmode="numeric" value="${esc(p.harga_mulai)}">`)}
      ${field("Bisa custom", `<select name="bisa_custom"><option value="ya" ${p.bisa_custom ? "selected" : ""}>Ya</option><option value="tidak" ${p.bisa_custom ? "" : "selected"}>Tidak</option></select>`)}
      ${field("Status", `<select name="status"><option value="aktif" ${p.status !== "arsip" ? "selected" : ""}>Aktif</option><option value="arsip" ${p.status === "arsip" ? "selected" : ""}>Arsip</option></select>`)}
      ${field("Gambar", '<input type="file" accept="image/*">', "Kosongkan jika gambar tetap.")}
      ${product && p.gambar_url ? `<label class="check"><input type="checkbox" name="clear_gambar" value="ya"> Hapus gambar</label>` : ""}
      <button class="btn btn-primary" type="submit">Simpan produk</button></form>`;
  }
  function adminKelas(query) {
    const classes = GASPOL.classesAll();
    const current = query.id ? GASPOL.classById(query.id) : null;
    const main = GASPOL.isMain();
    const list = `<div class="stack">${classes.map((kelas) => `<article class="item"><h2>${esc(kelas.judul)}</h2><p class="help">${rp(kelas.harga)} · ${esc(kelas.status)} · ${GASPOL.modulesOf(kelas.id_kelas).length} materi</p><a class="btn btn-ghost btn-small" href="#/admin/kelas?id=${encodeURIComponent(kelas.id_kelas)}">Kelola</a></article>`).join("")}</div>`;
    if (!current && !query.baru) return `<div class="split"><h1>Kelas dan modul</h1>${main ? `<a class="btn btn-primary" href="#/admin/kelas?baru=1">Tambah kelas</a>` : ""}</div>${list}`;
    const form = main ? classForm(current) : `<div class="note">Tim admin mengatur materi. Harga dan data kelas diubah admin utama.</div>`;
    const modules = current ? GASPOL.modulesOf(current.id_kelas).map((mod) => `<article class="item"><div class="split"><div><h2>${esc(mod.judul)}</h2><p class="help">${TIPE[mod.tipe] || mod.tipe} · urutan ${mod.urutan}</p></div></div><div class="row-actions"><button type="button" class="btn btn-ghost btn-small" data-act="urut-modul" data-id="${esc(mod.id_modul)}" data-arah="naik">Naik</button><button type="button" class="btn btn-ghost btn-small" data-act="urut-modul" data-id="${esc(mod.id_modul)}" data-arah="turun">Turun</button><button type="button" class="btn btn-danger btn-small" data-act="hapus-modul" data-id="${esc(mod.id_modul)}">Hapus</button></div>${moduleForm(current.id_kelas, mod)}</article>`).join("") : "";
    return `<h1>${current ? esc(current.judul) : "Kelas baru"}</h1><p><a href="#/admin/kelas">Semua kelas</a></p>${form}${current ? `<section class="section"><h2>Materi</h2><div class="stack">${modules}</div>${moduleForm(current.id_kelas, null)}</section>` : ""}`;
  }
  function classForm(kelas) {
    const c = kelas || { id_kelas: "", judul: "", deskripsi: "", harga: 149000, link_lynk: "https://lynk.id/", status: "aktif" };
    return `<form class="card form" data-act="simpan-kelas"><h2>${kelas ? "Data kelas" : "Kelas baru"}</h2>
      <input type="hidden" name="id_kelas" value="${esc(c.id_kelas)}">
      ${field("Judul", `<input name="judul" required maxlength="100" value="${esc(c.judul)}">`)}
      ${field("Deskripsi", `<textarea name="deskripsi" required maxlength="600">${esc(c.deskripsi)}</textarea>`)}
      ${field("Harga", `<input name="harga" required inputmode="numeric" value="${esc(c.harga)}">`)}
      ${field("Tautan Lynk.id", `<input name="link_lynk" required value="${esc(c.link_lynk)}">`)}
      ${field("Status", `<select name="status"><option value="aktif" ${c.status !== "arsip" ? "selected" : ""}>Aktif</option><option value="arsip" ${c.status === "arsip" ? "selected" : ""}>Arsip</option></select>`)}
      <div class="row-actions"><button class="btn btn-primary" type="submit">Simpan kelas</button>${kelas ? `<button type="button" class="btn btn-danger" data-act="hapus-kelas" data-id="${esc(c.id_kelas)}">Hapus kelas</button>` : ""}</div></form>`;
  }
  function moduleForm(classId, mod) {
    const m = mod || { id_modul: "", judul: "", tipe: "pdf", url_atau_file_id: "" };
    const teks = m.url_atau_file_id.startsWith("teks:") ? m.url_atau_file_id.slice(5) : "";
    const tautan = m.url_atau_file_id.startsWith("teks:") || m.url_atau_file_id.startsWith("data:image/") ? "" : m.url_atau_file_id;
    const options = Object.keys(TIPE).map((key) => `<option value="${key}" ${m.tipe === key ? "selected" : ""}>${TIPE[key]}</option>`).join("");
    return `<form class="form" data-act="simpan-modul"><h3>${mod ? "Ubah materi" : "Tambah materi"}</h3>
      <input type="hidden" name="id_modul" value="${esc(m.id_modul)}"><input type="hidden" name="id_kelas" value="${esc(classId)}"><input type="hidden" name="gambar_lama" value="${esc(m.tipe === "gambar" ? m.url_atau_file_id : "")}">
      ${field("Judul", `<input name="judul" required maxlength="120" value="${esc(m.judul)}">`)}
      ${field("Tipe", `<select name="tipe">${options}</select>`)}
      ${field("Tautan https", `<input name="tautan" value="${esc(tautan)}" placeholder="YouTube, Drive, PDF, atau tautan">`, "Kosongkan jika materi berupa tulisan atau gambar unggahan.")}
      ${field("Tulisan materi", `<textarea name="teks" maxlength="5000">${esc(teks)}</textarea>`, "Dipakai jika tipe tulisan / PDF dan bukan tautan.")}
      ${field("Gambar unggahan", '<input type="file" accept="image/*">')}
      <button class="btn btn-primary btn-small" type="submit">Simpan materi</button></form>`;
  }
  function adminVoucher() {
    if (!GASPOL.isMain()) return `<h1>Voucher</h1><div class="note">Hanya admin utama yang membuat voucher.</div>`;
    const classes = GASPOL.classesAll();
    const rows = GASPOL.vouchers();
    const later = new Date();
    later.setDate(later.getDate() + 90);
    const masa = later.toISOString().slice(0, 10);
    return `<div class="split"><h1>Voucher</h1><button type="button" class="btn btn-ghost" data-act="ekspor-voucher">Unduh CSV</button></div>
      <form class="card form" data-act="buat-voucher"><h2>Buat kode</h2>${field("Kelas", `<select name="id_kelas">${classes.map((kelas) => `<option value="${esc(kelas.id_kelas)}">${esc(kelas.judul)}</option>`).join("")}</select>`)}${field("Jumlah", '<input name="jumlah" type="number" min="1" max="30" value="5" required>')}${field("Berlaku sampai", `<input name="masa_berlaku" type="date" required value="${masa}">`)}<button class="btn btn-primary" type="submit">Buat kode</button></form>
      <input id="live-q" class="search" placeholder="Cari kode" value="${esc(liveQuery)}">
      <div class="stack">${rows.map((row) => {
        const kelas = GASPOL.classById(row.id_kelas);
        const next = row.status === "tersedia" ? "nonaktif" : "tersedia";
        return `<article class="item" data-search="${esc(row.kode + " " + row.status + " " + (kelas ? kelas.judul : ""))}"><div class="split"><div><h2>${esc(row.kode)}</h2><p class="help">${esc(kelas ? kelas.judul : row.id_kelas)} · ${esc(row.status)} · berlaku ${esc(row.masa_berlaku || "-")}${row.dipakai_oleh ? " · " + esc(GASPOL.nameOf(row.dipakai_oleh)) : ""}</p></div></div>${row.status === "terpakai" ? "" : `<div class="row-actions"><button type="button" class="btn btn-ghost btn-small" data-act="voucher-status" data-kode="${esc(row.kode)}" data-status="${next}">Jadikan ${next}</button><button type="button" class="btn btn-danger btn-small" data-act="hapus-voucher" data-kode="${esc(row.kode)}">Hapus</button></div>`}</article>`;
      }).join("")}</div>`;
  }
  function adminPeserta(query) {
    const classes = GASPOL.classesAll();
    const rows = GASPOL.participants(query.kelas || "");
    return `<h1>Peserta</h1><div class="filters">${classes.map((kelas) => `<a class="chip ${query.kelas === kelas.id_kelas ? "on" : ""}" href="#/admin/peserta?kelas=${encodeURIComponent(kelas.id_kelas)}">${esc(kelas.judul)}</a>`).join("")}<a class="chip ${query.kelas ? "" : "on"}" href="#/admin/peserta">Semua</a></div>
      <div class="stack">${rows.map((row) => `<article class="item"><h2>${esc(row.nama)}</h2><p class="help">${esc(row.email)} · ${esc(row.whatsapp || "-")}<br>${esc(row.judul_kelas)} · ${esc(row.sumber_akses)} · ${when(row.tanggal_akses)}</p></article>`).join("") || `<p>Belum ada peserta pada saringan ini.</p>`}</div>`;
  }
  function adminTim() {
    if (!GASPOL.isMain()) return `<h1>Akun tim</h1><div class="note">Hanya admin utama yang mengelola akun tim.</div>`;
    const me = GASPOL.user();
    const users = GASPOL.users();
    return `<h1>Akun tim</h1><form class="card form" data-act="tambah-tim"><h2>Undang tim</h2>${field("Nama", '<input name="nama" required>')}${field("Email", '<input name="email" type="email" required>')}${field("WhatsApp", '<input name="whatsapp" inputmode="tel">')}${field("Kata sandi awal", '<input name="password" type="text" required minlength="8">', "Terlihat di layar agar bisa disampaikan ke tim.")}${field("Peran", '<select name="peran"><option value="tim_admin">Tim admin</option><option value="admin_utama">Admin utama</option></select>')}<button class="btn btn-primary" type="submit">Simpan akun</button></form>
      <div class="stack">${users.map((user) => `<article class="item"><div class="split"><div><h2>${esc(user.nama)}</h2><p class="help">${esc(user.email)} · ${esc(user.peran_label)} · ${esc(user.status)}</p></div></div>${user.id_pengguna === me.id_pengguna ? `<p class="help">Ini akun Anda.</p>` : `<div class="row-actions"><button type="button" class="btn btn-ghost btn-small" data-act="status-akun" data-id="${esc(user.id_pengguna)}" data-status="${user.status === "aktif" ? "nonaktif" : "aktif"}">${user.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}</button><button type="button" class="btn btn-danger btn-small" data-act="hapus-akun" data-id="${esc(user.id_pengguna)}">Hapus</button></div>`}</article>`).join("")}</div>`;
  }
  function adminAtur() {
    if (!GASPOL.isMain()) return `<h1>Pengaturan</h1><div class="note">Hanya admin utama yang mengubah rekening dan pengaturan.</div>`;
    const s = GASPOL.settings();
    return `<h1>Pengaturan</h1>${payWarn()}<form class="card form" data-act="simpan-pengaturan">
      ${field("Nama web", `<input name="nama_web" required value="${esc(s.nama_web)}">`)}
      ${field("Rekening bank", `<textarea name="rekening_bank">${esc(s.rekening_bank)}</textarea>`)}
      ${field("E-wallet", `<textarea name="e_wallet">${esc(s.e_wallet)}</textarea>`)}
      ${field("WhatsApp admin", `<input name="kontak_WhatsApp" value="${esc(s.kontak_WhatsApp)}">`, "Angka saja, diawali 62.")}
      ${field("Email admin", `<input name="email_admin" type="email" value="${esc(s.email_admin)}">`)}
      ${field("Lynk.id untuk aplikasi", `<input name="link_lynk" value="${esc(s.link_lynk)}">`)}
      ${field("Templat email", `<textarea name="templat_email">${esc(s.templat_email)}</textarea>`, "Token: {{nama}} {{id}} {{nominal}} {{status}} {{catatan}}")}
      ${field("Gambar QRIS", '<input type="file" accept="image/*">')}
      ${s.gambar_QRIS ? `<img class="qris" alt="QRIS saat ini" src="${esc(safeImg(s.gambar_QRIS))}"><label class="check"><input type="checkbox" name="clear_qris" value="ya"> Hapus QRIS</label>` : ""}
      <button class="btn btn-primary" type="submit">Simpan pengaturan</button>
    </form>
    <section class="card"><h2>Cadangan</h2><p class="help">Unduh salinan data peramban ini, atau pasang kembali berkas yang sama.</p><div class="row-actions"><button type="button" class="btn btn-ghost" data-act="cadangan">Unduh cadangan</button><button type="button" class="btn btn-ghost" data-act="reset-demo">Kembalikan data contoh</button></div>
      <form class="form" data-act="pulihkan-cadangan">${field("Pasang cadangan", '<input type="file" accept="application/json,.json" required>')}<button class="btn btn-danger" type="submit">Ganti data dengan cadangan</button></form>
    </section>`;
  }
  function adminPage(section) {
    tit("Panel admin");
    if (!GASPOL.user()) return loginWall("#/admin" + (section && section !== "dasbor" ? "/" + section : ""));
    if (!GASPOL.isStaff()) return `<section class="empty"><h1>Panel tertutup</h1><p>Akun ini bukan tim admin.</p><a class="btn btn-primary" href="#/kelas-saya">Kelas saya</a></section>`;
    const query = route().query;
    const pages = { dasbor: adminDasbor, pesanan: () => adminOrders(false), custom: () => adminOrders(true), produk: () => adminProduk(query), kelas: () => adminKelas(query), voucher: adminVoucher, peserta: () => adminPeserta(query), tim: adminTim, pengaturan: adminAtur };
    const view = pages[section] || pages.dasbor;
    return shell(pages[section] ? section : "dasbor", view());
  }

  function viewFor() {
    const { parts, query } = route();
    const [a, b] = parts;
    if (!a) return home();
    if (a === "aplikasi") return catalogApps();
    if (a === "kelas" && !b) return catalogClass();
    if (a === "kelas" && b) return classDetail(decodeURIComponent(b));
    if (a === "voucher") return voucherPage(query);
    if (a === "custom") return customPage(query);
    if (a === "checkout") return checkoutPage(query);
    if (a === "masuk") return authCard("masuk");
    if (a === "daftar") return authCard("daftar");
    if (a === "pulihkan") return authCard("pulihkan");
    if (a === "akun") return accountPage();
    if (a === "riwayat") return historyPage();
    if (a === "selesai") return donePage(query);
    if (a === "bukti" && b) return receiptPage(decodeURIComponent(b));
    if (a === "kelas-saya") return myClassPage();
    if (a === "belajar" && b) return learnPage(decodeURIComponent(b), query);
    if (a === "admin") return adminPage(b || "dasbor");
    return missing();
  }

  function updateChrome() {
    const user = GASPOL.user();
    const settings = GASPOL.settings();
    document.getElementById("brand-name").textContent = settings.nama_web || "GASPOL";
    const slot = document.getElementById("user-slot");
    slot.innerHTML = user
      ? `<a class="user-chip" href="#/akun"><span class="avatar">${esc(user.nama.slice(0, 1).toUpperCase())}</span><span>${esc(user.nama)}</span></a>`
      : `<a class="btn btn-primary btn-small" href="#/masuk">Masuk</a>`;
    const dark = document.documentElement.dataset.theme === "dark";
    const theme = document.getElementById("theme-btn");
    theme.setAttribute("aria-label", dark ? "Mode terang" : "Mode gelap");
    theme.innerHTML = dark ? I.sun : I.moon;
    const key = route().parts[0] || "beranda";
    const akun = ["akun", "riwayat", "kelas-saya", "belajar", "masuk", "daftar", "pulihkan", "selesai", "bukti", "admin"].includes(key);
    document.querySelectorAll("[data-nav]").forEach((link) => {
      const on = link.dataset.nav === "akun" ? akun : link.dataset.nav === key;
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    document.querySelectorAll("[data-icon]").forEach((holder) => {
      if (!holder.dataset.ready) {
        holder.innerHTML = I[holder.dataset.icon] || "";
        holder.dataset.ready = "1";
      }
    });
  }
  function render(opts) {
    const path = (location.hash || "#/").split("?")[0];
    if (path !== lastPath) {
      liveQuery = "";
      lastPath = path;
    }
    const y = window.scrollY;
    updateChrome();
    const view = document.getElementById("view");
    try {
      view.innerHTML = viewFor();
    } catch (err) {
      view.innerHTML = `<section class="empty"><h1>Ada kendala</h1><p>${esc(err.message || "Halaman gagal ditampilkan.")}</p></section>`;
    }
    document.title = pageTitle;
    if (opts && opts.keepScroll) window.scrollTo(0, y);
    else window.scrollTo(0, 0);
    const search = document.getElementById("live-q");
    if (search && liveQuery) applyLive(search.value);
  }
  function applyLive(value) {
    const q = value.trim().toLowerCase();
    document.querySelectorAll("[data-search]").forEach((el) => {
      el.hidden = !!q && !el.dataset.search.toLowerCase().includes(q);
    });
  }
  function afterAuth() {
    const user = GASPOL.user();
    const next = sessionStorage.getItem("gaspol_next");
    sessionStorage.removeItem("gaspol_next");
    if (next && !["#/masuk", "#/daftar", "#/pulihkan"].includes(next.split("?")[0])) {
      go(next);
      return;
    }
    const staff = user && (user.peran === "admin_utama" || user.peran === "tim_admin");
    go(staff ? "#/admin" : "#/akun");
  }

  async function run(act, data, form) {
    if (act === "tema") {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      if (next === "dark") document.documentElement.dataset.theme = "dark";
      else document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("gaspol_theme", next);
      updateChrome();
      return;
    }
    if (act === "noop") return;
    if (act === "close-modal") { closeModal(); return; }
    if (act === "keluar") { GASPOL.logout(); toast("Anda sudah keluar."); go("#/"); return; }
    if (act === "reset-demo") {
      if (!confirm("Kembalikan katalog, akun, dan pesanan ke data contoh? Perubahan di peramban ini akan hilang.")) return;
      GASPOL.resetDemo();
      toast("Data contoh dipasang kembali.");
      go("#/");
      return;
    }
    if (act === "salin-bank") return copyText(GASPOL.settings().rekening_bank);
    if (act === "salin-wallet") return copyText(GASPOL.settings().e_wallet);
    if (act === "salin-kelas") return copyText(classUrl(data.id));
    if (act === "cetak") { window.print(); return; }
    if (act === "report") { reportMode = data.value === "6b" ? "6b" : "7d"; render({ keepScroll: true }); return; }
    if (act === "status") { orderStatus = data.value || "semua"; render({ keepScroll: true }); return; }
    if (act === "jenis") { orderJenis = data.value || "semua"; render({ keepScroll: true }); return; }
    if (act === "checkout-mundur") { draft.step = Math.max(1, draft.step - 1); render({ keepScroll: true }); return; }
    if (act === "modul") {
      history.replaceState(null, "", "#/belajar/" + encodeURIComponent(data.kelas) + "?m=" + encodeURIComponent(data.id));
      render({ keepScroll: true });
      return;
    }
    if (act === "lihat-bukti") {
      const order = GASPOL.visibleOrder(data.id);
      const src = safeImg(order.bukti_file_id);
      if (!src) throw new Error("Belum ada bukti transfer.");
      openModal(`<h2>Bukti transfer</h2><img class="proof" alt="Bukti transfer" src="${esc(src)}"><button type="button" class="btn btn-ghost" data-act="close-modal">Tutup</button>`);
      return;
    }
    if (act === "buka-setujui") {
      openModal(`<form class="form" data-act="setujui"><h2>Setujui pesanan</h2><input type="hidden" name="id" value="${esc(data.id)}">${field("Catatan untuk pembeli", '<textarea name="catatan" maxlength="400" placeholder="Opsional"></textarea>')}<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-primary" type="submit">Setujui</button></div></form>`);
      return;
    }
    if (act === "buka-tolak") {
      openModal(`<form class="form" data-act="tolak"><h2>Tolak pesanan</h2><input type="hidden" name="id" value="${esc(data.id)}">${field("Alasan", '<textarea name="alasan" required minlength="5" maxlength="400" placeholder="Contoh: bukti transfer tidak terbaca."></textarea>')}<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="close-modal">Batal</button><button class="btn btn-danger" type="submit">Tolak</button></div></form>`);
      return;
    }
    if (act === "setujui") {
      const order = GASPOL.approve(data.id, data.catatan || "");
      closeModal();
      render({ keepScroll: true });
      openModal(`<h2>Pesanan disetujui</h2>${mailBox(order)}<div class="row-actions"><a class="btn btn-primary" href="#/bukti/${encodeURIComponent(order.id_pesanan)}">Buka bukti</a><button type="button" class="btn btn-ghost" data-act="close-modal">Tutup</button></div>`);
      return;
    }
    if (act === "tolak") {
      const order = GASPOL.reject(data.id, data.alasan || "");
      closeModal();
      render({ keepScroll: true });
      openModal(`<h2>Pesanan ditolak</h2>${mailBox(order)}<button type="button" class="btn btn-ghost" data-act="close-modal">Tutup</button>`);
      return;
    }
    if (act === "masuk") { GASPOL.login(data.email, data.password); toast("Selamat datang."); afterAuth(); return; }
    if (act === "daftar") { GASPOL.register(data); toast("Akun dibuat."); afterAuth(); return; }
    if (act === "minta-pulih") {
      const result = GASPOL.requestReset(data.email);
      openModal(`<h2>Kode pulihan</h2><p>Masukkan kode ini di formulir berikutnya. Di versi Google Apps Script, kode dikirim ke email.</p><p class="code-pill">${esc(result.demoCode)}</p><form class="form" data-act="konfirmasi-pulih"><input type="hidden" name="email" value="${esc(result.email)}">${field("Kode", `<input name="kode" required value="${esc(result.demoCode)}">`)}${field("Kata sandi baru", '<input name="password" type="password" required minlength="8">')}<button class="btn btn-primary" type="submit">Simpan kata sandi</button></form>`);
      return;
    }
    if (act === "konfirmasi-pulih") {
      GASPOL.confirmReset(data.email, data.kode, data.password);
      closeModal();
      toast("Kata sandi diperbarui. Silakan masuk.");
      go("#/masuk");
      return;
    }
    if (act === "sandi") { GASPOL.changePassword(data.lama, data.baru); toast("Kata sandi diperbarui."); render({ keepScroll: true }); return; }
    if (act === "checkout-1") { draft.catatan = data.catatan || ""; draft.step = 2; render(); return; }
    if (act === "checkout-2") {
      draft.metode = data.metode || draft.metode;
      if (draft.metode === "Lynk.id") {
        const order = GASPOL.createOrder({ id_produk: draft.produk, metode: "Lynk.id", catatan: draft.catatan });
        const link = safeHttp(GASPOL.settings().link_lynk);
        draft = { produk: "", step: 1, metode: "bank", catatan: "" };
        if (link) window.open(link, "_blank", "noopener");
        go("#/selesai?id=" + encodeURIComponent(order.id_pesanan));
        return;
      }
      draft.step = 3;
      render();
      return;
    }
    if (act === "checkout-3") {
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (!file) throw new Error("Unggah bukti transfer.");
      const image = await readImage(file);
      const order = GASPOL.createOrder({ id_produk: draft.produk, metode: draft.metode, catatan: draft.catatan });
      GASPOL.attachProof(order.id_pesanan, image);
      draft = { produk: "", step: 1, metode: "bank", catatan: "" };
      go("#/selesai?id=" + encodeURIComponent(order.id_pesanan));
      return;
    }
    if (act === "unggah-bukti") {
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (!file) throw new Error("Pilih gambar bukti.");
      GASPOL.attachProof(data.id, await readImage(file));
      toast("Bukti terkirim. Admin akan memeriksanya.");
      render({ keepScroll: true });
      return;
    }
    if (act === "custom") {
      const order = GASPOL.createCustom(data);
      toast("Permintaan terkirim.");
      go("#/selesai?id=" + encodeURIComponent(order.id_pesanan));
      return;
    }
    if (act === "tukar") {
      const kelas = GASPOL.redeem(data.kode);
      toast("Kode berhasil. Kelas dibuka.");
      go("#/belajar/" + encodeURIComponent(kelas.id_kelas));
      return;
    }
    if (act === "unduh-modul") {
      const mod = GASPOL.learnModules(data.kelas).find((item) => item.id_modul === data.id);
      if (!mod) throw new Error("Materi tidak ditemukan.");
      const text = String(mod.url_atau_file_id || "").replace(/^teks:/, "");
      download((mod.judul || "materi").replace(/[^\w\s-]/g, "").trim() + ".txt", text, "text/plain;charset=utf-8");
      return;
    }
    if (act === "simpan-produk") {
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (file) data.gambar_url = await readImage(file);
      const row = GASPOL.saveProduct(data);
      toast("Produk disimpan.");
      go("#/admin/produk?id=" + encodeURIComponent(row.id_produk));
      return;
    }
    if (act === "urut-produk") { GASPOL.moveProduct(data.id, data.arah); render({ keepScroll: true }); return; }
    if (act === "hapus-produk") {
      if (!confirm("Hapus produk ini dari katalog?")) return;
      GASPOL.deleteProduct(data.id);
      toast("Produk dihapus.");
      go("#/admin/produk");
      return;
    }
    if (act === "simpan-kelas") {
      const kelas = GASPOL.saveClass(data);
      toast("Kelas disimpan.");
      go("#/admin/kelas?id=" + encodeURIComponent(kelas.id_kelas));
      return;
    }
    if (act === "hapus-kelas") {
      const count = GASPOL.participants(data.id).length;
      if (!confirm("Hapus kelas ini beserta materinya? Peserta yang tercatat: " + count + ".")) return;
      GASPOL.deleteClass(data.id);
      toast("Kelas dihapus.");
      go("#/admin/kelas");
      return;
    }
    if (act === "simpan-modul") {
      const teks = (data.teks || "").trim();
      let url = (data.tautan || "").trim();
      if (data.tipe === "gambar") {
        const file = form.querySelector('input[type="file"]')?.files?.[0];
        url = file ? await readImage(file) : (data.gambar_lama || "");
      }
      if (data.tipe === "pdf" && teks) url = "";
      if ((data.tipe === "youtube" || data.tipe === "tautan" || (data.tipe === "video_drive" && url)) && url && !/^https:\/\//.test(url)) {
        throw new Error("Tautan harus diawali https://");
      }
      GASPOL.saveModule({ id_modul: data.id_modul, id_kelas: data.id_kelas, judul: data.judul, tipe: data.tipe, teks: data.tipe === "pdf" ? teks : "", url_atau_file_id: url });
      toast("Materi disimpan.");
      go("#/admin/kelas?id=" + encodeURIComponent(data.id_kelas));
      return;
    }
    if (act === "urut-modul") { GASPOL.moveModule(data.id, data.arah); render({ keepScroll: true }); return; }
    if (act === "hapus-modul") {
      if (!confirm("Hapus materi ini?")) return;
      GASPOL.deleteModule(data.id);
      toast("Materi dihapus.");
      render({ keepScroll: true });
      return;
    }
    if (act === "buat-voucher") {
      const made = GASPOL.generateVouchers(data);
      toast(made.length + " kode dibuat.");
      render({ keepScroll: true });
      return;
    }
    if (act === "voucher-status") { GASPOL.setVoucherStatus(data.kode, data.status); render({ keepScroll: true }); return; }
    if (act === "hapus-voucher") {
      if (!confirm("Hapus kode " + data.kode + "?")) return;
      GASPOL.deleteVoucher(data.kode);
      toast("Kode dihapus.");
      render({ keepScroll: true });
      return;
    }
    if (act === "ekspor-voucher") {
      download("voucher-gaspol.csv", GASPOL.voucherCsv(), "text/csv;charset=utf-8");
      toast("CSV voucher diunduh.");
      return;
    }
    if (act === "tambah-tim") { GASPOL.saveTeam(data); toast("Akun tim dibuat."); render({ keepScroll: true }); return; }
    if (act === "status-akun") { GASPOL.setUserStatus(data.id, data.status); render({ keepScroll: true }); return; }
    if (act === "hapus-akun") {
      if (!confirm("Hapus akun ini?")) return;
      GASPOL.deleteUser(data.id);
      toast("Akun dihapus.");
      render({ keepScroll: true });
      return;
    }
    if (act === "simpan-pengaturan") {
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (file) data.gambar_QRIS = await readImage(file);
      GASPOL.saveSettings(data);
      toast("Pengaturan disimpan.");
      render({ keepScroll: true });
      return;
    }
    if (act === "cadangan") { download("cadangan-gaspol.json", GASPOL.exportBackup(), "application/json"); toast("Cadangan diunduh."); return; }
    if (act === "pulihkan-cadangan") {
      const file = form.querySelector('input[type="file"]')?.files?.[0];
      if (!file) throw new Error("Pilih berkas cadangan.");
      GASPOL.importBackup(await file.text());
      toast("Cadangan dipasang.");
      go(GASPOL.user() ? "#/admin/pengaturan" : "#/masuk");
    }
  }

  async function handle(act, data, el) {
    if (busy) return;
    busy = true;
    try {
      await run(act, data, el && el.tagName === "FORM" ? el : (el ? el.closest("form") : null));
    } catch (err) {
      toast(err.message || "Terjadi kendala.", "bad");
    } finally {
      busy = false;
    }
  }
  function onClick(event) {
    if (event.target.classList && event.target.classList.contains("modal-back")) {
      closeModal();
      return;
    }
    const el = event.target.closest("[data-act]");
    if (!el || el.tagName === "FORM" || el.type === "submit") return;
    event.preventDefault();
    handle(el.dataset.act, { ...el.dataset }, el);
  }
  function onSubmit(event) {
    const form = event.target;
    if (!form.dataset || !form.dataset.act) return;
    event.preventDefault();
    handle(form.dataset.act, Object.fromEntries(new FormData(form).entries()), form);
  }
  function onInput(event) {
    if (event.target.id !== "live-q") return;
    liveQuery = event.target.value;
    applyLive(liveQuery);
  }
  function consumeClassQuery() {
    const id = new URLSearchParams(location.search).get("kelas");
    if (!id) return false;
    history.replaceState(null, "", location.pathname);
    location.hash = "#/kelas/" + encodeURIComponent(id);
    return true;
  }
  function boot() {
    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    document.addEventListener("input", onInput);
    document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });
    window.addEventListener("hashchange", () => { closeModal(); render(); });
    window.addEventListener("storage", (event) => {
      if (event.key === "gaspol_db" || event.key === "gaspol_token") {
        GASPOL.reload();
        render();
      }
    });
    const redirected = consumeClassQuery();
    if (!redirected) {
      if (!location.hash) location.hash = "#/";
      else render();
    }
  }
  boot();
})();
