import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Download, RefreshCw, Share, SquarePlus, WifiOff, X, Zap, Maximize2, Smartphone } from 'lucide-react';
import { applyUpdate, closeInstallSheet, openInstallSheet, promptInstall, usePwa } from './pwa';

const DISMISS_KEY = 'almadraj-install-dismissed-at';
const DISMISS_DAYS = 14;
const AUTO_PROMPT_DELAY_MS = 25_000;

/** Halaman presentasi/proposal bukan bagian aplikasi belajar — jangan ganggu dengan ajakan instalasi. */
const NON_APP_PATHS = ['/proposal', '/rancangan', '/ui-preview', '/demo-pro-lms'];
const isAppPath = () => !NON_APP_PATHS.some((path) => window.location.pathname.startsWith(path));

const recentlyDismissed = () => {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    return Date.now() - at < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
};

const rememberDismiss = () => {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {}
};

const sheetMotion = {
  initial: { opacity: 0, y: 28, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 24, scale: 0.98 },
  transition: { type: 'spring' as const, stiffness: 380, damping: 32 },
};

export const PwaLayer = () => {
  const { canPrompt, iosManual, standalone, sheetOpen, updateReady, online } = usePwa();
  const installable = !standalone && (canPrompt || iosManual);

  // Tawarkan instalasi otomatis sekali, setelah pengguna sempat melihat-lihat.
  useEffect(() => {
    if (!installable || recentlyDismissed()) return;
    const timer = window.setTimeout(() => {
      if (isAppPath() && !recentlyDismissed()) openInstallSheet();
    }, AUTO_PROMPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [installable]);

  const dismiss = () => {
    rememberDismiss();
    closeInstallSheet();
  };

  const install = async () => {
    const accepted = await promptInstall();
    if (!accepted) rememberDismiss();
    closeInstallSheet();
  };

  return (
    <>
      <OfflineIndicator online={online} />

      <AnimatePresence>
        {sheetOpen && installable && (
          <>
            <motion.button
              key="pwa-backdrop"
              type="button"
              aria-label="Tutup ajakan pasang aplikasi"
              onClick={dismiss}
              className="fixed inset-0 z-[90] bg-[#0b1f19]/30 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.section
              key="pwa-sheet"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pwa-install-title"
              className="pwa-floating fixed inset-x-3 z-[95] mx-auto max-w-[420px] overflow-hidden rounded-[28px] border border-[#dce9df] bg-white text-[#17231b] shadow-[0_24px_60px_rgba(8,48,42,0.22)] sm:left-auto sm:right-5 sm:mx-0 sm:w-[380px]"
              {...sheetMotion}
            >
              <div className="relative bg-[radial-gradient(120%_120%_at_0%_0%,#e5f4f2_0%,#ffffff_65%)] px-5 pb-5 pt-5">
                <button
                  type="button"
                  onClick={dismiss}
                  aria-label="Tutup"
                  className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full text-[#6b8274] transition hover:bg-[#eef4f0] hover:text-[#17231b]"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-3.5 pr-8">
                  <img src="/pwa/icon-192.png" alt="" className="h-14 w-14 shrink-0 rounded-[18px] shadow-[0_10px_24px_rgba(0,109,119,0.28)]" />
                  <div className="min-w-0">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#006d77]">Aplikasi Al Madraj</p>
                    <h2 id="pwa-install-title" className="mt-1 text-[19px] font-semibold leading-tight tracking-[-0.01em]">
                      Belajar lebih nyaman dari layar utama.
                    </h2>
                  </div>
                </div>

                {iosManual && !canPrompt ? <IosSteps /> : <Benefits />}

                <div className="mt-5 flex gap-2.5">
                  <button
                    type="button"
                    onClick={dismiss}
                    className="min-h-12 flex-1 rounded-full border border-[#cfe0d5] px-4 text-sm font-semibold text-[#4c6657] transition hover:bg-[#f2f7f4]"
                  >
                    {iosManual && !canPrompt ? 'Mengerti' : 'Nanti saja'}
                  </button>
                  {canPrompt && (
                    <button
                      type="button"
                      onClick={install}
                      className="flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-full bg-[#006d77] px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(0,109,119,0.24)] transition hover:bg-[#00565e] active:scale-[0.98]"
                    >
                      <Download className="h-4 w-4" />
                      Pasang aplikasi
                    </button>
                  )}
                </div>
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {updateReady && (
          <motion.div
            key="pwa-update"
            role="status"
            className="pwa-floating fixed inset-x-3 z-[85] mx-auto flex max-w-[420px] items-center gap-3 rounded-full bg-[#102c22] py-2 pl-4 pr-2 text-white shadow-[0_18px_40px_rgba(8,32,26,0.35)] sm:left-auto sm:right-5 sm:mx-0 sm:w-auto"
            {...sheetMotion}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10">
              <RefreshCw className="h-4 w-4 text-[#83c5be]" />
            </span>
            <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug">Versi baru Al Madraj siap dipakai.</p>
            <button
              type="button"
              onClick={applyUpdate}
              className="min-h-10 shrink-0 rounded-full bg-[#83c5be] px-4 text-[13px] font-bold text-[#00201a] transition hover:bg-[#9fd6cf] active:scale-[0.97]"
            >
              Perbarui
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const Benefits = () => (
  <ul className="mt-4 grid grid-cols-3 gap-2">
    {[
      { icon: Zap, label: 'Buka sekali ketuk' },
      { icon: Maximize2, label: 'Layar penuh' },
      { icon: Smartphone, label: 'Ringan & cepat' },
    ].map(({ icon: Icon, label }) => (
      <li key={label} className="flex flex-col items-center gap-1.5 rounded-2xl border border-[#e2ece5] bg-white/80 px-2 py-3 text-center">
        <Icon className="h-4 w-4 text-[#006d77]" />
        <span className="text-[11px] font-semibold leading-tight text-[#3f5548]">{label}</span>
      </li>
    ))}
  </ul>
);

const IosSteps = () => (
  <ol className="mt-4 space-y-2">
    {[
      { icon: Share, text: <>Ketuk ikon <b>Bagikan</b> di bar Safari</> },
      { icon: SquarePlus, text: <>Pilih <b>Tambah ke Layar Utama</b></> },
      { icon: Check, text: <>Ketuk <b>Tambah</b> di pojok kanan atas</> },
    ].map(({ icon: Icon, text }, index) => (
      <li key={index} className="flex items-center gap-3 rounded-2xl border border-[#e2ece5] bg-white/80 px-3 py-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#e5f4f2] text-[#006d77]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[13px] leading-snug text-[#3f5548]">{text}</span>
      </li>
    ))}
  </ol>
);

const OfflineIndicator = ({ online }: { online: boolean }) => {
  const [showBackOnline, setShowBackOnline] = useState(false);
  const [wasOffline, setWasOffline] = useState(!online);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowBackOnline(false);
      return;
    }
    if (!wasOffline) return;
    setShowBackOnline(true);
    const timer = window.setTimeout(() => {
      setShowBackOnline(false);
      setWasOffline(false);
    }, 2600);
    return () => window.clearTimeout(timer);
  }, [online, wasOffline]);

  const visible = !online || showBackOnline;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={online ? 'online' : 'offline'}
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4"
          style={{ top: 'calc(env(safe-area-inset-top) + 72px)' }}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
        >
          <span
            className={
              'flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-semibold shadow-[0_10px_28px_rgba(8,32,26,0.18)] ' +
              (online ? 'bg-[#006d77] text-white' : 'bg-[#fff4e0] text-[#7a4f00] ring-1 ring-[#f2d49a]')
            }
          >
            {online ? <Check className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {online ? 'Kembali online' : 'Offline · sebagian fitur butuh internet'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/** Tombol kecil "Pasang aplikasi" untuk menu/sidebar; tidak tampil bila sudah terpasang. */
export const InstallAppButton = ({ className = '', onClick }: { className?: string; onClick?: () => void }) => {
  const { canPrompt, iosManual, standalone } = usePwa();
  if (standalone || !(canPrompt || iosManual)) return null;
  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        openInstallSheet();
      }}
      className={className}
    >
      <Download className="h-4 w-4 shrink-0" />
      <span>Pasang aplikasi</span>
    </button>
  );
};
