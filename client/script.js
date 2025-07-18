// script.js (versi Client-Server)

document.addEventListener("DOMContentLoaded", () => {
  const SERVER_URL = "http://localhost:3000"; // Alamat server kita

  // State, DOM Elements, dan Utility Functions
  let generatedKeys = null;
  let users = {}; // Ini sekarang akan diisi dari server
  let capturedLoginData = null;

  // ... (DOM Elements sama seperti sebelumnya) ...
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  const generateBtn = document.getElementById("generateBtn");
  const registerBtn = document.getElementById("registerBtn");
  const loginBtn = document.getElementById("loginBtn");
  const refreshUsersBtn = document.getElementById("refreshUsersBtn");
  const runPerfTestBtn = document.getElementById("runPerfTestBtn");
  const runReplayAttackBtn = document.getElementById("runReplayAttackBtn");
  const runBruteForceBtn = document.getElementById("runBruteForceBtn");

  const regUsernameInput = document.getElementById("regUsername");
  const keyGenResultDiv = document.getElementById("keyGenResult");
  const loginUsernameInput = document.getElementById("loginUsername");
  const privateKeyInput = document.getElementById("privateKey");
  const loginResultDiv = document.getElementById("loginResult");
  const userListDiv = document.getElementById("userList");
  const simulationResultDiv = document.getElementById("simulationResult");

  // Utility functions: sleep, arrayToHex, hexToArray, sha512, generateChallenge
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const arrayToHex = (array) =>
    Array.from(array)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  const hexToArray = (hex) => {
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      result[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return result;
  };
  async function sha512(message) {
    const data = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    return new Uint8Array(hashBuffer);
  }
  const generateChallenge = () =>
    arrayToHex(crypto.getRandomValues(new Uint8Array(32)));

  // --- FUNGSI UTAMA (VERSI CLIENT-SERVER) ---
  function showTab(tabName) {
    tabs.forEach((tab) => tab.classList.remove("active"));
    tabContents.forEach((content) => content.classList.remove("active"));
    document
      .querySelector(`.tab[data-tab="${tabName}"]`)
      .classList.add("active");
    document.getElementById(tabName).classList.add("active");

    // Refresh daftar user dari server setiap kali pindah ke tab 'users'
    if (tabName === "users") {
      refreshUserList();
    }
  }

  async function handleGenerateKeys() {
    const startTime = performance.now();
    try {
      const keyPair = nacl.sign.keyPair();
      const endTime = performance.now();
      generatedKeys = {
        // Konversi ke Base64 untuk dikirim via JSON
        publicKey: nacl.util.encodeBase64(keyPair.publicKey),
        privateKey: nacl.util.encodeBase64(keyPair.secretKey),
      };
      keyGenResultDiv.innerHTML = `<div class="success"><strong>✅ Key pair berhasil dibuat!</strong></div><div class="key-display"><strong>Public Key (Base64):</strong><br>${generatedKeys.publicKey}</div><div class="key-display"><strong>Private Key (Base64):</strong><br>${generatedKeys.privateKey}</div><div class="info"><strong>⚠️ Penting:</strong> Salin Private Key ini untuk login.</div>`;
      registerBtn.disabled = false;
    } catch (error) {
      keyGenResultDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> ${error.message}</div>`;
    }
  }

  async function handleRegisterUser() {
    const username = regUsernameInput.value.trim();
    if (!username || !generatedKeys) {
      keyGenResultDiv.innerHTML += `<div class="error"><strong>❌ Error:</strong> Pastikan username diisi dan key sudah dibuat.</div>`;
      return;
    }

    try {
      const response = await fetch(`${SERVER_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          publicKey: generatedKeys.publicKey,
        }),
      });
      const result = await response.json();

      if (result.success) {
        keyGenResultDiv.innerHTML += `<div class="success"><strong>🎉 Registrasi Berhasil:</strong> ${result.message}</div>`;
        regUsernameInput.value = "";
        generatedKeys = null;
        registerBtn.disabled = true;
      } else {
        keyGenResultDiv.innerHTML += `<div class="error"><strong>❌ Gagal Registrasi:</strong> ${result.message}</div>`;
      }
    } catch (error) {
      keyGenResultDiv.innerHTML += `<div class="error"><strong>❌ Error:</strong> Tidak dapat terhubung ke server.</div>`;
    }
  }

  async function refreshUserList() {
    try {
      const response = await fetch(`${SERVER_URL}/users`);
      users = await response.json(); // Simpan data user terbaru

      if (Object.keys(users).length === 0) {
        userListDiv.innerHTML = `<div class="info"><strong>📝 Belum ada user terdaftar di server.</strong></div>`;
        return;
      }
      let html = '<div class="user-list">';
      Object.entries(users).forEach(([username, userData]) => {
        html += `<div class="user-item"><div class="user-info"><div class="user-name">${username}</div><div class="user-key">Public Key: ${userData.publicKey.substring(
          0,
          20
        )}...</div></div><div><small>Registered: ${new Date(
          userData.registeredAt
        ).toLocaleString()}</small></div></div>`;
      });
      html += "</div>";
      userListDiv.innerHTML = html;
    } catch (error) {
      userListDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> Tidak dapat mengambil data dari server.</div>`;
    }
  }

  async function handleLogin() {
    const username = loginUsernameInput.value.trim();
    const privateKeyB64 = privateKeyInput.value.trim();
    loginBtn.disabled = true;

    if (!username || !privateKeyB64) {
      loginResultDiv.innerHTML = `<div class="error"><strong>❌ Error:</strong> Username dan private key harus diisi!</div>`;
      loginBtn.disabled = false; // Aktifkan kembali tombol karena proses gagal
      return; // Hentikan eksekusi fungsi di sini
    }
    try {
      loginResultDiv.innerHTML = `<div class="info">Memulai proses autentikasi...</div><div class="login-log"></div>`;
      const logContainer = loginResultDiv.querySelector(".login-log");

      // Step 1: Minta challenge dari server
      logContainer.innerHTML += `<div class="log-item"><span class="step">1.</span> <div>Meminta challenge dari server...</div></div>`;
      const challengeResponse = await fetch(`${SERVER_URL}/login-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const {
        success: challengeSuccess,
        challenge,
        message: challengeMessage,
      } = await challengeResponse.json();

      if (!challengeSuccess) {
        throw new Error(challengeMessage);
      }
      logContainer.innerHTML += `<div class="log-item">Diterima Challenge: <span class="details">${challenge}</span></div>`;
      await sleep(500);

      // Step 2 & 3: Hash dan Sign di sisi klien
      logContainer.innerHTML += `<div class="log-item"><span class="step">2.</span> <div>Melakukan hash pada challenge (SHA-512)...</div></div>`;
      const hashedChallenge = await sha512(challenge);
      await sleep(500);

      logContainer.innerHTML += `<div class="log-item"><span class="step">3.</span> <div>Menandatangani hash dengan private key...</div></div>`;
      const privateKeyBytes = nacl.util.decodeBase64(privateKeyB64);
      const signatureBytes = nacl.sign.detached(
        hashedChallenge,
        privateKeyBytes
      );
      const signatureB64 = nacl.util.encodeBase64(signatureBytes);
      await sleep(500);

      // Step 4: Kirim signature ke server untuk verifikasi
      logContainer.innerHTML += `<div class="log-item"><span class="step">4.</span> <div>Mengirim signature ke server untuk diverifikasi...</div></div>`;
      const verifyResponse = await fetch(`${SERVER_URL}/login-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          signature: signatureB64,
        }),
      });
      const { success: verifySuccess, message: verifyMessage } =
        await verifyResponse.json();

      if (verifySuccess) {
        capturedLoginData = {
          username: username,
          signature: signatureBytes, // Simpan signature (dalam format bytes)
        };
        logContainer.innerHTML += `<div class="log-item"><span class="step">✅</span> <strong class="final-success">${verifyMessage}</strong></div>`;
        logContainer.innerHTML += `<div class="info" style="margin-top:10px;">Data login ini telah direkam untuk Simulasi Replay Attack.</div>`;
      } else {
        capturedLoginData = null
        throw new Error(verifyMessage);
      }
    } catch (error) {
      loginResultDiv.innerHTML = `<div class="error"><strong>❌ Error Login:</strong> ${error.message}</div>`;
    } finally {
      loginBtn.disabled = false;
    }
  }

  // --- FUNGSI EVALUASI DAN SIMULASI ---
  async function runPerformanceTest() {
    simulationResultDiv.innerHTML = `<div class="info"><span class="loading"></span><strong>Menjalankan test performa...</strong></div>`;
    const iterations = 100;
    const results = { keyGen: [], signing: [], verification: [] };

    for (let i = 0; i < iterations; i++) {
      const keyGenStart = performance.now();
      const keyPair = nacl.sign.keyPair();
      results.keyGen.push(performance.now() - keyGenStart);

      const challenge = generateChallenge();
      const hashedChallenge = await sha512(challenge);

      const signStart = performance.now();
      const signature = nacl.sign.detached(hashedChallenge, keyPair.secretKey);
      results.signing.push(performance.now() - signStart);

      const verifyStart = performance.now();
      nacl.sign.detached.verify(hashedChallenge, signature, keyPair.publicKey);
      results.verification.push(performance.now() - verifyStart);
    }

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
    const avgKeyGen = avg(results.keyGen);
    const avgSigning = avg(results.signing);
    const avgVerification = avg(results.verification);

    // Menampilkan hasil di div yang benar
    simulationResultDiv.innerHTML = `
            <div class="success"><strong>📊 Hasil Test Performa (${iterations} iterasi):</strong></div>
            <div class="performance-metrics">
                <div class="metric-card"><div class="metric-value">${avgKeyGen.toFixed(
                  3
                )}</div><div class="metric-label">ms Key Generation</div></div>
                <div class="metric-card"><div class="metric-value">${avgSigning.toFixed(
                  3
                )}</div><div class="metric-label">ms Signing</div></div>
                <div class="metric-card"><div class="metric-value">${avgVerification.toFixed(
                  3
                )}</div><div class="metric-label">ms Verification</div></div>
            </div>`;
  }

  // Fungsi simulasi serangan tetap sama
  async function simulateReplayAttack() {
    if (!capturedLoginData) {
      simulationResultDiv.innerHTML = `<div class="error"><strong>Gagal:</strong> Belum ada data login yang berhasil "direkam". Silakan login dengan benar terlebih dahulu di tab "Login".</div>`;
      return;
    }

    // Memastikan data user terbaru
    await refreshUserList();

    simulationResultDiv.innerHTML = `<div class="info">Memulai simulasi Replay Attack...</div><div class="login-log"></div>`;
    const log = simulationResultDiv.querySelector(".login-log");
    const { username, signature } = capturedLoginData;
  
    await sleep(500);
    log.innerHTML += `<div class="log-item"><strong>Penyerang telah "merekam" data berikut:</strong><br><span class="details">Username: ${username}<br>Signature: ${arrayToHex(
      signature
    )}</span></div>`;
  
    await sleep(1000);
    log.innerHTML += `<div class="log-item"><strong>Sistem membuat challenge BARU untuk login baru:</strong></div>`;
  
    const newChallenge = generateChallenge();
    const newHashedChallenge = await sha512(newChallenge); // Typo corrected to sha512
    await sleep(1000);
    log.innerHTML += `<div class="log-item">Challenge Baru: <span class="details">${newChallenge}</span></div>`;
  
    await sleep(1000);
    log.innerHTML += `<div class="log-item"><strong>Penyerang mencoba menggunakan SIGNATURE LAMA untuk HASH BARU.</strong></div>`;
  
    await sleep(1000);
  
    try {
      const isReplayValid = nacl.sign.detached.verify(
        newHashedChallenge,
        signature,
        nacl.util.decodeBase64(users[username].publicKey) // Menggunakan dekode Base64
      );
  
      if (isReplayValid) {
        log.innerHTML += `<div class="log-item" style="background-color: #f8d7da;">❌ <strong class="final-error">Serangan Berhasil! Ini celah keamanan!</strong></div>`;
      } else {
        log.innerHTML += `<div class="log-item" style="background-color: #d4edda;">✅ <strong class="final-success">Serangan Gagal!</strong>  Signature lama tidak valid. Sistem aman dari Replay Attack.</div>`;
      }
    } catch (e) {
        log.innerHTML += `<div class="error"><strong>Error saat verifikasi:</strong> ${e.message}</div>`;
    }
  }

  async function simulateBruteForce() {
    simulationResultDiv.innerHTML = `<div class="info">Memulai simulasi Brute Force...</div><div class="login-log"></div>`;
    const log = simulationResultDiv.querySelector(".login-log");

    log.innerHTML += `<div class="log-item"><strong>Konsep:</strong> Menebak private key acak sampai cocok dengan public key.</div>`;
    await sleep(1000);

    log.innerHTML += `<div class="log-item"><strong>Skala Masalah:</strong> Private key Ed25519 memiliki 256 bit. Jumlah kemungkinan kunci adalah 2<sup>256</sup>.</div>`;
    await sleep(1500);

    log.innerHTML += `<div class="log-item">Angka ini lebih besar dari jumlah atom di alam semesta.</div>`;
    await sleep(1500);

    log.innerHTML += `<div class="log-item"><strong>Simulasi Interaktif:</strong> Mencoba kunci acak secepat mungkin...</div>`;

    let attempts = 0;
    const attemptsDiv = document.createElement("div");
    attemptsDiv.className = "log-item";
    attemptsDiv.innerHTML = `Percobaan Dijalankan: <strong>${attempts}</strong>`;
    log.appendChild(attemptsDiv);

    const intervalId = setInterval(() => {
      attempts += Math.floor(Math.random() * 1000) + 4500;
      attemptsDiv.innerHTML = `Percobaan Dijalankan: <strong>${attempts.toLocaleString(
        "id-ID"
      )}</strong>`;
    }, 100);

    setTimeout(() => {
      clearInterval(intervalId);
      log.innerHTML += `<div class="log-item" style="background-color: #d4edda;">✅ <strong>Simulasi Selesai.</strong> Brute force secara komputasi mustahil dilakukan.</div>`;
    }, 3000);
  }

  // --- EVENT LISTENERS ---
  tabs.forEach((tab) =>
    tab.addEventListener("click", () => showTab(tab.dataset.tab))
  );
  generateBtn.addEventListener("click", handleGenerateKeys);
  registerBtn.addEventListener("click", handleRegisterUser);
  loginBtn.addEventListener("click", handleLogin);
  refreshUsersBtn.addEventListener("click", refreshUserList);
  runPerfTestBtn.addEventListener("click", runPerformanceTest);
  runReplayAttackBtn.addEventListener("click", simulateReplayAttack);
  runBruteForceBtn.addEventListener("click", simulateBruteForce);

  // --- INITIALIZATION ---
  refreshUserList();
  showTab("about"); // Mulai dari tab about
});
