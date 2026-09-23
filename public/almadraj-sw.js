/* Service worker Al Madraj.
 *
 * Aturannya sederhana:
 *   - Kerangka aplikasi (HTML, JS/CSS hasil build, ikon, font) boleh disimpan
 *     supaya aplikasi terbuka cepat dan tetap bisa dibuka saat sinyal lemah.
 *   - Data (Supabase, /api/*, pembayaran Mayar) TIDAK PERNAH disimpan. Semua
 *     permintaan lintas-origin selain Google Fonts dilewatkan langsung ke
 *     jaringan, jadi progress, transaksi, dan status bayar selalu data terbaru.
 */

const VERSION = 'v1';
const SHELL_CACHE = 'almadraj-shell-' + VERSION;
const ASSET_CACHE = 'almadraj-assets-' + VERSION;
const MEDIA_CACHE = 'almadraj-media-' + VERSION;
const MEDIA_LIMIT = 80;

const SHELL = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/apple-touch-icon.png',
  '/al-madraj-logo-square.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      // Satu per satu, supaya satu berkas yang gagal tidak membatalkan instalasi.
      Promise.all(SHELL.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => null)))
    )
  );
  // Versi pertama langsung aktif. Versi berikutnya menunggu pengguna menekan
  // "Perbarui" (lihat pesan SKIP_WAITING) agar halaman tidak berubah di tengah belajar.
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = [SHELL_CACHE, ASSET_CACHE, MEDIA_CACHE];
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('almadraj-') && !keep.includes(k)).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) {
      try { await self.registration.navigationPreload.enable(); } catch (_) {}
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

const isGoogleFont = (url) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (!sameOrigin) {
    if (isGoogleFont(url)) event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
    return; // Supabase, Mayar, YouTube, Drive, dll: selalu jaringan.
  }

  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('sw.js')) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(event));
    return;
  }

  // Berkas hasil build Vite memakai hash di namanya, jadi aman disimpan permanen.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (/\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|otf|ttf)$/i.test(url.pathname) || url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(request, MEDIA_CACHE, MEDIA_LIMIT));
  }
});

async function networkFirstPage(event) {
  const { request } = event;
  const cache = await caches.open(SHELL_CACHE);
  try {
    const preloaded = await event.preloadResponse;
    const response = preloaded || await fetch(request);
    if (response && response.ok && response.type === 'basic') cache.put(request, response.clone());
    return response;
  } catch (_) {
    return (await cache.match(request, { ignoreSearch: true }))
      || (await cache.match('/offline.html'))
      || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName, limit) {
  const cache = await caches.open(cacheName);
  // Cari juga di cache kerangka: ikon & logo sudah disimpan saat instalasi.
  const cached = (await cache.match(request)) || (await caches.match(request));
  const network = fetch(request).then(async (response) => {
    if (response && (response.ok || response.type === 'opaque')) {
      await cache.put(request, response.clone());
      if (limit) trim(cache, limit);
    }
    return response;
  }).catch(() => cached || Response.error());
  return cached || network;
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length <= limit) return;
  await Promise.all(keys.slice(0, keys.length - limit).map((key) => cache.delete(key)));
}
