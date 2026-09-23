import { useSyncExternalStore } from 'react';

/** Event `beforeinstallprompt` belum ada di lib.dom TypeScript. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type PwaState = {
  /** Browser (Chrome/Edge/Android) sudah menyediakan prompt instalasi native. */
  canPrompt: boolean;
  /** Sudah dibuka sebagai aplikasi terpasang. */
  standalone: boolean;
  /** iPhone/iPad Safari: tidak ada prompt native, perlu instruksi manual. */
  iosManual: boolean;
  /** Versi baru service worker menunggu diaktifkan. */
  updateReady: boolean;
  online: boolean;
  /** Lembar ajakan instalasi sedang terbuka (otomatis atau dari tombol "Pasang aplikasi"). */
  sheetOpen: boolean;
};

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIosSafari = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  const otherBrowser = /crios|fxios|edgios|opios/i.test(ua);
  return ios && !otherBrowser;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
let state: PwaState = {
  canPrompt: false,
  standalone: isStandalone(),
  iosManual: isIosSafari() && !isStandalone(),
  updateReady: false,
  online: typeof navigator === 'undefined' ? true : navigator.onLine,
  sheetOpen: false,
};

const listeners = new Set<() => void>();
const setState = (patch: Partial<PwaState>) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const usePwa = () => useSyncExternalStore(subscribe, () => state, () => state);

/** Menampilkan dialog instalasi native. Mengembalikan true bila pengguna memasang. */
export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  const promptEvent = deferredPrompt;
  deferredPrompt = null;
  setState({ canPrompt: false });
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;
  return outcome === 'accepted';
};

export const openInstallSheet = () => setState({ sheetOpen: true });
export const closeInstallSheet = () => setState({ sheetOpen: false });

/** Aktifkan service worker versi baru; halaman dimuat ulang saat ia mengambil alih. */
export const applyUpdate = () => {
  if (waitingWorker) waitingWorker.postMessage({ type: 'SKIP_WAITING' });
  else window.location.reload();
};

let initialized = false;

export const initPwa = () => {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    setState({ canPrompt: true });
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    setState({ canPrompt: false, standalone: true, iosManual: false, sheetOpen: false });
  });
  window.addEventListener('online', () => setState({ online: true }));
  window.addEventListener('offline', () => setState({ online: false }));
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', () =>
    setState({ standalone: isStandalone() })
  );

  document.documentElement.classList.toggle('pwa-standalone', isStandalone());

  // Service worker hanya di build produksi, supaya HMR saat development tidak tertahan cache.
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/almadraj-sw.js', { scope: '/' });

      const trackWaiting = (worker: ServiceWorker | null) => {
        if (!worker) return;
        const markReady = () => {
          // Hanya tawarkan pembaruan bila sudah ada versi lama yang mengontrol halaman.
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            waitingWorker = worker;
            setState({ updateReady: true });
          }
        };
        markReady();
        worker.addEventListener('statechange', markReady);
      };

      trackWaiting(registration.waiting);
      registration.addEventListener('updatefound', () => trackWaiting(registration.installing));

      let reloading = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!waitingWorker || reloading) return;
        reloading = true;
        window.location.reload();
      });

      // Aplikasi terpasang sering dibiarkan terbuka berhari-hari: cek versi baru saat kembali dibuka.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => undefined);
      });
    } catch (error) {
      console.warn('Service worker gagal didaftarkan:', error);
    }
  };

  // Daftarkan setelah halaman selesai dimuat agar tidak berebut bandwidth dengan render pertama.
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', () => void register(), { once: true });
};
