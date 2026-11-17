# Prompt Gemini — Login Akun, Demo Terisolasi, dan Normalisasi Tiket

Saya ingin melanjutkan proyek **Build or Bite** di Google AI Studio. Ada konflik sinkronisasi dengan GitHub, dan preview sebelumnya tidak dapat saya gunakan. Tolong kerjakan dengan aman di workspace AI Studio yang sedang terbuka.

## 1. Lindungi pekerjaan sebelum mengubah apa pun

1. Periksa keadaan workspace AI Studio terlebih dahulu: perubahan lokal, file yang berbeda, branch/remote, dan commit GitHub `main` terbaru.
2. Bandingkan perubahan sebelum melakukan merge atau menyalin file. Workspace AI Studio adalah working copy aktif untuk tugas ini; jangan menimpanya secara menyeluruh dengan GitHub.
3. Jangan reset, force-pull, rebase, checkout yang membuang perubahan, atau mengganti seluruh file hanya agar sinkron. Pertahankan perubahan lokal yang masih berguna.
4. Jika ada konflik yang maknanya tidak jelas, berhenti dan tanyakan kepada saya. Jangan menebak.
5. Jangan push ke GitHub, deploy/promosikan ke Vercel, publish, atau mengubah layanan produksi. Laporkan perubahan dan hasil pengujian saja.

## 2. Tujuan fitur

Tambahkan alur yang aman dengan:
- **Akun sungguhan** menggunakan username dan password, bukan login palsu yang hanya membandingkan data di browser.
- **Mode Demo** untuk mencoba permainan tanpa mengubah tiket, progres, atau save akun normal.
- Aturan produksi tetap **maksimal 3 tiket per hari**, dengan reset berdasarkan **UTC** dan daily lock berlaku sampai reset UTC.
- Save lama yang masih menunjukkan saldo tiket besar harus dinormalisasi secara aman.

Semua teks UI/game yang terlihat oleh pemain harus tetap berbahasa Inggris. Judul game harus persis **Build or Bite**. Jangan mengubah visual, layout, environment, HUD, ladang, got, pagar, gerbang, atau mekanik lain di luar kebutuhan ini.

## 3. Audit dahulu sistem akun dan penyimpanan

Sebelum implementasi, telusuri cara game saat ini menyimpan tiket, profil, progres, dan autentikasi; periksa juga dependency, backend, environment variables, serta layanan yang sudah benar-benar tersedia di proyek.

- Jangan menganggap suatu layanan backend/auth sudah terhubung.
- Jangan menyimpan password dalam plaintext, localStorage, sessionStorage, source code, atau log. Jangan membuat autentikasi palsu di sisi klien.
- Jangan memasukkan secret/service-role key ke bundle browser atau repo.
- Jika proyek belum memiliki backend/provider autentikasi yang aman, jangan pura-pura menyelesaikan login sungguhan dengan mock. Berhenti, jelaskan opsi integrasi yang cocok dan apa yang perlu dikonfigurasi, lalu tanyakan persetujuan saya sebelum menghubungkan layanan atau membuat resource eksternal.
- Jangan mengaktifkan, menghubungkan, atau mengubah layanan eksternal tanpa izin saya.

Jika backend/provider aman sudah tersedia, implementasikan username/password melalui mekanisme resminya, termasuk validasi sesi, alur daftar/masuk/keluar yang sesuai arsitektur sekarang, penanganan error, dan otorisasi data per pengguna. Jangan bocorkan apakah username tertentu terdaftar melalui pesan error yang berlebihan. Jangan tampilkan password setelah input.

## 4. Aturan tiket dan migrasi save lama

