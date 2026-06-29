/**
 * api-client.js — Jembatan antara front-end Siaga Darurat dan backend nyata.
 *
 * File ini TIDAK mengubah tampilan apa pun. Tugasnya cuma menyediakan
 * fungsi-fungsi `SiagaAPI.xxx()` yang dipanggil dari index.html, service.html,
 * dan teknisi.html untuk menggantikan simulasi/demo (alert, localStorage,
 * RealTimeSync lokal) dengan permintaan nyata ke server + database.
 *
 * Cara kerja "real-time": karena backend ini di-deploy ke Vercel (serverless,
 * tidak mendukung WebSocket long-lived), sinkronisasi antar pelanggan↔teknisi
 * dilakukan lewat POLLING — yaitu mengecek server setiap beberapa detik.
 * Ini sedikit kurang instan dibanding WebSocket asli, tapi 100% jalan di
 * hosting gratis dan tetap terasa real-time bagi pengguna (jeda ~2-3 detik).
 */
(function (window) {
  'use strict';

  // ── KONFIGURASI ──────────────────────────────────────────────
  // Karena front-end & backend di-deploy di domain yang SAMA (lihat vercel.json),
  // kita cukup pakai path relatif "/api". Tidak perlu diubah saat hosting.
  const API_BASE = '/api';

  const TOKEN_KEY = 'siaga_token';
  const USER_KEY = 'siaga_user';

  // ── HELPER DASAR ─────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
    catch (e) { return null; }
  }

  function setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function isLoggedIn() {
    return !!getToken();
  }

  async function request(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = 'Bearer ' + token;

    let res;
    try {
      res = await fetch(API_BASE + path, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
      });
    } catch (networkErr) {
      throw new Error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    }

    let data = null;
    try { data = await res.json(); } catch (e) { /* respons tanpa body */ }

    if (!res.ok) {
      const message = (data && data.error) || `Permintaan gagal (HTTP ${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ── AUTH ─────────────────────────────────────────────────────
  async function register({ role, firstName, lastName, email, phone, password, speciality, city }) {
    const data = await request('POST', '/auth/register', { role, firstName, lastName, email, phone, password, speciality, city });
    setSession(data.token, data.user);
    return data.user;
  }

  async function login({ email, password, role }) {
    const data = await request('POST', '/auth/login', { email, password, role });
    setSession(data.token, data.user);
    return data.user;
  }

  async function fetchMe() {
    const data = await request('GET', '/auth/me');
    setSession(getToken(), data.user);
    return data.user;
  }

  function logout() {
    clearSession();
  }

  // ── ORDERS ───────────────────────────────────────────────────
  function createOrder({ serviceKey, serviceTitle, notes, customerLat, customerLng, customerAddress }) {
    return request('POST', '/orders', { serviceKey, serviceTitle, notes, customerLat, customerLng, customerAddress })
      .then(d => d.order);
  }

  function getPendingOrders() {
    return request('GET', '/orders/pending').then(d => d.orders);
  }

  function getActiveOrder() {
    return request('GET', '/orders/active').then(d => d.order);
  }

  function getOrder(orderId) {
    return request('GET', '/orders/' + orderId).then(d => d.order);
  }

  function acceptOrder(orderId, { techLat, techLng, distanceKm, etaMinutes }) {
    return request('POST', `/orders/${orderId}/accept`, { techLat, techLng, distanceKm, etaMinutes }).then(d => d.order);
  }

  function rejectOrder(orderId) {
    return request('POST', `/orders/${orderId}/reject`);
  }

  function updateOrderState(orderId, state, extra) {
    return request('PATCH', `/orders/${orderId}/state`, Object.assign({ state }, extra || {})).then(d => d.order);
  }

  function sendLocation(orderId, { lat, lng, distanceKm, etaMinutes, speedKmh }) {
    return request('POST', `/orders/${orderId}/location`, { lat, lng, distanceKm, etaMinutes, speedKmh }).then(d => d.order);
  }

  function getMessages(orderId) {
    return request('GET', `/orders/${orderId}/messages`).then(d => d.messages);
  }

  function sendMessage(orderId, message) {
    return request('POST', `/orders/${orderId}/messages`, { message }).then(d => d.message);
  }

  // ── RATINGS ──────────────────────────────────────────────────
  function submitRating({ orderId, stars, comment }) {
    return request('POST', '/ratings', { orderId, stars, comment }).then(d => d.rating);
  }

  function getMyRatings() {
    return request('GET', '/ratings/me').then(d => d.ratings);
  }

  // ── BANK ACCOUNTS ────────────────────────────────────────────
  function getBankAccounts() {
    return request('GET', '/bank').then(d => d.accounts);
  }

  function addBankAccount({ method, accountName, accountNumber }) {
    return request('POST', '/bank', { method, accountName, accountNumber }).then(d => d.account);
  }

  function deleteBankAccount(id) {
    return request('DELETE', '/bank/' + id);
  }

  function withdraw({ bankAccountId, amount }) {
    return request('POST', '/bank/withdraw', { bankAccountId, amount }).then(d => d.withdrawal);
  }

  // ── POLLING HELPER ───────────────────────────────────────────
  /**
   * Memanggil `fn` setiap `intervalMs` milidetik selama dipanggil.
   * Mengembalikan fungsi `stop()` untuk menghentikan polling.
   * Otomatis berhenti sebentar (idle) jika tab tidak terlihat, untuk
   * menghemat kuota gratis database/hosting.
   */
  function startPolling(fn, intervalMs) {
    let stopped = false;
    let timer = null;

    async function tick() {
      if (stopped) return;
      if (document.visibilityState === 'visible') {
        try { await fn(); } catch (e) { console.warn('Polling error:', e.message); }
      }
      if (!stopped) timer = setTimeout(tick, intervalMs);
    }

    timer = setTimeout(tick, intervalMs);

    return function stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }

  // ── EXPORT ───────────────────────────────────────────────────
  window.SiagaAPI = {
    // auth
    register, login, logout, fetchMe, isLoggedIn, getUser, getToken,
    // orders
    createOrder, getPendingOrders, getActiveOrder, getOrder,
    acceptOrder, rejectOrder, updateOrderState, sendLocation,
    getMessages, sendMessage,
    // ratings
    submitRating, getMyRatings,
    // bank
    getBankAccounts, addBankAccount, deleteBankAccount, withdraw,
    // util
    startPolling
  };
})(window);
