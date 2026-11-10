# Panduan & Contekan Presentasi Dosen 🎓
### Smart Split Bill: Decoupled Multi-Cloud Architecture (PRD Bagian 7)

> **Tips Presentasi Utama**: Jawablah pertanyaan dosen dengan struktur:
> **[Klaim]** $\rightarrow$ **[Alasan Teknis]** $\rightarrow$ **[Trade-off yang Diakui]**.
> Mengakui keterbatasan secara jujur dan transparan selalu mendapat nilai lebih tinggi daripada klaim yang berlebihan.

---

## 🏛️ Kategori A: Arsitektur Cloud & Desain Sistem

### Q1. Mengapa memakai dua penyedia cloud (Vercel & Render)? Mengapa tidak disatukan saja?
* **Klaim**: Beban kerja (*workload*) frontend dan backend memiliki karakteristik komputasi yang sangat bertolak belakang.
* **Alasan Teknis**:
  * Frontend bersifat statis dan paling optimal dilayani via **Global Edge CDN (Vercel)** dengan latensi minimal (LCP < 1 detik) tanpa membebani server backend.
  * Backend bersifat komputasi berat (*CPU-intensive*) karena menjalankan pemrosesan citra OpenCV dan **Tesseract OCR binary**. Hal ini membutuhkan lingkungan berbasis kontainer Linux (**Render Web Service via Docker**).
  * Pemisahan ini meminimalkan *vendor lock-in* dan mengisolasi kegagalan (*fault isolation*).
* **Trade-off yang Diakui**: Menimbulkan kompleksitas konfigurasi CORS lintas-origin dan latensi jaringan antar-cloud, yang kami mitigasi dengan kontrak REST API yang ramping dan warm-up ping.

---

### Q2. Apakah ini benar-benar "Multi-Cloud"? Bukankah ini hanya memakai dua layanan PaaS?
* **Klaim**: Secara presisi akademis, arsitektur ini adalah **Multi-Provider Decoupled Architecture**.
* **Alasan Teknis**: Dua komponen utama sistem berjalan di dua infrastruktur cloud independen milik penyedia yang berbeda (Vercel dan Render), berkomunikasi secara aman melalui protokol HTTPS publik.
* **Trade-off yang Diakui**: Kami tidak mengklaim ini sebagai *enterprise multi-cloud dengan active-active failover*, melainkan pemisahan tugas berbasis portabilitas kontainer.

---

### Q3. Apa model layanan cloud yang digunakan (IaaS/PaaS/SaaS)?
* Dari sisi **pengembang (kami)**:
  * Vercel adalah **PaaS (Static Hosting & CDN)**.
  * Render adalah **PaaS berbasis Kontainer (CaaS - Container as a Service)**.
* Dari sisi **pengguna akhir**: Aplikasi Smart Split Bill adalah **SaaS (Software as a Service)**.

---

### Q4. Bagaimana skalabilitas sistem ini jika traffic melonjak drastis?
* **Klaim**: Frontend berskala otomatis tanpa batas; backend dapat di-scale secara horizontal (*horizontal scaling*).
* **Alasan Teknis**: Backend berstatus **murni stateless**. Tidak ada sesi pengguna, cache server, maupun database persisten. Setiap instance kontainer baru di belakang Load Balancer dapat langsung memproses request tanpa sinkronisasi state.
* **Trade-off yang Diakui**: Pada tier gratis Render, batas komputasi dibatasi 1 instance dengan 512 MB RAM. Untuk skala produksi tinggi, diperlukan tier berbayar dengan auto-scaling instance.

---

### Q5. Mengapa OCR tidak dijalankan di browser (Tesseract.js) atau Serverless Function?
* **Klaim**: Kontainer Docker menjamin konsistensi akurasi dan performa di semua jenis perangkat pengguna.
* **Alasan Teknis**:
  * Tesseract.js di browser memerlukan unduhan model bahasa (~15-30 MB) dan membuat smartphone kelas *low-end* menjadi panas atau *freeze*.
  * Serverless function (seperti AWS Lambda/Vercel Functions) memiliki batasan ukuran paket bundle (*cold start latency* dan sulit memasang binary tesseract native beserta dependensi OpenCV).
  * Docker container di Render memberikan kontrol penuh atas versi sistem operasi, library OpenCV, dan binary Tesseract 5.x.

---

## 🔒 Kategori B: Privasi & Keamanan (Zero Data Retention)