- Pengguna biasa memperoleh paling banyak **3 tiket per hari UTC**; tiket tidak boleh menumpuk/roll over ke hari berikutnya.
- Setiap run produksi yang memang menggunakan tiket mengurangi satu tiket tepat satu kali. Daily lock berlaku sampai tanggal UTC berikutnya. Jangan mengubah aturan siang/malam yang tidak berkaitan dengan daily lock.
- Hitung sisa tiket hari ini dari sumber data yang otoritatif (mis. catatan pemakaian hari UTC ini), jika tersedia. Sisa tidak boleh lebih dari `max(0, 3 - tiket_yang_sudah_dipakai_hari_ini)` dan tidak boleh negatif.
- Untuk save lama yang menampilkan saldo lebih dari 3, lakukan migrasi versi yang aman dan idempoten. Normalisasikan saldo ke batas harian normal; jangan memberi lebih dari jatah normal hari ini. Jika data lama tidak cukup untuk mengetahui berapa tiket yang sudah dipakai hari ini, jangan mengarang riwayat pemakaian. Tinjau skema dan pilih perilaku konservatif yang tidak memberi tiket tambahan; jika konsekuensinya tidak jelas, berhenti dan tanyakan.
- Jangan menghapus profil/save lama secara diam-diam. Buat backup/migrasi yang dapat ditelusuri jika sesuai arsitektur, serta uji agar migrasi yang dijalankan ulang tidak mengubah hasil atau memberi tiket tambahan.
- Jangan gunakan saldo tiket lama saya sebagai alasan untuk mengubah batas normal 3 tiket/hari.

## 5. Mode Demo yang benar-benar terisolasi

Mode Demo harus bisa ditemukan dan digunakan dengan jelas dari AI Studio Preview, dan dapat digunakan pada **Vercel Preview deployment** bila proyek mendukungnya. Jangan mengandalkan pengguna mengedit URL secara manual.

- Demo hanya boleh muncul/aktif di lingkungan development atau Preview yang dapat diverifikasi dengan aman; harus selalu nonaktif di Production. Jangan memakai parameter URL saja sebagai batas keamanan.
- Demo memungkinkan saya mencoba run dan aksi gameplay yang perlu diuji, termasuk farming, build, upgrade, repair, dan salvage setelah daily tasks selesai, tanpa tiket dan tanpa daily lock menghalangi pengujian.
- Demo tidak boleh menulis atau mengubah akun/save produksi: tiket, daily task, XP, coins, streak, check-in/reward, unlock, statistik, atau progres lainnya. Gunakan profil/save demo terpisah dan mekanisme isolasi yang sesuai dengan arsitektur.
- Demo tidak boleh dapat memakai kredensial atau data akun lain. Jangan mengandalkan tombol UI saja; pastikan guard data/gameplay juga menolak penulisan ke profil normal.
- Beri indikator yang jelas bahwa pengguna sedang berada di Demo/Test, dengan teks bahasa Inggris. Jelaskan cara keluar atau menghapus data demo lokal dengan aman jika relevan.
- Jika tidak dapat menjamin pemisahan Demo dari save produksi, jangan implementasikan setengah jalan; jelaskan risikonya dan tanyakan sebelum melanjutkan.

## 6. Kriteria verifikasi

Tambahkan atau perbarui tes untuk membuktikan sekurangnya bahwa:
1. Pengguna normal tidak dapat memiliki atau memperoleh lebih dari 3 tiket pada hari UTC yang sama.
2. Tiket di-reset pada pergantian hari UTC, bukan tengah malam lokal.
3. Daily lock mencegah aktivitas produksi yang memang dibatasi sampai reset.
4. Migrasi saldo tiket lama tidak memberi tiket tambahan, tidak merusak save, dan idempoten.
5. Demo dapat menguji aksi yang diminta tanpa memakai tiket dan tanpa menulis ke akun/save normal.
6. Demo tidak bisa aktif di Production, termasuk bila seseorang mencoba mengubah URL atau state browser.
7. Pengguna yang tidak terautentikasi tidak dapat membaca atau mengubah data akun orang lain.

Jalankan tes, lint/typecheck, dan build yang sesuai dengan proyek. Jangan menyatakan preview berhasil secara visual jika belum benar-benar diuji di AI Studio Preview. Laporkan dengan jelas: file yang diubah, layanan yang diperlukan, tes yang lolos/gagal, batasan yang masih ada, serta langkah konfigurasi manual yang diperlukan. Jika implementasi akun sungguhan memerlukan keputusan/provider atau kredensial yang belum tersedia, berhenti pada audit dan minta persetujuan—jangan membuat asumsi atau mengubah produksi.
