const express = require("express");
const nacl = require("tweetnacl");
nacl.util = require("tweetnacl-util");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Mengizinkan request dari domain lain (frontend)
app.use(express.json()); // Memungkinkan server membaca data JSON dari request

// ================================================================
// === DATABASE SEMENTARA (In-Memory Storage) ===
// ================================================================
const users = {}; // Format: { username: { publicKey: '...' } }
const challenges = {}; // Format: { username: 'random_challenge_string' }


// ================================================================
// === FUNGSI UTILITY DI SERVER ===
// ================================================================

// Fungsi untuk mengubah string Base64 menjadi Uint8Array untuk digunakan oleh NaCl
const fromBase64 = (base64) => {
    return nacl.util.decodeBase64(base64);
};

const toBase64 = (arrayBuffer) => {
    return nacl.util.encodeBase64(arrayBuffer);
}

// ================================================================
// === ENDPOINTS API SERVER ===
// ================================================================

// Endpoint untuk menyajikan daftar user (untuk tab "Daftar User")
app.get('/users', (req, res) => {
    res.json(users);
});

// Endpoint untuk registrasi user baru
app.post('/register', (req, res) => {
    const { username, publicKey } = req.body;

    if (!username || !publicKey) {
        return res.status(400).json({ success: false, message: 'Username dan public key dibutuhkan.' });
    }
    if (users[username]) {
        return res.status(400).json({ success: false, message: 'Username sudah terdaftar.' });
    }

    // Simpan user baru ke "database"
    users[username] = { 
        publicKey: publicKey,
        registeredAt: new Date().toISOString()
    };

    console.log('User Terdaftar:', users);
    res.status(201).json({ success: true, message: `Registrasi untuk ${username} berhasil!` });
});

// Endpoint untuk meminta challenge saat login
app.post('/login-challenge', (req, res) => {
    const { username } = req.body;
    if (!users[username]) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    }

    // Buat challenge acak yang aman secara kriptografis
    const challenge = toBase64(nacl.randomBytes(32));
    // Simpan challenge ini untuk user tersebut, akan digunakan untuk verifikasi
    challenges[username] = challenge; 

    console.log(`Challenge dibuat untuk ${username}: ${challenge}`);
    res.json({ success: true, challenge: challenge });
});

// Endpoint untuk verifikasi tanda tangan
app.post('/login-verify', (req, res) => {
    const { username, signature, hashedChallengeHex } = req.body;
    
    const user = users[username];
    const originalChallenge = challenges[username];

    if (!user || !originalChallenge) {
        return res.status(400).json({ success: false, message: 'Sesi login tidak valid atau sudah kedaluwarsa.' });
    }

    // Penting: Server harus melakukan hash-nya sendiri terhadap challenge asli yang ia simpan.
    // Jangan pernah percaya hash dari client.
    const encoder = new TextEncoder();
    const data = encoder.encode(originalChallenge);

    // Di Node.js, perlu menggunakan crypto module untuk hash
    const crypto = require('crypto');
    const serverHashedChallenge = crypto.createHash('sha512').update(data).digest();
    
    // Verifikasi tanda tangan
    const signatureBytes = fromBase64(signature);
    const publicKeyBytes = fromBase64(user.publicKey);
    
    const isVerified = nacl.sign.detached.verify(serverHashedChallenge, signatureBytes, publicKeyBytes);

    // Hapus challenge setelah digunakan untuk mencegah replay attack
    delete challenges[username]; 

    if (isVerified) {
        console.log(`Verifikasi BERHASIL untuk ${username}`);
        // Di aplikasi nyata, di sini kita akan membuat JWT (JSON Web Token)
        res.json({ success: true, message: 'Login Berhasil! Tanda tangan valid.' });
    } else {
        console.log(`Verifikasi GAGAL untuk ${username}`);
        res.json({ success: false, message: 'Login Gagal! Tanda tangan tidak valid.' });
    }
});


// Menjalankan server
app.listen(PORT, () => {
    console.log(`✅ Server autentikasi berjalan di http://localhost:${PORT}`);
});
