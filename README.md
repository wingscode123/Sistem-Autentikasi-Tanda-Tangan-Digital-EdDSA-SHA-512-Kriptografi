# 🔐 Sistem Autentikasi Tanda Tangan Digital (EdDSA & SHA-512)

Proyek ini adalah implementasi sistem autentikasi modern yang menggantikan penggunaan password tradisional dengan **Tanda Tangan Digital**. Tujuannya adalah untuk mendemonstrasikan sebuah metode login yang lebih aman, efisien, dan tahan terhadap serangan siber umum seperti phishing dan pencurian database.

Proyek ini dibuat sebagai tugas akhir untuk mata kuliah Kriptografi.

---

## ✨ Fitur Utama

-   **Autentikasi Tanpa Password**: Proses login sepenuhnya mengandalkan kriptografi kunci publik, menghilangkan kebutuhan untuk menyimpan password di server.
-   **Kriptografi Modern**: Menggunakan algoritma **EdDSA (Ed25519)** untuk tanda tangan digital dan **SHA-512** untuk fungsi hash.
-   **Arsitektur Client-Server**: Dibangun dengan frontend (klien) dan backend (server) yang terpisah untuk meniru aplikasi web dunia nyata.
-   **Visualisasi Proses Login**: Menampilkan alur kerja kriptografi secara *real-time* langkah demi langkah saat proses login.
-   **Simulasi Serangan**: Termasuk simulasi interaktif untuk mendemonstrasikan ketahanan sistem terhadap **Replay Attack** dan kemustahilan serangan **Brute Force** pada *private key*.
-   **Pengujian Performa**: Fitur untuk mengukur kecepatan operasi kriptografi inti: *key generation*, *signing*, dan *verification*.

---

## ⚙️ Arsitektur & Alur Kerja

Sistem ini menggunakan model **Challenge-Response** yang aman.

#### Registrasi
1.  **Klien**: Pengguna memasukkan `username` dan menekan tombol "Generate Key Pair".
2.  **Klien**: Browser menghasilkan sepasang kunci Ed25519: `publicKey` dan `privateKey`.
3.  **Klien**: `privateKey` ditampilkan kepada pengguna untuk disimpan, sedangkan `publicKey` dikirim ke server bersama `username`.
4.  **Server**: Menerima dan menyimpan `username` dan `publicKey` di dalam "database" sementaranya.

#### Login
1.  **Klien**: Pengguna memasukkan `username` dan `privateKey` mereka.
2.  **Klien**: Mengirim permintaan ke server untuk memulai proses login.
3.  **Server**: Menerima permintaan, lalu membuat sebuah "tantangan" (*challenge*) acak dan unik, kemudian mengirimkannya kembali ke klien.
4.  **Klien**: Menerima *challenge*, melakukan *hash* (SHA-512), lalu menandatangani hasil *hash* tersebut menggunakan `privateKey`.
5.  **Klien**: Mengirimkan tanda tangan digital (*signature*) yang baru dibuat ke server.
6.  **Server**: Menerima *signature* dan memverifikasinya menggunakan `publicKey` yang sudah tersimpan. Jika valid, login berhasil.

---

## 🛠️ Teknologi yang Digunakan

-   **Frontend (Klien)**:
    -   HTML5
    -   CSS3
    -   JavaScript (ES6+)
    -   [TweetNaCl.js](https://github.com/dchest/tweetnacl-js) (untuk implementasi EdDSA)

-   **Backend (Server)**:
    -   [Node.js](https://nodejs.org/)
    -   [Express.js](https://expressjs.com/)
    -   [CORS](https://expressjs.com/en/resources/middleware/cors.html)
    -   [TweetNaCl.js](https://github.com/dchest/tweetnacl-js)

-   **Development**:
    -   [serve](https://www.npmjs.com/package/serve) (untuk menjalankan server web frontend lokal)

---

## 🚀 Cara Menjalankan Proyek

Untuk menjalankan proyek ini di komputer Anda, ikuti langkah-langkah berikut:

### 1. Prasyarat

-   Pastikan sudah menginstall **Node.js** (versi 16 atau lebih baru).

### 2. Instalasi

1.  **Clone repositori ini** atau unduh sebagai ZIP.
2.  Buka terminal, masuk ke folder **`server/`** dan install semua paket yang dibutuhkan:
    ```bash
    cd server
    npm install
    ```
3.  Install `serve` secara global untuk menjalankan server frontend (cukup sekali):
    ```bash
    npm install -g serve
    ```

### 3. Menjalankan Aplikasi

Anda perlu menjalankan **dua terminal** secara bersamaan.

**Di Terminal 1 (untuk Backend):**
1.  Masuk ke direktori `server/`.
2.  Jalankan server backend:
    ```bash
    node server.js
    ```
3.  Anda akan melihat pesan: `✅ Server autentikasi berjalan di http://localhost:3000`. Biarkan terminal ini tetap terbuka.

**Di Terminal 2 (untuk Frontend):**
1.  Masuk ke direktori **utama** proyek (folder yang berisi `client` dan `server`).
2.  Jalankan server frontend di port 5000:
    ```bash
    serve -l 5000 client
    ```
3.  Anda akan melihat pesan bahwa server berjalan, biasanya di `http://localhost:5000`.

**Buka Browser:**
-   Buka browser web dan akses alamat berikut:
    > **http://localhost:5000**

Aplikasi sekarang siap digunakan!

---

## 📁 Struktur Folder

```
.
├── client/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── nacl.min.js
│   └── nacl-util.min.js
├── server/
│   ├── server.js
│   ├── package.json
│   └── ...
└── README.md
```

---

## 👥 Kontributor

Dibuat oleh: Kelompok 8 - Kriptografi A
-   Ikzaaz Bakhtar Abdurrahman 225150701111002
-   Radithya Fawwaz Aydin 225150707111048
-   Rezy Dzikra Razani 225150707111050