### Q8. Bagaimana Anda membuktikan foto struk benar-benar dihapus dan tidak disimpan?
* **Klaim**: Kami membuktikannya di **3 lapis pembuktian**:
  1. **Arsitektural**: Sistem sama sekali tidak memiliki basis data (No SQL/No NoSQL) dan tidak memiliki cloud object storage (tanpa S3/GCS bucket).
  2. **Kode Sumber**: Berkas dibaca langsung dari byte stream memori, temporer dialokasikan ke `tmpfs (/dev/shm)` di RAM, dan pada blok `finally`, referensi memori dihancurkan (`del`) dan `gc.collect()` dipanggil secara eksplisit.
  3. **Empiris & Audit**: Pengujian otomatis membuktikan tidak ada satu pun berkas tersisa di storage lokal setelah request selesai, dan log server hanya mencatat metadata durasi/status code tanpa konten pribadi (NFR-P5).

---

### Q11. Bagaimana kaitan aplikasi ini dengan UU Perlindungan Data Pribadi (UU PDP No. 27/2022)?
* **Klaim**: Desain sistem menerapkan prinsip **Minimisasi Data (Data Minimization)** dan **Pembatasan Tujuan (Purpose Limitation)**.
* **Alasan Teknis**: UU PDP mengatur bahwa *membaca* data pribadi di server tetap tergolong **pemrosesan data**. Kami tidak mengklaim kebal regulasi, namun kami memitigasi risiko retensi hingga titik terendah: data hanya diproses selama siklus hidup request untuk ekstraksi teks, tidak pernah disimpan, tidak dimasukkan log, dan pengguna diberi transparansi kebijakan privasi di antarmuka web.

---

### Q10. Bagaimana Anda mencegah eksploitasi upload file berbahaya dan DoS?
* **Pertahanan Berlapis**:
  1. **Magic Bytes Validation**: Verifikasi biner awal file (bukan cuma ekstensi `.jpg/.png`), sehingga executable script ditolak dengan error `415`.
  2. **Decompression Bomb Shield**: `Image.MAX_IMAGE_PIXELS = 50,000,000` mencegah serangan gambar raksasa yang menghabiskan RAM server.
  3. **Batas Ukuran**: Maksimal 5 MB per request.
  4. **Rate Limiting**: `slowapi` membatasi request per IP asli dari header `X-Forwarded-For`.
  5. **Non-Root Container**: Docker berjalan di bawah pengguna `appuser` (bukan `root`).

---

## ⚖️ Kategori C: Algoritma Pembagian & Akurasi OCR

### Q16. Bagaimana menjamin pembagian tagihan adil dan selisihnya tepat Rp 0?
* **Klaim**: Kami menggunakan metode **Largest Remainder (Hare-Niemeyer)** dan komputasi bilangan bulat Rupiah (integer).
* **Alasan Teknis**:
  * Komputasi floating point sering menimbulkan galat biner (misal `0.1 + 0.2 = 0.30000000000000004`).
  * Pada kasus item dibagi 3 orang (cth: Rp 10.000 / 3 = 3.333,33), sistem membulatkan ke bawah integer (`3.333`), lalu sisa Rp 1 dialokasikan ke peserta dengan sisa pecahan terbesar. Hasilnya: `3.334 + 3.333 + 3.333 = 10.000` (selisih **Rp 0 tepat**).
  * Telah diuji dengan 100 simulasi acak dan berhasil 100%.

---

### Q13. Bagaimana cara mengatasi Cold-Start pada tier gratis Render?
* **Klaim**: Dimitigasi secara UX dan teknis melalui **Warm-Up Ping**.
* **Alasan Teknis**:
  * Saat pengguna pertama kali membuka web Vercel, frontend secara otomatis mengirim request latar belakang ke `GET /health` di Render.
  * Sembari pengguna mencari foto struk atau membuka galeri, server Render sedang proses bangun (*waking up*).
  * Pada antarmuka disediakan indikator visual status server serta fallback **Mode Entri Manual** jika pengguna tidak ingin menunggu.

---

## 🎯 Panduan Skenario Demo Langsung Saat Sidang
1. **Buka Aplikasi**: Tunjukkan badge status di Navbar (`OCR Siap` atau `Server Sedang Bangun`) dan badge `Zero Data Retention`.
2. **Unggah Foto Struk**: Masukkan contoh foto struk, tunjukkan proses kompresi di browser berjalan.
3. **Review OCR**: Tunjukkan hasil ekstraksi (nama menu, qty, harga, pajak PB1). Lakukan sedikit edit pada satu item untuk membuktikan fitur koreksi manual (FR-04).
4. **Bagi Peserta**: Tambahkan 2–3 nama teman. Centang item pribadi dan centang item yang dipesan patungan bersama.
5. **Lihat Ringkasan & Ekspor**:
   - Tunjukkan kartu rincian per orang dengan pajak proporsional.
   - Sorot baris **"Selisih Pembagian: Rp 0"**.
   - Klik **"Salin Format WhatsApp"** dan tempel di Notepad untuk memperlihatkan teks rapi.
   - Klik **"Unduh Gambar"** untuk memperlihatkan ringkasan gambar hasil HTML5 Canvas.

