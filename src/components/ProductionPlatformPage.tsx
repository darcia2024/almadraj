import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, BarChart3, Bell, Bookmark, BookOpen, CalendarDays, Camera, Check,
  CheckCircle2, ChevronLeft, ChevronRight, CirclePlay, Clock, Compass, CreditCard, Download, Eye, FileCheck, FileText,
  Flame, GraduationCap, Headphones, ImageIcon, LayoutDashboard, Lock, LockKeyhole, LogOut, Maximize, Menu,
  MessageCircle, Minimize, MoreHorizontal, Music, Pause, Pencil, Play, Plus, Printer, RefreshCw, RotateCcw,
  RotateCw, Save, Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Star, Tag, Target, Trash2,
  UserRound, UsersRound, Video, Volume2, VolumeX, X
} from 'lucide-react';
import { requireSupabase, supabase, supabaseConfigured } from '../lib/supabase';
import { getCourseCoverImage } from '../data/galleryData';
import { MayarPaymentModal } from './MayarPaymentModal';
import { COURSES_DETAIL_DATA, getCourseDetail, CourseDetail, getCourseTutorName } from '../data/coursesDetailData';

type ProgramType = 'Dars' | 'Bimbel';
type Course = {
  id: string;
  slug: string;
  title: string;
  program_type?: ProgramType;
  faculty: string;
  summary: string;
  tutor: string;
  schedule: string;
  duration: string;
  price: number;
  thumbnail?: string;
  thumbnail_url?: string;
  pj_name?: string;
  pj_contact?: string;
  pj_email?: string;
  media_format?: 'video' | 'audio' | 'hybrid';
  modul_url?: string;
  has_certificate?: boolean;
};
type Lesson = {
  id: string;
  course_id: string;
  title: string;
  content_type: 'video' | 'audio' | 'pdf' | 'text';
  duration: string;
  content_url?: string | null;
  sort_order: number;
  teacher_notes?: string;
  board_photos?: string[];
};
type LessonProgress = { lesson_id: string; watched_seconds: number; duration_seconds: number; completed_at: string | null; last_watched_at?: string | null };
type YouTubeMetadata = { title: string; authorName: string; thumbnailUrl: string };
type Profile = { id: string; full_name: string; whatsapp: string; role: 'student' | 'admin'; avatar_path?: string | null; avatar_url?: string; email?: string };
type Enrollment = { id: string; course_id: string; status: 'pending' | 'active' | 'cancelled'; course: Course };
type Screen = 'login' | 'register' | 'forgot' | 'dashboard' | 'catalog' | 'course' | 'checkout' | 'paymentStatus' | 'learning' | 'learningHub' | 'admin' | 'settings' | 'transactions';

export const MASTER_ADMIN_EMAILS = [
  'daru.fahma@gmail.com',
  'fahmaadaru@gmail.com',
  'darciatemantaraglobal@gmail.com',
  'almadrajstudy@gmail.com'
];
export const isMasterAdmin = (email?: string | null): boolean => {
  if (!email) return false;
  return MASTER_ADMIN_EMAILS.includes(email.trim().toLowerCase());
};

const money = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
const durationToSeconds = (duration: string) => {
  const parts = duration.split(':').map(Number);
  if (parts.some((part) => Number.isNaN(part))) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};
const progressPercent = (progress?: LessonProgress, lesson?: Lesson) => {
  if (!progress) return 0;
  if (progress.completed_at) return 100;
  const total = progress.duration_seconds || (lesson ? durationToSeconds(lesson.duration) : 0);
  return total ? Math.min(99, Math.round((progress.watched_seconds / total) * 100)) : 0;
};
const compressAvatar = (file: File) => new Promise<Blob>((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Foto profil gagal dibaca.'));
  reader.onload = () => {
    const image = new window.Image();
    image.onerror = () => reject(new Error('Format foto profil tidak didukung.'));
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 256;
      const scale = Math.min(size / image.width, size / image.height);
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      canvas.getContext('2d')?.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Foto profil gagal diproses.')), 'image/jpeg', 0.82);
    };
    image.src = reader.result as string;
  };
  reader.readAsDataURL(file);
});

const routeScreen = (path: string): Screen => path.startsWith('/login') ? 'login' : path.startsWith('/register') ? 'register' : path.startsWith('/lupa-password') ? 'forgot' : path.startsWith('/admin') ? 'admin' : path === '/pengaturan' ? 'settings' : path === '/transaksi' ? 'transactions' : (path === '/kelas' || path === '/katalog') ? 'catalog' : path.startsWith('/kelas/') ? 'course' : path.startsWith('/checkout/') ? 'checkout' : path.startsWith('/pembayaran/') ? 'paymentStatus' : path === '/belajar' ? 'learningHub' : path.startsWith('/belajar/') ? 'learning' : 'dashboard';

export const UserAvatar: React.FC<{
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  className?: string;
  fallbackIcon?: React.ElementType;
}> = ({ src, name = 'Pengguna', size = 'md', className = '', fallbackIcon: FallbackIcon }) => {
  const [hasError, setHasError] = useState(false);
  const letter = (name?.trim() || 'P').charAt(0).toUpperCase();

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const sizeClass = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-xs font-bold',
    lg: 'h-14 w-14 sm:h-15 sm:w-15 text-base font-bold',
    xl: 'h-16 w-16 text-lg font-bold',
    custom: '',
  }[size];

  if (src && !hasError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        onError={() => setHasError(true)}
        className={`${sizeClass} rounded-full object-cover select-none ${className}`}
      />
    );
  }

  if (FallbackIcon) {
    return (
      <div className={`grid ${sizeClass} place-items-center rounded-full bg-gradient-to-tr from-[#006d77] to-[#83c5be] text-white select-none ${className}`}>
        <FallbackIcon className="h-1/2 w-1/2 text-white" />
      </div>
    );
  }

  return (
    <span className={`flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-tr from-[#006d77] to-[#83c5be] font-bold text-white shadow-2xs select-none ${className}`}>
      {letter}
    </span>
  );
};

export const ProductionPlatformPage: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  const [sessionUser, setSessionUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, unknown> } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const screen = routeScreen(path);

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => { if (mounted) { setSessionUser(data.session?.user || null); setAuthLoading(false); } }).catch(() => { if (mounted) setAuthLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { if (mounted) { setSessionUser(nextSession?.user || null); setAuthLoading(false); } });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname + window.location.search);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!supabase || !sessionUser) { setProfile(null); return; }
    const sb = supabase;
    const userEmail = (sessionUser.email || '').toLowerCase().trim();
    const isMaster = isMasterAdmin(userEmail);
    const fallbackName = (typeof sessionUser.user_metadata?.full_name === 'string' && sessionUser.user_metadata.full_name) || (sessionUser.email ? sessionUser.email.split('@')[0] : 'Pengguna');
    const fallbackRole = isMaster ? 'admin' : 'student';
    const googleAvatar = typeof sessionUser.user_metadata?.avatar_url === 'string' ? sessionUser.user_metadata.avatar_url : typeof sessionUser.user_metadata?.picture === 'string' ? sessionUser.user_metadata.picture : '';

    const fetchProfile = async () => {
      let activeProfile: (Profile & { email?: string }) | null = null;

      // 1. Try select with email column
      const res = await sb.from('profiles').select('id,full_name,whatsapp,role,avatar_path,email').eq('id', sessionUser.id).maybeSingle();
      if (res.data) {
        activeProfile = res.data;
      } else if (res.error) {
        // Fallback without email column if table does not have email column yet
        const retry = await sb.from('profiles').select('id,full_name,whatsapp,role,avatar_path').eq('id', sessionUser.id).maybeSingle();
        if (retry.data) activeProfile = retry.data;
      }

      // 2. If profile record doesn't exist in profiles table yet, upsert it
      if (!activeProfile) {
        const upsertRes = await sb.from('profiles').upsert({
          id: sessionUser.id,
          email: userEmail,
          full_name: fallbackName,
          whatsapp: '',
          role: fallbackRole,
        }).select('id,full_name,whatsapp,role,avatar_path,email').maybeSingle();

        if (upsertRes.data) {
          activeProfile = upsertRes.data;
        } else {
          // If upsert with email column failed (e.g. email column doesn't exist yet), retry without email
          const fallbackUpsert = await sb.from('profiles').upsert({
            id: sessionUser.id,
            full_name: fallbackName,
            whatsapp: '',
            role: fallbackRole,
          }).select('id,full_name,whatsapp,role,avatar_path').maybeSingle();
          if (fallbackUpsert.data) activeProfile = fallbackUpsert.data;
        }
      } else if (!activeProfile.email && userEmail) {
        // Try updating email if possible, silently ignoring if column not yet added
        sb.from('profiles').update({ email: userEmail }).eq('id', sessionUser.id).then(() => null, () => null);
        activeProfile.email = userEmail;
      }

      // 3. Fallback active profile if DB operations had any issue, so user is NEVER left without profile/sidebar
      if (!activeProfile) {
        activeProfile = {
          id: sessionUser.id,
          full_name: fallbackName,
          whatsapp: '',
          role: fallbackRole,
          email: userEmail,
        };
      }

      if (isMaster && activeProfile.role !== 'admin') {
        await sb.from('profiles').update({ role: 'admin', updated_at: new Date().toISOString() }).eq('id', sessionUser.id).then(() => null, () => null);
        activeProfile.role = 'admin';
      }

      if (isMaster) {
        activeProfile.role = 'admin';
      }

      const signedAvatar = activeProfile.avatar_path ? await sb.storage.from('profile-avatars').createSignedUrl(activeProfile.avatar_path, 3600) : null;
      setProfile({ ...activeProfile, avatar_url: signedAvatar?.data?.signedUrl || googleAvatar });
    };

    fetchProfile().catch((err) => {
      console.warn('Profile load fallback triggered:', err);
      setProfile({
        id: sessionUser.id,
        full_name: fallbackName,
        whatsapp: '',
        role: fallbackRole,
        avatar_url: googleAvatar,
        email: userEmail,
      });
    });
  }, [sessionUser]);

  const go = (next: string) => { window.history.pushState(null, '', next); setPath(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const logout = async () => { if (supabase) await supabase.auth.signOut(); go('/login'); };

  useEffect(() => {
    if (!authLoading && sessionUser && ['login', 'register', 'forgot'].includes(screen)) {
      const nextPath = new URLSearchParams(window.location.search).get('next');
      const target = nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard';
      go(target);
    }
  }, [authLoading, sessionUser, screen]);

  const isMaster = isMasterAdmin(sessionUser?.email);

  if (!supabaseConfigured) return <BackendRequired />;
  if (authLoading) return <PublicLoading />;
  if (screen === 'login' || screen === 'register' || screen === 'forgot') return sessionUser ? <PublicLoading /> : <AuthScreenV2 onNavigate={go} onError={setError} error={error} />;
  if (screen === 'course') return <CourseRouteV2 path={path} user={sessionUser} profile={profile} onNavigate={go} onLogout={logout} />;
  if (screen === 'catalog') return <CatalogRoute profile={profile} onNavigate={go} onError={setError} onLogout={logout} />;
  if (!sessionUser) return <AuthRedirect onNavigate={go} />;
  if (screen === 'admin' && profile?.role !== 'admin' && !isMaster) return <BackendShell profile={profile} onNavigate={go} onLogout={logout}><Notice title="Akses admin ditolak" text="Akun ini belum memiliki role admin di database." /></BackendShell>;
  if (screen === 'learningHub') return <LearningHubRoute user={sessionUser} profile={profile} onNavigate={go} onLogout={logout} />;
  if (screen === 'learning') return <LearningRouteWithTracking path={path} user={sessionUser} profile={profile} onNavigate={go} onError={setError} onLogout={logout} />;
  if (screen === 'paymentStatus') return <BackendShell profile={profile} onNavigate={go} onLogout={logout}><PaymentStatusRoute path={path} user={sessionUser} onNavigate={go} /></BackendShell>;

  return <BackendShell profile={profile} onNavigate={go} onLogout={logout} onProfileSaved={setProfile}>
    {screen === 'dashboard' && <DashboardRoute user={sessionUser} profile={profile} onNavigate={go} onLogout={logout} onProfileSaved={setProfile} />}
    {screen === 'checkout' && <CheckoutRoute path={path} onNavigate={go} onError={setError} />}
    {screen === 'admin' && <AdminProductionRoute onError={setError} user={sessionUser} profile={profile} />}
    {screen === 'settings' && <SettingsProductionRoute user={sessionUser} profile={profile} onSaved={setProfile} onError={setError} />}
    {screen === 'transactions' && <TransactionsProductionRoute user={sessionUser} />}
    {(error || null) && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}<button onClick={() => setError('')} className="ml-3 font-bold underline">Tutup</button></p>}
  </BackendShell>;
};

const AuthRedirect = ({ onNavigate }: { onNavigate: (path: string) => void }) => {
  useEffect(() => { onNavigate('/login?next=' + encodeURIComponent(window.location.pathname + window.location.search)); }, [onNavigate]);
  return <PublicLoading />;
};

const BackendRequired = () => <main className="grid min-h-[100dvh] place-items-center bg-[#f7faf8] px-5 text-[#17231b]"><section className="max-w-xl rounded-2xl border border-[#dce9df] bg-white p-8 shadow-sm sm:p-10"><img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-12 w-16 rounded-lg object-cover" /><p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Backend belum terhubung</p><h1 className="mt-3 text-3xl font-semibold">Website sudah siap untuk Supabase LMS.</h1><p className="mt-4 text-sm leading-7 text-[#607568]">Isi environment variable dari <code className="rounded bg-[#edf8f2] px-1.5 py-0.5">.env.example</code>, jalankan <code className="rounded bg-[#edf8f2] px-1.5 py-0.5">supabase_lms_schema.sql</code> pada project Supabase LMS, lalu restart server. Tidak ada data akun atau kelas yang dibuat di browser.</p><a href="/" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white">Kembali ke website <ArrowRight className="h-4 w-4" /></a></section></main>;


const AuthScreenV2 = ({ onNavigate, onError, error }: { onNavigate: (path: string) => void; onError: (message: string) => void; error: string }) => {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    setLoading(true);
    onError('');
    try {
      const nextPath = new URLSearchParams(window.location.search).get('next');
      const destination = nextPath && nextPath.startsWith('/') ? nextPath : '/dashboard';
      const result = await requireSupabase().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin + destination },
      });
      if (result.error) throw new Error(result.error.message);
    } catch (oauthError) {
      onError(oauthError instanceof Error ? oauthError.message : 'Login Google gagal dimulai.');
      setLoading(false);
    }
  };

  return <main className="platform-compact min-h-[100dvh] bg-white text-[#17231b] lg:grid lg:grid-cols-[.9fr_1.1fr]">
    <section className="relative hidden overflow-hidden bg-[#102c22] p-12 text-white lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.1]" style={{ backgroundImage: "url('/al-madraj-header.png')" }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[#102c22]/75" aria-hidden="true" />
      <div className="relative z-10 flex items-center gap-3"><a href="/" className="flex items-center gap-3"><img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-12 w-16 object-contain" /><span className="font-semibold">Al Madraj</span></a></div>
      <div className="relative z-10 max-w-lg"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#83c5be]">Ruang belajar Al-Azhar</p><h1 className="mt-5 text-5xl font-semibold leading-[.96]">Satu akun untuk dars, kelas, dan progress belajarmu.</h1><p className="mt-6 text-base leading-7 text-[#c2d8ce]">Masuk dengan akun Google untuk melanjutkan kajian, membeli program, dan menyimpan progress belajar di Al Madraj.</p><div className="mt-7 flex flex-wrap gap-2 text-xs text-[#c2d8ce]"><span className="rounded-full bg-white/10 px-3 py-2">Akses satu akun</span><span className="rounded-full bg-white/10 px-3 py-2">Progress tersimpan</span></div></div>
      <p className="relative z-10 text-sm text-[#8ba99b]">Platform belajar ilmu Islam Al Madraj</p>
    </section>
    <section className="flex min-h-[100dvh] items-center justify-center px-5 py-10 sm:px-8"><div className="w-full max-w-md">
      <a href="/" className="flex items-center gap-3 lg:hidden"><img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-10 w-14 object-contain" /><span className="text-sm font-bold">Al Madraj</span></a>
      <div className="mt-12"><p className="text-sm font-semibold text-[#006d77]">Ruang belajar Al Madraj</p><h2 className="mt-3 text-4xl font-semibold leading-tight">Masuk ke ruang belajar.</h2><p className="mt-3 text-sm leading-6 text-[#607568]">Gunakan akun Google untuk mengakses program, kelas, dan progress belajarmu.</p></div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button type="button" onClick={signInWithGoogle} disabled={loading} className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white shadow-[0_8px_18px_rgba(2,118,128,0.16)] hover:bg-[#00565e] disabled:cursor-wait disabled:opacity-60"><span className="grid h-6 w-6 place-items-center rounded-full bg-white text-xs font-bold text-[#006d77]">G</span>{loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'} <ArrowRight className="h-4 w-4" /></button>
      <div className="mt-7 rounded-2xl border border-[#dce9df] bg-[#f5fbf7] p-4 text-sm leading-6 text-[#607568]"><p className="font-semibold text-[#315747]">Belum punya akun?</p><p className="mt-1">Tidak perlu daftar terpisah. Akun Al Madraj dibuat otomatis saat pertama kali masuk dengan Google.</p></div>
      <a href="/" className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-[#62786b]"><ArrowLeft className="h-4 w-4" /> Kembali ke website</a>
    </div></section>
  </main>;
};

const BackendShell = ({ profile, onNavigate, onLogout, onProfileSaved, children }: { profile: Profile | null; onNavigate: (path: string) => void; onLogout: () => void; onProfileSaved?: (profile: Profile) => void; children: React.ReactNode }) => {
  const [sidebarVisible, setSidebarVisible] = useState(() => {
    if (typeof window === 'undefined') return true;
    if (window.innerWidth >= 1024) {
      return window.localStorage.getItem('al-madraj-sidebar-desktop') !== 'hidden';
    }
    return false;
  });
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [shellProfile, setShellProfile] = useState(profile);
  const currentPath = window.location.pathname;

  useEffect(() => {
    if (profile) setShellProfile(profile);
  }, [profile]);

  const effectiveProfile: Profile = shellProfile || {
    id: '',
    full_name: 'Santri Al Madraj',
    whatsapp: '',
    role: 'student',
    avatar_url: '',
  };

  const toggleSidebar = () => {
    const nextVisible = !sidebarVisible;
    setSidebarVisible(nextVisible);
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      window.localStorage.setItem('al-madraj-sidebar-desktop', nextVisible ? 'visible' : 'hidden');
    }
  };

  const handleNavigate = (targetPath: string) => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarVisible(false);
    }
    onNavigate(targetPath);
  };

  return (
    <div className="platform-compact min-h-[100dvh] w-full max-w-full bg-white text-[#17231b]">
      <header className="fixed top-0 left-0 right-0 z-50 h-[64px] border-b border-[#dce9df] bg-white/95 backdrop-blur shadow-xs">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarVisible ? 'Tutup sidebar navigasi' : 'Buka sidebar navigasi'}
              title={sidebarVisible ? 'Tutup sidebar navigasi' : 'Buka sidebar navigasi'}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568] hover:border-[#006d77] hover:text-[#006d77] cursor-pointer"
            >
              <Menu className="h-4 w-4" />
            </button>
            <a href="/" className="flex shrink-0 items-center" title="Al Madraj">
              <img src="/al-madroj-brand.png" alt="Al Madraj" className="h-9 w-auto object-contain shrink-0" />
            </a>
          </div>

          {/* Global Course Search Bar matching reference image */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 min-w-0">
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8aa192]" />
              <input
                type="text"
                placeholder="Cari mata kuliah, kitab turats, atau pengajar..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.currentTarget.value.trim();
                    if (target) onNavigate('/kelas?q=' + encodeURIComponent(target));
                  }
                }}
                className="w-full rounded-full border border-[#d6e7dc] bg-[#f8fbf9] py-2 pl-9 pr-4 text-xs text-[#163528] placeholder-[#8ba294] transition focus:border-[#006d77] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#006d77]/10"
              />
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-semibold text-[#607568] lg:flex">
            {effectiveProfile.role === 'admin' && (
              <button
                onClick={() => onNavigate('/admin')}
                className={'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ' + (currentPath === '/admin' ? 'bg-[#006d77] text-white' : 'bg-[#e5f4f2] text-[#006d77] hover:bg-[#d6f0df]')}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Panel admin
              </button>
            )}
          </nav>
          <div className="flex items-center gap-2.5 shrink-0">
            {effectiveProfile.id && <NotificationMenu userId={effectiveProfile.id} onNavigate={onNavigate} />}
            <button
              type="button"
              onClick={() => setProfileEditorOpen(true)}
              className="flex items-center gap-2 rounded-full p-1 text-left transition hover:bg-[#f2f7f4] cursor-pointer"
              title="Pengaturan profil"
            >
              <UserAvatar
                src={effectiveProfile.avatar_url}
                name={effectiveProfile.full_name}
                size="sm"
                className="ring-1 ring-[#cbe3d3]"
              />
              <span className="hidden max-w-[130px] truncate text-xs font-semibold text-[#17382c] sm:inline">
                {effectiveProfile.full_name?.trim() || 'Pengguna'}
              </span>
            </button>
            <button
              onClick={onLogout}
              aria-label="Keluar"
              title="Keluar"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568] hover:border-[#b36d4c] hover:text-[#b36d4c] transition cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>
      <DashboardSidebar
        open={sidebarVisible}
        profile={effectiveProfile}
        currentPath={currentPath}
        onNavigate={handleNavigate}
        onLogout={onLogout}
        onProfileClick={() => setProfileEditorOpen(true)}
      />
      {sidebarVisible && (
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Tutup sidebar"
          className="fixed inset-0 top-[64px] z-30 bg-[#102c22]/20 lg:hidden"
        />
      )}
      <div
        className={`w-full min-w-0 pt-[64px] transition-[padding] duration-200 ${
          sidebarVisible ? 'lg:pl-[224px]' : 'lg:pl-0'
        }`}
      >
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8 pb-16 pt-6 sm:pt-8 min-w-0">
          <main className="w-full min-w-0">{children}</main>
        </div>
      </div>
      {profileEditorOpen && (
        <ProfileQuickEdit
          profile={effectiveProfile}
          onClose={() => setProfileEditorOpen(false)}
          onSaved={(nextProfile) => {
            setShellProfile(nextProfile);
            onProfileSaved?.(nextProfile);
            setProfileEditorOpen(false);
          }}
        />
      )}
    </div>
  );
};

type UserNotification = { id: string; title: string; body: string; order_id: string | null; read_at: string | null; created_at: string };

const NotificationMenu = ({ userId, onNavigate }: { userId: string; onNavigate: (path: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((item) => !item.read_at).length;

  const load = async () => {
    try {
      const { data } = await requireSupabase()
        .from('notifications')
        .select('id,title,body,order_id,read_at,created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8);
      setNotifications((data || []) as UserNotification[]);
    } catch {}
  };

  useEffect(() => {
    void load();
    const channel = requireSupabase()
      .channel('notifications:' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: 'user_id=eq.' + userId }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void requireSupabase().removeChannel(channel);
    };
  }, [userId]);

  // Click outside & Escape key listeners
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const openMenu = async () => {
    const next = !open;
    setOpen(next);
    if (!next || !unread) return;
    const ids = notifications.filter((item) => !item.read_at).map((item) => item.id);
    try {
      await requireSupabase()
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids);
      setNotifications((items) =>
        items.map((item) => (ids.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item))
      );
    } catch {}
  };

  const markAllRead = async () => {
    const ids = notifications.filter((item) => !item.read_at).map((item) => item.id);
    if (!ids.length) return;
    try {
      await requireSupabase()
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .in('id', ids);
      setNotifications((items) =>
        items.map((item) => (ids.includes(item.id) ? { ...item, read_at: new Date().toISOString() } : item))
      );
    } catch {}
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => void openMenu()}
        aria-label="Notifikasi"
        aria-expanded={open}
        title="Pusat Notifikasi"
        className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition cursor-pointer ${
          open
            ? 'border-[#006d77] bg-[#e5f4f2] text-[#006d77] ring-2 ring-[#006d77]/20 shadow-xs'
            : 'border-[#cfe0d5] text-[#547363] hover:border-[#006d77] hover:bg-[#f3faf6] hover:text-[#006d77]'
        }`}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#c0392b] px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile backdrop overlay for focus and closing */}
          <div
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-label="Notifikasi Akun"
            style={{ backgroundColor: '#ffffff', opacity: 1 }}
            className="notification-dropdown-panel fixed inset-x-3 top-[68px] z-50 mx-auto max-w-[400px] overflow-hidden rounded-[22px] border border-[#d8e6dc] bg-white shadow-[0_22px_60px_-10px_rgba(16,44,34,0.22),0_4px_18px_-4px_rgba(0,0,0,0.06)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[380px] sm:max-w-none"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#edf4ef] bg-[#f8fbf9] px-4.5 py-3.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#e3f2ea] text-[#006d77]">
                <Bell className="h-3.5 w-3.5" />
              </span>
              <p className="text-xs sm:text-sm font-bold text-[#143428]">Notifikasi</p>
              {unread > 0 && (
                <span className="rounded-full bg-[#006d77] px-2 py-0.5 text-[10px] font-bold text-white">
                  {unread} baru
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="text-[11px] font-medium text-[#006d77] hover:underline px-2 py-1 rounded cursor-pointer"
                >
                  Tandai dibaca
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Tutup notifikasi"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#739282] hover:bg-[#eaf3ed] hover:text-[#143428] transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List or Empty State */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-[#edf4ef]">
            {notifications.length ? (
              notifications.map((item) => {
                const isUnread = !item.read_at;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setOpen(false);
                      onNavigate(item.order_id ? '/pembayaran/' + item.order_id : '/transaksi');
                    }}
                    className={`group relative flex w-full items-start gap-3 px-4.5 py-3 text-left transition cursor-pointer ${
                      isUnread ? 'bg-[#f4f9f6] hover:bg-[#eef6f1]' : 'bg-white hover:bg-[#f9fbf9]'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition ${
                        isUnread ? 'bg-[#006d77] text-white' : 'bg-[#eef5f1] text-[#006d77]'
                      }`}
                    >
                      {item.order_id ? <CreditCard className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`truncate text-xs sm:text-[13px] font-bold ${
                            isUnread ? 'text-[#0e3b2e]' : 'text-[#264438]'
                          }`}
                        >
                          {item.title}
                        </span>
                        {isUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-[#006d77]" />}
                      </div>
                      <p className="mt-0.5 text-xs text-[#527061] leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                      <span className="mt-1.5 inline-flex items-center gap-1 text-[10.5px] font-medium text-[#8aa192]">
                        <Clock className="h-3 w-3 text-[#9ab3a4]" />
                        {new Date(item.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-9 px-6 text-center">
                <div className="mx-auto flex h-13 w-13 items-center justify-center rounded-2xl bg-[#eef7f2] text-[#006d77] ring-8 ring-[#f4faf6]">
                  <Bell className="h-6 w-6 text-[#006d77]" />
                </div>
                <p className="mt-3.5 text-sm font-bold text-[#143428]">Belum Ada Notifikasi</p>
                <p className="mt-1 text-xs text-[#6e8a7b] leading-relaxed max-w-[250px] mx-auto">
                  Semua update materi kuliah, jadwal kajian, dan status transaksi akunmu akan muncul di sini.
                </p>
              </div>
            )}
          </div>

          {/* Footer Quick Links */}
          <div className="border-t border-[#edf4ef] bg-[#f8fbf9] px-4.5 py-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate('/transaksi');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#006d77] hover:underline cursor-pointer"
            >
              <span>Riwayat Transaksi</span>
              <ArrowRight className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onNavigate('/belajar');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c7768] hover:text-[#006d77] cursor-pointer"
            >
              <span>Kelas Saya</span>
            </button>
          </div>
        </div>
        </>
      )}
    </div>
  );
};

const IslamicPatternWatermark = ({ className = 'text-white/[0.12]' }: { className?: string }) => (
  <svg
    className={`pointer-events-none absolute -right-6 -top-6 h-48 w-48 ${className}`}
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="0.6"
    aria-hidden="true"
  >
    <circle cx="50" cy="50" r="46" strokeDasharray="1.5 2.5" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(0 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(45 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(22.5 50 50)" />
    <rect x="22" y="22" width="56" height="56" transform="rotate(67.5 50 50)" />
    <circle cx="50" cy="50" r="28" />
    <circle cx="50" cy="50" r="14" strokeDasharray="1 2" />
    <circle cx="50" cy="50" r="3" fill="currentColor" />
  </svg>
);

const getFacultyVisual = (faculty: string) => {
  const norm = (faculty || '').toLowerCase();
  if (norm.includes('syariah')) {
    return {
      bannerGradient: 'from-[#00383d] via-[#00545d] to-[#00262a]',
      gradient: 'from-[#00353a] via-[#005862] to-[#002428]',
      cardGradient: 'from-[#002b2f] via-[#00474e] to-[#001f22]',
      dot: 'bg-[#83c5be]',
      dotPing: 'bg-[#83c5be]/40',
      borderHover: 'hover:border-[#83c5be]',
      glow: 'rgba(131, 197, 190, 0.2)',
      badge: 'bg-[#e5f4f2] text-[#006d77] border-[#83c5be]/60',
      lightBg: 'bg-[#f4faf8]',
      accentText: 'text-[#006d77]',
      facultyName: 'Fakultas Syariah Islamiyyah',
      shortName: 'Syariah',
      avatarBg: 'bg-gradient-to-tr from-[#006d77] to-[#83c5be]',
    };
  }
  if (norm.includes('ushuluddin')) {
    return {
      bannerGradient: 'from-[#073646] via-[#0c4e65] to-[#052733]',
      gradient: 'from-[#0a3547] via-[#0f4d66] to-[#072836]',
      cardGradient: 'from-[#072d3e] via-[#0b425b] to-[#05202c]',
      dot: 'bg-[#0ea5e9]',
      dotPing: 'bg-[#0ea5e9]/40',
      borderHover: 'hover:border-[#0ea5e9]',
      glow: 'rgba(14, 165, 233, 0.18)',
      badge: 'bg-[#eaf4fb] text-[#0369a1] border-[#bae6fd]',
      lightBg: 'bg-[#f3f9fd]',
      accentText: 'text-[#0284c7]',
      facultyName: 'Fakultas Ushuluddin',
      shortName: 'Ushuluddin',
      avatarBg: 'bg-gradient-to-tr from-[#0369a1] to-[#38bdf8]',
    };
  }
  if (norm.includes('lughah') || norm.includes('bahasa')) {
    return {
      bannerGradient: 'from-[#193b2a] via-[#225039] to-[#132d20]',
      gradient: 'from-[#1e3b2b] via-[#2d523e] to-[#162c20]',
      cardGradient: 'from-[#1a3225] via-[#244532] to-[#13241a]',
      dot: 'bg-[#84cc16]',
      dotPing: 'bg-[#84cc16]/40',
      borderHover: 'hover:border-[#84cc16]',
      glow: 'rgba(132, 204, 22, 0.18)',
      badge: 'bg-[#f4f9eb] text-[#4d7c0f] border-[#d9f99d]',
      lightBg: 'bg-[#f9fcf5]',
      accentText: 'text-[#65a30d]',
      facultyName: 'Fakultas Lughah Arabiyyah',
      shortName: 'Lughah Arabiyyah',
      avatarBg: 'bg-gradient-to-tr from-[#4d7c0f] to-[#a3e635]',
    };
  }
  return {
    bannerGradient: 'from-[#07473b] via-[#095445] to-[#06382e]',
    gradient: 'from-[#094236] via-[#0d594a] to-[#063128]',
    cardGradient: 'from-[#07332a] via-[#0a473b] to-[#04241d]',
    dot: 'bg-[#10b981]',
    dotPing: 'bg-[#10b981]/40',
    borderHover: 'hover:border-[#059669]',
    glow: 'rgba(16, 185, 129, 0.18)',
    badge: 'bg-[#eaf7ee] text-[#006d77] border-[#b9e3cb]',
    lightBg: 'bg-[#f4fbf7]',
    accentText: 'text-[#006d77]',
    facultyName: faculty || 'Program Umum Al Madraj',
    shortName: 'Dirasat Islamiyyah',
    avatarBg: 'bg-gradient-to-tr from-[#006d77] to-[#10b981]',
  };
};

const DashboardRoute = ({
  user,
  profile,
  onNavigate,
  onLogout,
  onProfileSaved,
}: {
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> };
  profile: Profile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  onProfileSaved?: (profile: Profile) => void;
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressRows, setProgressRows] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [cardIndex, setCardIndex] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState('');
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [showSyahadahModal, setShowSyahadahModal] = useState(false);
  const [showPanduanModal, setShowPanduanModal] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setAvatarUploadError('Pilih file gambar untuk foto profil.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarUploadError('Ukuran foto maksimal 5 MB.');
      return;
    }
    setUploadingAvatar(true);
    setAvatarUploadError('');
    try {
      const compressed = await compressAvatar(file);
      const previewUrl = URL.createObjectURL(compressed);
      setLocalAvatarUrl(previewUrl);

      const sb = requireSupabase();
      const avatarPath = `${user.id}/avatar.jpg`;
      const upload = await sb.storage.from('profile-avatars').upload(avatarPath, compressed, {
        upsert: true,
        contentType: 'image/jpeg',
        cacheControl: '3600',
      });
      if (upload.error) throw new Error(upload.error.message);

      const signed = await sb.storage.from('profile-avatars').createSignedUrl(avatarPath, 3600);
      if (signed.error) throw new Error(signed.error.message);
      const savedAvatarUrl = signed.data.signedUrl;

      const profileResult = await sb.from('profiles').update({
        avatar_path: avatarPath,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
      if (profileResult.error) throw new Error(profileResult.error.message);

      if (profile) {
        onProfileSaved?.({
          ...profile,
          avatar_path: avatarPath,
          avatar_url: savedAvatarUrl,
        });
      }
    } catch (err) {
      setAvatarUploadError(err instanceof Error ? err.message : 'Foto profil gagal diunggah.');
      setLocalAvatarUrl(null);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const load = async () => {
      const sb = requireSupabase();
      const [courseResult, enrollmentResult, lessonResult, progressResult] = await Promise.all([
        sb.from('courses').select('*').eq('is_published', true).order('created_at'),
        sb.from('enrollments').select('id,course_id,status,course:courses(*)').eq('user_id', user.id).order('created_at', { ascending: false }),
        sb.from('lessons').select('id,course_id,title,content_type,duration,sort_order').eq('is_published', true).order('sort_order'),
        sb.from('lesson_progress').select('lesson_id,completed_at,watched_seconds,duration_seconds,last_watched_at').eq('user_id', user.id),
      ]);

      const rawCourses: Course[] = (courseResult.data || []).map((c: Course) => ({
        ...c,
        tutor: getCourseTutorName(c.slug, c.tutor),
      }));
      const rawLessons: Lesson[] = lessonResult.data || [];
      const hydratedLessons: Lesson[] = [...rawLessons];

      rawCourses.forEach((c) => {
        const hasLessons = rawLessons.some((l) => l.course_id === c.id);
        if (!hasLessons) {
          const detail = getCourseDetail(c.slug);
          if (detail?.lessons?.length) {
            detail.lessons.forEach((item, idx) => {
              hydratedLessons.push({
                id: `${c.id}-lesson-${idx + 1}`,
                course_id: c.id,
                title: item.title,
                content_type: 'video',
                duration: item.duration || 'Video Kajian',
                sort_order: item.sortOrder || idx + 1,
              } as Lesson);
            });
          }
        }
      });

      if (!courseResult.error) setCourses(rawCourses);
      if (!enrollmentResult.error) {
        setEnrollments(
          (enrollmentResult.data || []).map((item: any) => {
            const rawC = Array.isArray(item.course) ? item.course[0] : item.course;
            return {
              ...item,
              course: rawC ? { ...rawC, tutor: getCourseTutorName(rawC.slug, rawC.tutor) } : rawC,
            };
          })
        );
      }
      setLessons(hydratedLessons);

      if (!progressResult.error && progressResult.data) {
        setProgressRows(progressResult.data as LessonProgress[]);
      } else {
        const fallbackProg = await sb.from('lesson_progress').select('lesson_id,completed_at').eq('user_id', user.id);
        setProgressRows(
          (fallbackProg.data || []).map((r: any) => ({
            lesson_id: r.lesson_id,
            completed_at: r.completed_at,
            watched_seconds: 0,
            duration_seconds: 0,
            last_watched_at: null,
          }))
        );
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user.id]);

  const activeEnrollments = enrollments.filter((item) => item.status === 'active' && item.course);
  const activeCourse = activeEnrollments[0]?.course || null;
  const enrolledCourseIds = useMemo(() => new Set(activeEnrollments.map((e) => e.course_id)), [activeEnrollments]);

  const formatName = (str: string) =>
    str
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

  const metadataName = (typeof user.user_metadata?.full_name === 'string' && user.user_metadata.full_name.trim())
    || (typeof user.user_metadata?.name === 'string' && user.user_metadata.name.trim())
    || '';
  const emailName = user.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ').trim() : '';
  const rawAccountName = (profile?.full_name && profile.full_name.trim())
    || metadataName
    || emailName
    || 'Pengguna';

  const greetingName = formatName(rawAccountName);
  const userFirstName = greetingName.split(/\s+/)[0] || greetingName;

  const todayFormatted = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date());
    } catch {
      return 'Senin, 14 September 2026';
    }
  }, []);

  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      return {
        arabic: 'صَبَاحُ الخَيْرِ وَالبَرَكَة',
        title: `Shabahul Khair, ${userFirstName}!`,
        sub: 'Awali pagi dengan tilawah dan mudzakarah ilmu yang penuh berkah.',
      };
    } else if (hour >= 11 && hour < 15) {
      return {
        arabic: 'أَهْلاً وَسَهْلاً بِكَ فِي مَجْلِسِ العِلْم',
        title: `Ahlan wa Sahlan, ${userFirstName}!`,
        sub: 'Semoga Allah melapangkan dada dan memudahkan pemahamanmu dalam talaqqi.',
      };
    } else if (hour >= 15 && hour < 18) {
      return {
        arabic: 'مَسَاءُ النُّورِ وَالسُّرُور',
        title: `Masa'un Nur, ${userFirstName}!`,
        sub: 'Manfaatkan waktu luang sore hari untuk mengulang materi muqarrar.',
      };
    } else {
      return {
        arabic: 'مَسَاءُ الخَيْرِ وَالتَّوْفِيق',
        title: `Masa'ul Khair, ${userFirstName}!`,
        sub: 'Mudzakarah di waktu hening adalah tradisi thalabul \'ilmi para ulama.',
      };
    }
  }, [userFirstName]);

  // Lessons belonging strictly to the user's enrolled courses
  const enrolledLessons = useMemo(() => {
    return lessons.filter((l) => enrolledCourseIds.has(l.course_id));
  }, [lessons, enrolledCourseIds]);

  const completedLessonIds = useMemo(() => {
    return new Set(progressRows.filter((r) => Boolean(r.completed_at)).map((r) => r.lesson_id));
  }, [progressRows]);

  const completedEnrolledLessons = useMemo(() => {
    return enrolledLessons.filter((l) => completedLessonIds.has(l.id));
  }, [enrolledLessons, completedLessonIds]);

  // Overall progress percentage for circular gauge (100% real: 0% if no completions, never fake 32%)
  const overallPercent = useMemo(() => {
    if (enrolledLessons.length === 0) return 0;
    return Math.min(100, Math.round((completedEnrolledLessons.length / enrolledLessons.length) * 100));
  }, [enrolledLessons.length, completedEnrolledLessons.length]);

  // Faculty progress counts (based on real hydrated lessons)
  const getFacultyStats = (facultySubstr: string) => {
    const facCourses = courses.filter((c) => c.faculty?.toLowerCase().includes(facultySubstr));
    const facCourseIds = new Set(facCourses.map((c) => c.id));
    const facLessons = lessons.filter((l) => facCourseIds.has(l.course_id));
    const userFacLessons = facLessons.filter((l) => enrolledCourseIds.has(l.course_id));
    const targetLessons = userFacLessons.length > 0 ? userFacLessons : facLessons;
    const completed = targetLessons.filter((l) => completedLessonIds.has(l.id)).length;
    const total = targetLessons.length;
    const isEnrolled = userFacLessons.length > 0;
    return { completed, total, isEnrolled };
  };

  const syariahStats = useMemo(() => getFacultyStats('syariah'), [courses, lessons, enrolledCourseIds, completedLessonIds]);
  const ushuluddinStats = useMemo(() => getFacultyStats('ushuluddin'), [courses, lessons, enrolledCourseIds, completedLessonIds]);
  const lughahStats = useMemo(() => getFacultyStats('lughah'), [courses, lessons, enrolledCourseIds, completedLessonIds]);

  // Build Continue Learning cards list (real data only, no dummy fallback)
  const continueCards = useMemo(() => {
    const active = enrollments.filter((e) => e.status === 'active' && e.course);
    const activeCourseIds = new Set(active.map((e) => e.course_id));
    const others = courses.filter((c) => !activeCourseIds.has(c.id));

    const list = [
      ...active.map((e) => {
        const cLessons = lessons.filter((l) => l.course_id === e.course_id);
        const done = cLessons.filter((l) => completedLessonIds.has(l.id)).length;
        const pct = cLessons.length ? Math.round((done / cLessons.length) * 100) : 0;
        return {
          id: e.course.id,
          slug: e.course.slug,
          title: e.course.title,
          faculty: e.course.faculty,
          tutor: getCourseTutorName(e.course.slug, e.course.tutor),
          isEnrolled: true,
          progress: pct,
          completedCount: done,
          totalCount: cLessons.length,
        };
      }),
      ...others.map((c) => {
        const cLessons = lessons.filter((l) => l.course_id === c.id);
        return {
          id: c.id,
          slug: c.slug,
          title: c.title,
          faculty: c.faculty,
          tutor: getCourseTutorName(c.slug, c.tutor),
          isEnrolled: false,
          progress: 0,
          completedCount: 0,
          totalCount: cLessons.length,
        };
      }),
    ];

    return list;
  }, [enrollments, courses, lessons, completedLessonIds]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const pageSize = isMobile ? 4 : 3;
  const visibleCards = continueCards.slice(cardIndex, cardIndex + pageSize);

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Recent Lessons table rows (100% real based on actual lesson progress & enrolled curriculum)
  const recentLessonRows = useMemo(() => {
    const progressWithLesson = progressRows
      .map((p) => {
        const lesson = lessons.find((l) => l.id === p.lesson_id);
        const course = lesson ? courses.find((c) => c.id === lesson.course_id) : null;
        return { p, lesson, course };
      })
      .filter((item): item is { p: LessonProgress; lesson: Lesson; course: Course } => Boolean(item.lesson && item.course));

    if (progressWithLesson.length > 0) {
      progressWithLesson.sort((a, b) => {
        const timeA = new Date(a.p.last_watched_at || a.p.completed_at || 0).getTime();
        const timeB = new Date(b.p.last_watched_at || b.p.completed_at || 0).getTime();
        return timeB - timeA;
      });

      return progressWithLesson.slice(0, 5).map(({ p, lesson, course }) => {
        const isDone = Boolean(p.completed_at);
        const vis = getFacultyVisual(course.faculty);
        const dateStr = p.last_watched_at || p.completed_at
          ? new Date(p.last_watched_at || p.completed_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'Baru saja';
        return {
          id: lesson.id,
          tutor: getCourseTutorName(course.slug, course.tutor),
          date: dateStr,
          faculty: vis.shortName,
          facultyColor: vis.badge,
          title: lesson.title,
          slug: course.slug,
          status: isDone ? 'Selesai' : 'Lanjutkan',
        };
      });
    }

    if (enrolledLessons.length > 0) {
      return enrolledLessons.slice(0, 4).map((lesson) => {
        const course = courses.find((c) => c.id === lesson.course_id);
        const vis = getFacultyVisual(course?.faculty || '');
        return {
          id: lesson.id,
          tutor: getCourseTutorName(course?.slug, course?.tutor),
          date: 'Tersedia',
          faculty: vis.shortName,
          facultyColor: vis.badge,
          title: lesson.title,
          slug: course?.slug || '',
          status: 'Mulai',
        };
      });
    }

    return lessons.slice(0, 4).map((lesson) => {
      const course = courses.find((c) => c.id === lesson.course_id);
      const vis = getFacultyVisual(course?.faculty || '');
      return {
        id: lesson.id,
        tutor: getCourseTutorName(course?.slug, course?.tutor),
        date: 'Pratinjau',
        faculty: vis.shortName,
        facultyColor: vis.badge,
        title: lesson.title,
        slug: course?.slug || '',
        status: 'Pelajari',
      };
    });
  }, [progressRows, lessons, courses, enrolledLessons]);

  // Real Learning Activity calculation (grouped by last 4 week intervals)
  const activityStats = useMemo(() => {
    const totalSeconds = progressRows.reduce((sum, r) => sum + (Number(r.watched_seconds) || 0), 0);
    const totalMinutes = Math.round(totalSeconds / 60);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekBuckets = [
      { label: '3 Mgg Lalu', start: now - 28 * dayMs, end: now - 21 * dayMs, minutes: 0 },
      { label: '2 Mgg Lalu', start: now - 21 * dayMs, end: now - 14 * dayMs, minutes: 0 },
      { label: 'Mgg Lalu', start: now - 14 * dayMs, end: now - 7 * dayMs, minutes: 0 },
      { label: 'Minggu Ini', start: now - 7 * dayMs, end: now + dayMs, minutes: 0 },
    ];

    progressRows.forEach((r) => {
      const watchedSec = Number(r.watched_seconds) || 0;
      if (watchedSec <= 0) return;
      const watchedTime = new Date(r.last_watched_at || r.completed_at || 0).getTime();
      const mins = Math.round(watchedSec / 60);
      let placed = false;
      for (const bucket of weekBuckets) {
        if (watchedTime >= bucket.start && watchedTime < bucket.end) {
          bucket.minutes += mins;
          placed = true;
          break;
        }
      }
      if (!placed) {
        weekBuckets[3].minutes += mins;
      }
    });

    const maxMinutes = Math.max(...weekBuckets.map((b) => b.minutes), 60);

    return {
      totalMinutes,
      weekBuckets,
      maxMinutes,
    };
  }, [progressRows]);

  // Dynamic Asatidz Pembimbing list from actual courses
  const asatidzList = useMemo(() => {
    const list: { name: string; role: string; avatarLetter: string; slug: string }[] = [];
    const seenTutors = new Set<string>();
    courses.forEach((c) => {
      const tutor = getCourseTutorName(c.slug, c.tutor);
      if (!seenTutors.has(tutor) && tutor !== 'Asatidz Al-Azhar') {
        seenTutors.add(tutor);
        const role = c.faculty ? `Kulliyyah ${c.faculty}` : 'Pengampu Al-Azhar';
        const cleanLetter = tutor.replace(/^(Ust\.|Ustadz\.|Ustaz\.|Dr\.|Syaikh)\s+/i, '').charAt(0) || 'U';
        list.push({
          name: tutor,
          role,
          avatarLetter: cleanLetter,
          slug: c.slug,
        });
      }
    });
    return list.slice(0, 3);
  }, [courses]);

  // Compute the last studied course & lesson for resume learning ("mulai lagi dari yang terakhir kali")
  const lastStudied = useMemo(() => {
    // 1. Check watch history in progressRows
    const progressWithLesson = progressRows
      .map((p) => {
        const lesson = lessons.find((l) => l.id === p.lesson_id);
        const course = lesson ? courses.find((c) => c.id === lesson.course_id) : null;
        return { p, lesson, course };
      })
      .filter((item): item is { p: LessonProgress; lesson: Lesson; course: Course } => Boolean(item.lesson && item.course));

    if (progressWithLesson.length > 0) {
      progressWithLesson.sort((a, b) => {
        const timeA = new Date(a.p.last_watched_at || a.p.completed_at || 0).getTime();
        const timeB = new Date(b.p.last_watched_at || b.p.completed_at || 0).getTime();
        return timeB - timeA;
      });

      const top = progressWithLesson[0];
      const courseLessons = lessons
        .filter((l) => l.course_id === top.course.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const lessonIndex = courseLessons.findIndex((l) => l.id === top.lesson.id);
      const completedCount = courseLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const isKhatam = courseLessons.length > 0 && completedCount >= courseLessons.length;
      const progressPct = isKhatam ? 100 : (courseLessons.length ? Math.round((completedCount / courseLessons.length) * 100) : 0);

      // If khatam, target lesson defaults to first lesson for muraja'ah; otherwise advance to next lesson if current is complete
      let targetLesson = top.lesson;
      let targetLessonIndex = lessonIndex;
      if (isKhatam && courseLessons.length > 0) {
        targetLesson = courseLessons[0];
        targetLessonIndex = 0;
      } else if (top.p.completed_at && lessonIndex >= 0 && lessonIndex < courseLessons.length - 1) {
        targetLesson = courseLessons[lessonIndex + 1];
        targetLessonIndex = lessonIndex + 1;
      }

      return {
        course: top.course,
        lesson: targetLesson,
        lessonNumber: targetLessonIndex >= 0 ? targetLessonIndex + 1 : 1,
        totalLessons: courseLessons.length,
        progressPct,
        completedCount,
        hasHistory: true,
        isKhatam,
        actionUrl: `/belajar/${top.course.slug}?lesson=${targetLesson.id}`,
      };
    }

    // 2. If enrolled in a course but no watch history yet
    if (activeCourse) {
      const courseLessons = lessons
        .filter((l) => l.course_id === activeCourse.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      const firstLesson = courseLessons[0] || null;
      const completedCount = courseLessons.filter((l) => completedLessonIds.has(l.id)).length;
      const isKhatam = courseLessons.length > 0 && completedCount >= courseLessons.length;
      return {
        course: activeCourse,
        lesson: firstLesson,
        lessonNumber: 1,
        totalLessons: courseLessons.length,
        progressPct: isKhatam ? 100 : (courseLessons.length ? Math.round((completedCount / courseLessons.length) * 100) : 0),
        completedCount,
        hasHistory: false,
        isKhatam,
        actionUrl: firstLesson ? `/belajar/${activeCourse.slug}?lesson=${firstLesson.id}` : `/belajar/${activeCourse.slug}`,
      };
    }

    // 3. If not enrolled, show first catalog course
    const firstCourse = courses[0] || null;
    if (firstCourse) {
      const courseLessons = lessons
        .filter((l) => l.course_id === firstCourse.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      return {
        course: firstCourse,
        lesson: courseLessons[0] || null,
        lessonNumber: 1,
        totalLessons: courseLessons.length,
        progressPct: 0,
        completedCount: 0,
        hasHistory: false,
        isKhatam: false,
        actionUrl: `/kelas/${firstCourse.slug}`,
      };
    }

    return null;
  }, [progressRows, lessons, courses, completedLessonIds, activeCourse]);

  const avatarLetter = (greetingName || 'U').charAt(0).toUpperCase();
  const googleAvatar = typeof user.user_metadata?.avatar_url === 'string'
    ? user.user_metadata.avatar_url
    : typeof user.user_metadata?.picture === 'string'
    ? user.user_metadata.picture
    : '';
  const displayedAvatar = localAvatarUrl || profile?.avatar_url || googleAvatar || '';

  // Gamified Student Level / Rank Tier
  const studentTier = useMemo(() => {
    if (overallPercent >= 100) {
      return {
        level: 4,
        title: 'Munahi (Khatam)',
        arabic: 'المُنْتَهِي',
        nextTarget: 'Mumtaz! Khatam Muqarrar',
        badgeBg: 'bg-[#006d77]',
        badgeText: 'text-[#83c5be]',
      };
    }
    if (overallPercent >= 50) {
      return {
        level: 3,
        title: 'Mutaqaddim (Lanjut)',
        arabic: 'المُتَقَدِّم',
        nextTarget: 'Menuju Khatam Muqarrar',
        badgeBg: 'bg-[#006d77]',
        badgeText: 'text-[#83c5be]',
      };
    }
    if (overallPercent >= 20) {
      return {
        level: 2,
        title: 'Mutawassith (Menengah)',
        arabic: 'المُتَوَسِّط',
        nextTarget: 'Menuju Tingkat Lanjut',
        badgeBg: 'bg-[#006d77]',
        badgeText: 'text-[#83c5be]',
      };
    }
    return {
      level: 1,
      title: "Mubtadi' (Penuntut Awal)",
      arabic: 'المُبْتَدِئ',
      nextTarget: 'Menuju Tingkat Menengah',
      badgeBg: 'bg-[#006d77]',
      badgeText: 'text-[#83c5be]',
    };
  }, [overallPercent]);

  // SVG Gauge calculations
  const gaugeRadius = 54;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeOffset = gaugeCircumference - (gaugeCircumference * overallPercent) / 100;

  return (
    <div className="space-y-6 pb-12">
      {/* 2-Column Responsive Layout matching reference screenshot */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Left Column (Main, ~8 cols) */}
        <div className="space-y-6 xl:col-span-8">
          
          {/* 1. Hero Feature Banner - Modern Luminous Scholarly Welcome */}
          <section className="@container relative overflow-hidden rounded-[28px] bg-white p-5 sm:p-7 xl:p-8 border border-[#e2ece5] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.04)]">
            {/* Subtle Tonal Radial Glows */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#006d77]/[0.03] blur-3xl" />
            <div className="pointer-events-none absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-[#83c5be]/20 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 @[720px]:flex-row @[720px]:items-center">
              {/* Left Column: Scholarly Welcome & Primary CTAs */}
              <div className="flex-1 min-w-0 space-y-3.5">
                {/* Single Precision Header Bar: Sejajar & Presisi */}
                <div className="flex items-center justify-between gap-2.5 border-b border-[#f0f5f1] pb-3">
                  <div className="flex items-center gap-2 text-xs min-w-0">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[#006d77] bg-[#e5f4f2] border border-[#a5d8d2] px-2.5 py-0.5 rounded-full text-[11px] shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#006d77] animate-pulse" />
                      Ruang Mahasiswa
                    </span>
                    <span className="text-[#cbd8d0] hidden md:inline">•</span>
                    <span className="font-medium text-[#607568] hidden md:inline truncate">{todayFormatted}</span>
                    <span className="text-[#cbd8d0] hidden sm:inline">•</span>
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-[#006d77] shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#006d77]" />
                      <span>Terverifikasi</span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f7f4] border border-[#bfe3df] px-3 py-0.5 text-xs font-serif font-bold text-[#00565e] shrink-0" dir="rtl">
                    <Sparkles className="h-3 w-3 text-[#006d77] shrink-0" />
                    <span>{timeGreeting.arabic}</span>
                  </div>
                </div>

                {/* Main Headline */}
                <h1 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold tracking-tight text-[#17382c] leading-tight pt-0.5">
                  {timeGreeting.title}
                </h1>

                {/* Body Text */}
                <p className="text-sm leading-relaxed text-[#52605a]">
                  {lastStudied?.isKhatam ? (
                    <span>
                      Maa syaa Allah, tabarakallah! Kamu telah mengkhatamkan muqarrar{' '}
                      <strong className="font-semibold text-[#006d77]">"{lastStudied.course.title}"</strong>. Terus jaga mutqin-mu dengan muraja'ah berkala atau ambil muqarrar baru di katalog.
                    </span>
                  ) : activeCourse ? (
                    <span>
                      Selamat datang kembali di majelis ilmu. Kamu sedang menempuh materi{' '}
                      <strong className="font-semibold text-[#17382c]">"{activeCourse.title}"</strong>. Mari lanjutkan talaqqi dan selesaikan bab berikutnya hari ini.
                    </span>
                  ) : (
                    <span>
                      {timeGreeting.sub} Selamat datang di majelis ilmu Al Madraj, mari perdalam muqarrar turats bersama para asatidz Al-Azhar.
                    </span>
                  )}
                </p>

                {/* Action Buttons: Clean Non-Duplicated CTAs */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1.5">
                  <button
                    onClick={() => onNavigate('/kelas')}
                    className="inline-flex items-center gap-2 h-10 sm:h-11 rounded-full bg-[#006d77] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#00565e] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                  >
                    <BookOpen className="h-4 w-4 text-[#83c5be]" />
                    <span>Katalog Kelas</span>
                  </button>
                  <button
                    onClick={() => setShowPanduanModal(true)}
                    className="inline-flex items-center gap-2 h-10 sm:h-11 rounded-full border border-[#cfe0d5] bg-white px-5 text-xs sm:text-sm font-semibold text-[#17382c] hover:bg-[#f6fbf8] hover:border-[#9dc5ad] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                  >
                    <Compass className="h-4 w-4 text-[#006d77]" />
                    <span>Panduan Belajar</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Interactive Profile & Active Course Card */}
              <div className="w-full @[720px]:w-[300px] min-[1380px]:w-[340px] shrink-0">
                <div className="group relative overflow-hidden rounded-[24px] border-2 border-[#83c5be]/50 bg-gradient-to-br from-white via-[#f7fcfb] to-[#edf7f5] p-4 sm:p-5 shadow-[0_8px_24px_-6px_rgba(0,109,119,0.08)] backdrop-blur-sm transition-all duration-300 hover:border-[#006d77]/60 hover:shadow-[0_12px_32px_-6px_rgba(0,109,119,0.16)]">
                  {/* Atmospheric Glow & Watermark Award Badge */}
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#83c5be]/25 blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-[#006d77]/[0.05] blur-xl" />
                  <Award className="pointer-events-none absolute -bottom-3 -right-3 h-24 w-24 text-[#006d77]/[0.04] rotate-12 transition-transform duration-500 group-hover:scale-110" />

                  {/* Hidden File Input for Avatar Upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />

                  {/* Card Header: Profile Photo with Upload Trigger + Name & Tier */}
                  <div className="relative z-10 flex items-center gap-3">
                    {/* Avatar Container with Camera Trigger */}
                    <div className="relative shrink-0">
                      <div
                        onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                        className="group/avatar relative h-14 w-14 sm:h-15 sm:w-15 cursor-pointer overflow-hidden rounded-full border-2 border-[#83c5be] bg-[#e5f4f2] shadow-xs transition-all hover:border-[#006d77] hover:scale-105"
                        title="Klik untuk ubah foto profil"
                      >
                        <UserAvatar
                          src={displayedAvatar}
                          name={greetingName}
                          size="custom"
                          className="h-full w-full"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover/avatar:opacity-100">
                          <Camera className="h-3.5 w-3.5 text-white drop-shadow" />
                        </div>

                        {/* Loading Spinner during Upload */}
                        {uploadingAvatar && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-xs">
                            <RefreshCw className="h-4 w-4 animate-spin text-[#006d77]" />
                          </div>
                        )}
                      </div>

                      {/* Camera Badge Trigger */}
                      <button
                        type="button"
                        onClick={() => !uploadingAvatar && fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        title="Ubah foto profil"
                        aria-label="Ubah foto profil"
                        className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-white bg-[#006d77] text-white shadow-xs transition hover:bg-[#00565e] active:scale-95 cursor-pointer disabled:opacity-50"
                      >
                        <Camera className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    {/* Student Info & Level Badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#006d77] px-2 py-0.5 text-[10px] font-black tracking-wider text-white shadow-2xs">
                          <Sparkles className="h-2.5 w-2.5 text-[#83c5be] animate-pulse" />
                          LEVEL {studentTier.level}
                        </span>
                        {lastStudied?.isKhatam ? (
                          <span className="rounded-full border border-[#83c5be] bg-[#006d77] px-1.5 py-0.5 text-[9.5px] font-black text-[#83c5be]">
                            KHATAM
                          </span>
                        ) : (
                          <span className="rounded-full border border-[#83c5be]/50 bg-white/90 px-1.5 py-0.5 text-[9.5px] font-bold text-[#006d77]">
                            {studentTier.arabic}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1 truncate text-xs sm:text-sm font-bold text-[#17382c]" title={greetingName}>
                        {greetingName}
                      </h4>
                      <p className="truncate text-[10.5px] font-medium text-[#607568]">
                        {studentTier.title}
                      </p>
                    </div>
                  </div>

                  {/* Upload Error Alert if any */}
                  {avatarUploadError && (
                    <div className="relative z-10 mt-2 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] text-red-700">
                      <span className="truncate">{avatarUploadError}</span>
                      <button onClick={() => setAvatarUploadError('')} className="ml-1 font-bold hover:underline">✕</button>
                    </div>
                  )}

                  {/* Active Course Info Section ("Informasi Kelas yang Sedang Dipelajari") */}
                  <div className="relative z-10 mt-3 rounded-xl border border-[#83c5be]/35 bg-white/90 p-3 shadow-2xs">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold uppercase tracking-wider text-[#63796d]">
                      <span className="flex items-center gap-1">
                        {lastStudied?.isKhatam ? (
                          <span className="inline-flex items-center gap-1 font-black text-[#006d77]">
                            <GraduationCap className="h-3.5 w-3.5 text-[#006d77]" />
                            <span>Khatam Muqarrar</span>
                          </span>
                        ) : (
                          <>
                            <BookOpen className="h-3 w-3 text-[#006d77]" />
                            <span>Sedang Dipelajari</span>
                          </>
                        )}
                      </span>
                      {lastStudied?.isKhatam ? (
                        <span className="rounded-full border border-[#83c5be] bg-[#006d77] px-2 py-0.5 text-[9px] font-extrabold text-[#83c5be] shadow-2xs">
                          Mumtaz 100%
                        </span>
                      ) : lastStudied?.course.faculty ? (
                        <span className="rounded-md border border-[#83c5be]/40 bg-[#e5f4f2] px-1.5 py-0.5 text-[9px] font-bold text-[#006d77]">
                          {getFacultyVisual(lastStudied.course.faculty).shortName}
                        </span>
                      ) : null}
                    </div>

                    {lastStudied ? (
                      <div className="mt-2 space-y-2">
                        <div>
                          <h5 className="truncate text-xs font-bold text-[#17382c]" title={lastStudied.course.title}>
                            {lastStudied.course.title}
                          </h5>
                          <p className="mt-0.5 truncate text-[10.5px] text-[#607568]">
                            {lastStudied.course.tutor}
                          </p>
                        </div>

                        {/* Current / Last Lesson Badge or Khatam Celebration Box */}
                        {lastStudied.isKhatam ? (
                          <div className="flex items-center gap-2 rounded-lg border border-[#83c5be]/50 bg-gradient-to-r from-[#e5f4f2] to-[#edf7f5] px-2.5 py-2 shadow-2xs">
                            <div className="grid h-7 w-7 place-items-center rounded-md bg-[#006d77] text-[#83c5be] shrink-0 shadow-xs">
                              <Award className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9.5px] font-extrabold text-[#006d77]">
                                  Alhamdulillah! Khatam
                                </span>
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-[#006d77] px-1.5 py-0.2 text-[8.5px] font-bold text-white">
                                  <Check className="h-2.5 w-2.5" /> 100%
                                </span>
                              </div>
                              <p className="truncate text-[10.5px] font-medium text-[#2d4a3e]" title="Semua dars tuntas dipelajari">
                                Semua {lastStudied.totalLessons} dars tuntas dipelajari
                              </p>
                            </div>
                          </div>
                        ) : lastStudied.lesson ? (
                          <div className="flex items-center gap-2 rounded-lg border border-[#83c5be]/30 bg-[#f5faf8] px-2 py-1.5">
                            <div className="grid h-6 w-6 place-items-center rounded-md bg-[#006d77] text-white shrink-0">
                              <CirclePlay className="h-3 w-3 text-[#83c5be]" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9.5px] font-bold text-[#006d77]">
                                  Dars {lastStudied.lessonNumber} dari {lastStudied.totalLessons}
                                </span>
                                <span className="text-[9.5px] font-bold text-[#17382c]">
                                  {lastStudied.progressPct}%
                                </span>
                              </div>
                              <p className="truncate text-[10.5px] font-medium text-[#2d4a3e]" title={lastStudied.lesson.title}>
                                {lastStudied.lesson.title}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {/* Progress Bar */}
                        <div className="space-y-1">
                          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#e1eee8]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#006d77] to-[#83c5be] transition-all duration-700 ease-out"
                              style={{ width: `${Math.max(lastStudied.progressPct, 4)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 py-2 text-center text-[11px] text-[#71877c]">
                        Belum ada kelas yang diikuti.
                      </div>
                    )}
                  </div>

                  {/* Resume / Start Learning Action Button ("Mulai lagi dari yang terakhir kali" / "Khatam Muraja'ah") */}
                  <div className="relative z-10 mt-2.5 space-y-2">
                    {lastStudied?.isKhatam ? (
                      <>
                        <button
                          onClick={() => onNavigate(lastStudied.actionUrl)}
                          className="group relative flex w-full items-center justify-between gap-2 rounded-xl bg-[#006d77] px-3.5 py-2.5 text-left text-white shadow-xs transition-all duration-200 hover:bg-[#00565e] hover:shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 text-[#83c5be] shrink-0 transition-transform group-hover:rotate-180 duration-500">
                              <RotateCcw className="h-3 w-3" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-[9.5px] font-bold text-[#83c5be] uppercase tracking-wider">
                                🎓 Khatam! Ulangi Materi / Muraja'ah
                              </p>
                              <p className="truncate text-xs font-bold text-white">
                                Muraja'ah Muqarrar dari Dars 1
                              </p>
                            </div>
                          </div>
                          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-white shrink-0 transition-transform group-hover:translate-x-0.5">
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowSyahadahModal(true)}
                          className="group flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#006d77] bg-[#f0f7f4] py-2 text-xs font-bold text-[#006d77] shadow-2xs hover:bg-[#e0f1ec] transition-colors cursor-pointer"
                        >
                          <Award className="h-3.5 w-3.5 text-[#006d77] transition-transform group-hover:scale-110" />
                          <span>Unduh Syahadah Khatam 🎓</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onNavigate(lastStudied?.actionUrl || (activeCourse ? `/belajar/${activeCourse.slug}` : '/kelas'))}
                        className="group relative flex w-full items-center justify-between gap-2 rounded-xl bg-[#006d77] px-3.5 py-2.5 text-left text-white shadow-xs transition-all duration-200 hover:bg-[#00565e] hover:shadow-sm active:scale-[0.98] cursor-pointer"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="grid h-6 w-6 place-items-center rounded-md bg-white/20 text-[#83c5be] shrink-0 transition-transform group-hover:scale-110">
                            <Play className="h-3 w-3 fill-current" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[9.5px] font-bold text-[#83c5be] uppercase tracking-wider">
                              {lastStudied?.hasHistory ? 'Lanjutkan Belajar Terakhir' : 'Mulai Belajar Sekarang'}
                            </p>
                            <p className="truncate text-xs font-bold text-white">
                              {lastStudied?.lesson ? `Dars ${lastStudied.lessonNumber}: ${lastStudied.lesson.title}` : (lastStudied?.course ? lastStudied.course.title : 'Pilih Kelas')}
                            </p>
                          </div>
                        </div>
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-white shrink-0 transition-transform group-hover:translate-x-0.5">
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Three Quick-Progress Faculty Cards - Crisp Clean Architectural Cards */}
          <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {/* Syariah Card */}
            <div
              onClick={() => onNavigate('/kelas')}
              className="group cursor-pointer rounded-2xl bg-white border border-[#e2ece5] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#006d77]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e5f4f2] text-[#006d77] transition group-hover:scale-105">
                    <BookOpen className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#f0f7f4] border border-[#bfe3df] px-2.5 py-0.5 text-xs font-semibold text-[#006d77]">
                    {syariahStats.completed}/{syariahStats.total} Selesai
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-bold text-[#17382c] group-hover:text-[#006d77] transition">
                    Syariah Islamiyyah
                  </h3>
                  <p className="mt-0.5 text-xs text-[#607568]">
                    Fikih, Ushul Fiqh &amp; Qawa'id
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#f0f5f1]">
                <div className="flex items-center justify-between text-xs text-[#607568] font-medium mb-1.5">
                  <span>Kemajuan</span>
                  <span className="font-bold text-[#006d77]">{syariahStats.total ? Math.round((syariahStats.completed / syariahStats.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#e8efe9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#006d77] transition-all duration-500"
                    style={{ width: `${syariahStats.total ? (syariahStats.completed / syariahStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ushuluddin Card */}
            <div
              onClick={() => onNavigate('/kelas')}
              className="group cursor-pointer rounded-2xl bg-white border border-[#e2ece5] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#0284c7]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e0f2fe] text-[#0284c7] transition group-hover:scale-105">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#f0f9ff] border border-[#bae6fd] px-2.5 py-0.5 text-xs font-semibold text-[#0284c7]">
                    {ushuluddinStats.completed}/{ushuluddinStats.total} Selesai
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-bold text-[#17382c] group-hover:text-[#0284c7] transition">
                    Ushuluddin &amp; Aqidah
                  </h3>
                  <p className="mt-0.5 text-xs text-[#607568]">
                    Tauhid, Mantiq &amp; Hadits
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#f0f5f1]">
                <div className="flex items-center justify-between text-xs text-[#607568] font-medium mb-1.5">
                  <span>Kemajuan</span>
                  <span className="font-bold text-[#0284c7]">{ushuluddinStats.total ? Math.round((ushuluddinStats.completed / ushuluddinStats.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#e8efe9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0284c7] transition-all duration-500"
                    style={{ width: `${ushuluddinStats.total ? (ushuluddinStats.completed / ushuluddinStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lughah Card */}
            <div
              onClick={() => onNavigate('/kelas')}
              className="group cursor-pointer rounded-2xl bg-white border border-[#e2ece5] p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#16a34a]/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#dcfce7] text-[#16a34a] transition group-hover:scale-105">
                    <Compass className="h-5 w-5" />
                  </span>
                  <span className="rounded-full bg-[#f0fdf4] border border-[#bbf7d0] px-2.5 py-0.5 text-xs font-semibold text-[#16a34a]">
                    {lughahStats.completed}/{lughahStats.total} Selesai
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="text-base font-bold text-[#17382c] group-hover:text-[#16a34a] transition">
                    Lughah Arabiyyah
                  </h3>
                  <p className="mt-0.5 text-xs text-[#607568]">
                    Nahwu, Sharaf &amp; Balaghah
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-[#f0f5f1]">
                <div className="flex items-center justify-between text-xs text-[#607568] font-medium mb-1.5">
                  <span>Kemajuan</span>
                  <span className="font-bold text-[#16a34a]">{lughahStats.total ? Math.round((lughahStats.completed / lughahStats.total) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#e8efe9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all duration-500"
                    style={{ width: `${lughahStats.total ? (lughahStats.completed / lughahStats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 3. Continue Watching / Lanjutkan Belajar Grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[#17382c]">
                Lanjutkan Belajar
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCardIndex((i) => Math.max(0, i - 1))}
                  disabled={cardIndex === 0}
                  aria-label="Sebelumnya"
                  className="grid h-8 w-8 place-items-center rounded-full border border-[#cfe0d5] text-[#607568] transition hover:border-[#006d77] hover:text-[#006d77] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCardIndex((i) => Math.min(Math.max(0, continueCards.length - pageSize), i + (isMobile ? 2 : 1)))}
                  disabled={cardIndex >= Math.max(0, continueCards.length - pageSize)}
                  aria-label="Berikutnya"
                  className="grid h-8 w-8 place-items-center rounded-full bg-[#006d77] text-white transition hover:bg-[#00565e] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-3">
              {visibleCards.map((c) => {
                const isBookmarked = bookmarkedIds.includes(c.id);
                const vis = getFacultyVisual(c.faculty);
                return (
                  <div
                    key={c.id}
                    onClick={() => onNavigate(c.isEnrolled ? '/belajar/' + c.slug : '/kelas/' + c.slug)}
                    className="group flex flex-col justify-between rounded-[16px] sm:rounded-[22px] border border-[#e2ece5] bg-white p-2.5 sm:p-3.5 transition hover:border-[#9dc5ad] hover:shadow-md cursor-pointer"
                  >
                    <div>
                      {/* Thumbnail Container with exact ratio */}
                      <div className="relative w-full overflow-hidden rounded-[12px] sm:rounded-[16px] bg-[#eef4f0]" style={{ aspectRatio: '116501 / 65024' }}>
                        <img
                          src={getCourseCoverImage(c.slug, c.faculty)}
                          alt={c.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (!target.src.includes('cover-fikih')) {
                              target.src = '/courses/cover-fikih-matan-abi-syuja.png';
                            }
                          }}
                        />
                        <button
                          onClick={(e) => toggleBookmark(c.id, e)}
                          aria-label="Simpan materi"
                          className="absolute right-1.5 top-1.5 sm:right-2.5 sm:top-2.5 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                        >
                          <Star className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isBookmarked ? 'fill-[#e0833a] text-[#e0833a]' : 'text-white'}`} />
                        </button>
                      </div>

                      {/* Tag / Category */}
                      <div className="mt-2 sm:mt-3 flex items-center gap-1">
                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider ${vis.badge}`}>
                          <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          {vis.shortName}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold leading-tight sm:leading-snug text-[#17382c] line-clamp-2 min-h-[32px] sm:min-h-[40px] group-hover:text-[#006d77]">
                        {c.title}
                      </h3>

                      {/* Progress bar */}
                      <div className="mt-2 sm:mt-3">
                        <div className="h-1 sm:h-1.5 w-full overflow-hidden rounded-full bg-[#e8efe9]">
                          <div
                            className="h-full bg-[#006d77] transition-all duration-500"
                            style={{ width: `${c.progress}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[9px] sm:text-[10px] font-medium text-[#799083]">
                          <span className="truncate">{c.isEnrolled ? `${c.completedCount}/${c.totalCount} Dars` : `${c.totalCount} Dars`}</span>
                          <span>{c.isEnrolled ? `${c.progress}%` : 'Mulai'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mentor Footer */}
                    <div className="mt-2.5 sm:mt-4 flex items-center justify-between border-t border-[#f0f5f1] pt-2 sm:pt-3">
                      <div className="flex items-center gap-1.5 min-w-0 pr-1">
                        <div className="grid h-5 w-5 sm:h-7 sm:w-7 place-items-center rounded-full bg-[#d6eadc] text-[10px] sm:text-xs font-bold text-[#006d77] shrink-0">
                          {c.tutor.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[10.5px] sm:text-xs font-semibold text-[#1f4234]">{c.tutor}</p>
                          <p className="text-[9px] text-[#789182] hidden sm:block">Pengampu</p>
                        </div>
                      </div>
                      <span className="grid h-5 w-5 sm:h-6 sm:w-6 place-items-center rounded-full bg-[#f1f7f3] text-[#006d77] transition group-hover:bg-[#006d77] group-hover:text-white shrink-0">
                        <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4. Your Lesson / Materi & Pertemuan Terbaru Table */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-tight text-[#17382c]">
                Materi &amp; Pertemuan Terbaru
              </h2>
              <button
                onClick={() => onNavigate('/kelas')}
                className="text-xs font-bold text-[#006d77] hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-[#e2ece5] bg-white shadow-sm">
              {/* Header */}
              <div className="hidden grid-cols-12 gap-4 border-b border-[#edf4ef] px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#799083] sm:grid">
                <div className="col-span-4">Mentor &amp; Tanggal</div>
                <div className="col-span-2">Maddah</div>
                <div className="col-span-5">Materi Kajian</div>
                <div className="col-span-1 text-right">Aksi</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-[#f0f5f1]">
                {recentLessonRows.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onNavigate(`/belajar/${r.slug}?lesson=${r.id}`)}
                    className="group flex flex-col gap-3 p-4 transition hover:bg-[#f6fbf8] sm:grid sm:grid-cols-12 sm:items-center sm:gap-4 sm:px-5 sm:py-3.5 cursor-pointer"
                  >
                    {/* Mentor */}
                    <div className="col-span-4 flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6eadc] text-xs font-bold text-[#006d77] shrink-0">
                        {r.tutor.charAt(4) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-[#17382c] group-hover:text-[#006d77]">
                          {r.tutor}
                        </p>
                        <p className="text-[10px] text-[#799083]">{r.date}</p>
                      </div>
                    </div>

                    {/* Faculty */}
                    <div className="col-span-2">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.facultyColor}`}>
                        {r.faculty}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="col-span-5">
                      <p className="text-xs font-semibold text-[#234538] line-clamp-1">
                        {r.title}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="col-span-1 flex justify-end">
                      <span className="grid h-7 w-7 place-items-center rounded-full border border-[#d2e3d7] text-[#006d77] transition group-hover:border-[#006d77] group-hover:bg-[#006d77] group-hover:text-white">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>

        {/* Right Column (Sidebar, ~4 cols) */}
        <div className="space-y-6 xl:col-span-4">
          
          {/* 1. Statistic Card - Clean, Luminous White Surface */}
          <article className="rounded-[28px] bg-white p-6 shadow-xs border border-[#e2ece5]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17382c]">
                  Statistik Belajar
                </h3>
                <p className="text-xs text-[#607568]">Sinkronisasi Real-Time</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f0f7f4] border border-[#bfe3df] px-2.5 py-1 text-xs font-semibold text-[#006d77]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#006d77] animate-pulse" />
                Aktif
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r={gaugeRadius}
                    className="stroke-[#e8efe9]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r={gaugeRadius}
                    className="stroke-[#006d77] transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeOffset}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                {/* Percentage pill at top right of circle */}
                <div className="absolute right-0 top-0 rounded-full bg-[#006d77] px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                  {overallPercent}%
                </div>

                {/* Center Student Avatar or Azhar Monogram */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserAvatar
                    src={profile?.avatar_url}
                    name={greetingName}
                    size="xl"
                    className="border-2 border-white shadow-xs ring-4 ring-[#e5f4f2]"
                    fallbackIcon={GraduationCap}
                  />
                </div>
              </div>

              {/* Greeting & Student Role */}
              <h4 className="mt-4 flex items-center justify-center gap-1.5 text-base font-bold text-[#17382c]">
                <span>Ahlan, {userFirstName}</span>
                <Sparkles className="h-4 w-4 text-[#e0833a]" />
              </h4>
              <p className="mt-0.5 text-xs font-medium text-[#607568]">
                Penuntut Ilmu Al-Azhar
              </p>
              <p className="mt-1.5 max-w-[240px] text-xs leading-relaxed text-[#52605a]">
                {enrolledLessons.length > 0
                  ? (completedEnrolledLessons.length > 0
                      ? `${completedEnrolledLessons.length} dari ${enrolledLessons.length} pertemuan diselesaikan.`
                      : `0 dari ${enrolledLessons.length} pertemuan diselesaikan. Mulai materi pertamamu hari ini!`)
                  : 'Pilih muqarrar talaqqi untuk memulai catatan belajarmu.'}
              </p>
            </div>

            {/* Subtle Divider */}
            <div className="my-5 border-t border-[#f0f5f1]" />

            {/* Weekly Activity Bar Chart - Integrated directly on the card surface */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-[#17382c]">
                <span className="uppercase tracking-wider">Aktivitas Belajar (Menit)</span>
                <span className="text-[11px] font-normal text-[#607568]">30 Hari Terakhir</span>
              </div>

              {/* Chart Visual */}
              <div className="mt-4 grid grid-cols-4 items-end gap-3 h-28 border-b border-[#f0f5f1] pb-2">
                {activityStats.weekBuckets.map((b, idx) => {
                  const pct = activityStats.maxMinutes > 0 && b.minutes > 0
                    ? Math.max(16, Math.round((b.minutes / activityStats.maxMinutes) * 100))
                    : 12;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <span className={`text-[10px] font-semibold transition ${b.minutes > 0 ? 'text-[#006d77]' : 'text-[#8fa397]'}`}>
                        {b.minutes > 0 ? `${b.minutes}m` : '0m'}
                      </span>
                      <div className="w-full max-w-[32px] h-full flex items-end justify-center">
                        <div
                          className={`w-full rounded-full transition-all duration-500 ${
                            b.minutes > 0
                              ? 'bg-[#006d77] shadow-2xs'
                              : 'bg-[#e8efe9] group-hover:bg-[#d8e4dc]'
                          }`}
                          style={{ height: `${pct}%` }}
                          title={`${b.label}: ${b.minutes} menit`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X Axis Labels */}
              <div className="mt-2.5 grid grid-cols-4 gap-2.5 text-center text-[10px] font-medium text-[#607568]">
                {activityStats.weekBuckets.map((b, idx) => (
                  <span key={idx} className={idx === 3 ? 'font-bold text-[#17382c]' : ''}>
                    {b.label}
                  </span>
                ))}
              </div>

              <div className="mt-3.5 flex items-center justify-between border-t border-[#f0f5f1] pt-2.5 text-xs text-[#607568]">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-[#006d77]" />
                  <span>Total Waktu Talaqqi:</span>
                </span>
                <span className="font-bold text-[#17382c]">{activityStats.totalMinutes} Menit</span>
              </div>
            </div>
          </article>

          {/* 2. Your Mentor / Asatidz Pembimbing Card - Clean, Luminous White Surface */}
          <article className="rounded-[28px] bg-white p-6 shadow-xs border border-[#e2ece5]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#17382c]">
                  Asatidz Pembimbing
                </h3>
                <p className="text-xs text-[#607568]">Al-Azhar University Cairo</p>
              </div>
              <span className="rounded-full bg-[#f0f7f4] border border-[#bfe3df] px-2.5 py-1 text-xs font-semibold text-[#006d77]">
                Tersertifikasi
              </span>
            </div>

            {/* Mentor List - Clean row items without clunky nested boxes */}
            <div className="mt-4 divide-y divide-[#f0f5f1]">
              {asatidzList.map((mentor, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f4f2] text-sm font-bold text-[#006d77]">
                        {mentor.avatarLetter}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full bg-[#006d77] text-white ring-2 ring-white">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#17382c] group-hover:text-[#006d77] transition">{mentor.name}</p>
                      <p className="truncate text-[11px] text-[#607568]">{mentor.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('/kelas/' + mentor.slug)}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#cfe0d5] bg-white px-3.5 py-1 text-xs font-medium text-[#006d77] hover:bg-[#f0f7f4] hover:border-[#006d77] active:scale-[0.98] transition cursor-pointer"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Kelas</span>
                  </button>
                </div>
              ))}
            </div>

            {/* See all button */}
            <button
              onClick={() => onNavigate('/kelas')}
              className="mt-5 w-full h-10 rounded-full border border-[#cfe0d5] bg-[#f8faf9] text-xs font-semibold text-[#006d77] hover:bg-[#f0f7f4] hover:border-[#9dc5ad] active:scale-[0.98] transition cursor-pointer"
            >
              Lihat Semua Asatidz &amp; Silabus
            </button>
          </article>

        </div>
      </div>

      {/* Syahadah Khatam Muqarrar Modal */}
      {showSyahadahModal && lastStudied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[24px] border-4 border-[#006d77] bg-[#fcfdfa] p-6 sm:p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Corner Decorative Ornaments */}
            <div className="absolute top-2 left-2 text-[#83c5be]/50 text-xs select-none">✦</div>
            <div className="absolute top-2 right-2 text-[#83c5be]/50 text-xs select-none">✦</div>
            <div className="absolute bottom-2 left-2 text-[#83c5be]/50 text-xs select-none">✦</div>
            <div className="absolute bottom-2 right-2 text-[#83c5be]/50 text-xs select-none">✦</div>

            <div className="flex flex-col items-center">
              <img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-10 w-auto object-contain rounded-md" />
              <p className="mt-2 text-xs font-serif text-[#006d77] font-bold tracking-wider" dir="rtl">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#83c5be]">
                <Award className="h-3 w-3" />
                <span>Syahadah Khatam Muqarrar</span>
              </div>
              <h3 className="mt-2 text-xl font-black text-[#17382c] tracking-tight">
                شَهَادَةُ خَتْمِ المُقَرَّرِ
              </h3>
            </div>

            <div className="mt-4 border-y border-[#d2e3d7] py-4 text-xs text-[#52605a] space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-[#799083]">Diberikan kepada Thalibul 'Ilm:</p>
              <h4 className="text-base sm:text-lg font-extrabold text-[#006d77]">
                {greetingName}
              </h4>
              <p className="text-[11px] leading-relaxed">
                Telah menyelesaikan seluruh rangkaian talaqqi &amp; dars muqarrar turats:
              </p>
              <div className="rounded-xl bg-[#e5f4f2]/70 border border-[#83c5be]/40 p-2.5">
                <p className="font-extrabold text-xs sm:text-sm text-[#17382c]">
                  "{lastStudied.course.title}"
                </p>
                <p className="text-[10.5px] text-[#006d77] mt-0.5 font-medium">
                  Pengampu: {lastStudied.course.tutor} • Kulliyyah {lastStudied.course.faculty}
                </p>
              </div>
              <div className="flex items-center justify-between text-[10.5px] pt-1 text-[#607568]">
                <span>Status: <strong className="text-[#006d77]">Mumtaz (Khatam 100%)</strong></span>
                <span>{todayFormatted}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 rounded-xl bg-[#006d77] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#00565e] cursor-pointer"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Cetak / Simpan</span>
              </button>
              <button
                type="button"
                onClick={() => setShowSyahadahModal(false)}
                className="rounded-xl border border-[#cfe0d5] bg-white px-4 py-2 text-xs font-semibold text-[#17382c] hover:bg-[#f6fbf8] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panduan Belajar Talaqqi Modal */}
      {showPanduanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md overflow-hidden rounded-[24px] border-2 border-[#83c5be] bg-white p-6 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#f0f5f1] pb-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e5f4f2] text-[#006d77]">
                  <Compass className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#17382c]">Panduan Talaqqi Al Madraj</h3>
                  <p className="text-[10px] text-[#607568]">Metode Belajar Turats Bersama Asatidz Al-Azhar</p>
                </div>
              </div>
              <button
                onClick={() => setShowPanduanModal(false)}
                className="grid h-7 w-7 place-items-center rounded-full text-[#71877c] hover:bg-[#f0f5f1] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex gap-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5] p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#006d77] text-white text-[11px] font-black">1</span>
                <div>
                  <h4 className="text-xs font-bold text-[#17382c]">Pilih &amp; Ikuti Muqarrar</h4>
                  <p className="text-[11px] text-[#607568] mt-0.5 leading-relaxed">
                    Buka katalog dan pilih disiplin ilmu yang ingin dipelajari (Syariah, Ushuluddin, atau Lughah Arabiyyah).
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5] p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#006d77] text-white text-[11px] font-black">2</span>
                <div>
                  <h4 className="text-xs font-bold text-[#17382c]">Talaqqi Dars Bertahap</h4>
                  <p className="text-[11px] text-[#607568] mt-0.5 leading-relaxed">
                    Simak rekaman dars asatidz Al-Azhar. Progres durasi menonton tersimpan otomatis ke akunmu.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5] p-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#006d77] text-white text-[11px] font-black">3</span>
                <div>
                  <h4 className="text-xs font-bold text-[#17382c]">Khatam &amp; Unduh Syahadah</h4>
                  <p className="text-[11px] text-[#607568] mt-0.5 leading-relaxed">
                    Tuntaskan 100% seluruh dars untuk membuka Syahadah Khatam resmi dari Al Madraj.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-[#f0f5f1] pt-3">
              <button
                type="button"
                onClick={() => { setShowPanduanModal(false); onNavigate('/kelas'); }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#006d77] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] cursor-pointer"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Buka Katalog Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CourseRouteV2 = ({
  path,
  user,
  profile,
  onNavigate,
  onLogout,
}: {
  path: string;
  user: { id: string } | null;
  profile: Profile | null;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}) => {
  const parsedPath = new URL(path, window.location.origin);
  const slug = parsedPath.pathname.split('/')[2];
  const wantsCheckout = parsedPath.searchParams.get('buy') === '1';
  const [course, setCourse] = useState<Course | null>(null);
  const [previewLessons, setPreviewLessons] = useState<Lesson[]>([]);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(wantsCheckout);
  const [previewVideo, setPreviewVideo] = useState<{ id: string; title: string; youtubeId?: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      const sb = requireSupabase();
      const result = await sb.from('courses').select('*').eq('slug', slug).eq('is_published', true).single();
      setCourse(result.data);
      if (result.data) {
        const lessons = await sb
          .from('lessons')
          .select('id,course_id,title,content_type,duration,sort_order')
          .eq('course_id', result.data.id)
          .eq('is_published', true)
          .order('sort_order');
        setPreviewLessons((lessons.data || []) as Lesson[]);
      }
      if (user && result.data) {
        const enrollment = await sb
          .from('enrollments')
          .select('id')
          .eq('user_id', user.id)
          .eq('course_id', result.data.id)
          .eq('status', 'active')
          .maybeSingle();
        setEnrolled(Boolean(enrollment.data));
      }
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [slug, user]);

  if (loading) return <PublicLoading />;
  if (!course) {
    return (
      <Notice
        title="Kelas tidak ditemukan"
        text="Program ini belum dipublikasikan atau slug-nya tidak valid."
      />
    );
  }

  const detail = getCourseDetail(slug);
  const theme = getFacultyVisual(course.faculty);

  const isFree = course.price === 0;
  const hasAccess = isFree || enrolled;

  const kitabName = detail?.kitabName || course.title;
  const authorName = detail?.authorName || 'Ulama Ahlussunnah wal Jama\'ah';
  const tutorName = getCourseTutorName(course.slug, detail?.tutorName || course.tutor);
  const tutorTitle = detail?.tutorTitle || 'Pengajar Turats & Muqarrar Al-Azhar';
  const tutorBio = detail?.tutorBio || 'Alumni Universitas Al-Azhar Kairo yang membimbing pemahaman ibarat kitab turats dan persiapan imtihan secara mendalam.';
  const tutorAlmamater = detail?.tutorAlmamater || 'Universitas Al-Azhar, Kairo';
  const overview = detail?.overview || course.summary;
  const outcomes = detail?.outcomes || [
    'Memahami ibarat turats dan konsep dasar materi secara runtut.',
    'Mempersiapkan diri lebih matang sebelum menghadapi imtihan muqarrar.',
    'Mendapatkan panduan langsung dari asatidz alumni Al-Azhar Kairo.',
    'Menguasai kaidah berfikir dan dalil-dalil ilmiah Ahlussunnah.',
  ];
  const targetAudience = detail?.targetAudience || [
    'Mahasiswa Al-Azhar yang sedang menempuh materi kuliah terkait.',
    'Santri dan pembelajar ilmu Islam yang ingin belajar secara terarah.',
    'Guru, asatidz, dan da\'i yang memerlukan rujukan syarah terpercaya.',
  ];
  const facilities = detail?.facilities || [
    'Akses rekaman video pembelajaran beresolusi tinggi tanpa batas waktu',
    'Diktat teks matan & catatan faedah ibarat kitab',
    'Tersimpan di dashboard akun mahasiswa Al Madraj',
    'Pelacakan progress belajar mandiri',
  ];

  const lessons = detail?.lessons || (previewLessons.length ? previewLessons.map((l, i) => ({
    sortOrder: i + 1,
    title: l.title,
    duration: l.duration || 'Video Kajian',
    description: 'Pembahasan materi bertahap sesuai urutan muqarrar kitab.',
  })) : []);

  const handleEnroll = async () => {
    if (isFree) {
      if (user) {
        try {
          const sb = requireSupabase();
          await sb.rpc('enroll_lms_free_course', { p_course_slug: course.slug });
          await sb.from('enrollments').upsert({
            user_id: user.id,
            course_id: course.id,
            status: 'active',
            activated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,course_id' });
        } catch (e) {
          console.error(e);
        }
      }
      onNavigate('/belajar/' + course.slug);
    } else {
      setPaymentModalOpen(true);
    }
  };

  return (
    <BackendShell profile={profile} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-8 pb-20 lg:pb-12">
        {/* Breadcrumbs Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <button
            onClick={() => onNavigate('/kelas')}
            className="inline-flex items-center gap-2 rounded-full border border-[#dce9df] bg-white px-4 py-2 font-semibold text-[#547363] hover:text-[#006d77] hover:border-[#006d77] hover:shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Katalog Program</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-[#7f998c]">
            <span>Katalog</span>
            <span>/</span>
            <span className="font-semibold text-[#006d77]">{course.faculty}</span>
            <span>/</span>
            <span className="truncate max-w-[240px] text-[#1c382b]">{course.title}</span>
          </div>
        </div>

        {/* Grand Hero Section: Material Design 3 Expressive Surface */}
        <section className={`relative overflow-hidden rounded-[36px] sm:rounded-[44px] bg-gradient-to-br ${theme.bannerGradient} p-6 sm:p-9 lg:p-12 text-white shadow-[0_24px_54px_-16px_rgba(0,35,40,0.42)]`}>
          {/* M3 Atmospheric Ambient Glow Spheres */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#83c5be]/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 -bottom-16 h-72 w-72 rounded-full bg-[#006d77]/30 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-6">
            {/* M3 Assist Chips / Badges Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Faculty Pill Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#83c5be]/25 px-3.5 py-1.5 text-xs font-bold text-[#83c5be] backdrop-blur-md shadow-2xs tracking-wide">
                <span className="h-1.5 w-1.5 rounded-full bg-[#83c5be] animate-pulse" />
                <span>{theme.facultyName || course.faculty}</span>
              </span>

              {/* Program Type Chip */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md hover:bg-white/15 transition">
                <Bookmark className="h-3.5 w-3.5 text-[#83c5be]" />
                <span>{course.program_type || 'Dars Muqarrar'}</span>
              </span>

              {/* Duration Chip */}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-md hover:bg-white/15 transition">
                <CirclePlay className="h-3.5 w-3.5 text-[#83c5be]" />
                <span>{lessons.length ? `${lessons.length} Pertemuan` : course.duration}</span>
              </span>

              {/* Status Chip */}
              {isFree ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-xs font-bold text-emerald-300 backdrop-blur-md border border-emerald-400/30">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                  <span>Akses Gratis (Wakaf Ilmu)</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md">
                  <GraduationCap className="h-3.5 w-3.5 text-[#83c5be]" />
                  <span>Talaqqi Sanad Mu'tamad</span>
                </span>
              )}
            </div>

            {/* Title: M3 Expressive Display Headline */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold tracking-tight text-white leading-[1.16] text-balance">
                {course.title}
              </h1>
            </div>

            {/* M3 Elevated Tonal Surface: Kitab Turats Showcase */}
            <div className="group/kitab relative overflow-hidden rounded-[24px] sm:rounded-[28px] bg-white/[0.08] p-4 sm:p-5 backdrop-blur-md transition-all duration-300 hover:bg-white/[0.12] shadow-xs">
              <div className="flex items-center sm:items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#83c5be]/35 to-[#006d77]/50 text-[#83c5be] shadow-inner">
                  <BookOpen className="h-5 w-5 text-[#83c5be]" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#83c5be]">
                      Kitab Rujukan Muqarrar
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="text-[11px] text-white/70">
                      Teks Turats Al-Azhar
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    {kitabName}
                  </p>
                  <p className="text-xs sm:text-sm text-[#bce2d6] flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-white/60">Karya Mu'allif:</span>
                    <span className="font-semibold text-white">{authorName}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Synopsis / Ringkasan Deskripsi */}
            <p className="text-sm sm:text-[15px] leading-relaxed text-[#d7eee2] font-normal max-w-2xl pt-1">
              {overview}
            </p>

            {/* M3 Surface Container: Unified Fluid Quick Facts (No Boxiness!) */}
            <div className="rounded-[24px] sm:rounded-[28px] bg-white/[0.06] p-4 sm:p-5 backdrop-blur-sm shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
                {/* Fact 1: Pengajar */}
                <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pr-4 first:pt-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-[#006d77] to-[#83c5be] text-white font-bold text-xs shadow-md">
                    {tutorName.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#83c5be]">
                      Pengajar
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {tutorName}
                    </p>
                    <p className="text-[11px] text-white/60 truncate pt-0.5">
                      {tutorAlmamater}
                    </p>
                  </div>
                </div>

                {/* Fact 2: Metode Akses */}
                <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:px-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#83c5be]">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#83c5be]">
                      Metode Akses
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {course.schedule || 'Akses Mandiri (Self-Paced)'}
                    </p>
                    <p className="text-[11px] text-white/60 truncate pt-0.5">
                      Rekaman Video Seumur Hidup
                    </p>
                  </div>
                </div>

                {/* Fact 3: Kurikulum */}
                <div className="flex items-center gap-3.5 pt-3 sm:pt-0 sm:pl-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-[#83c5be]">
                    <CirclePlay className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#83c5be]">
                      Kurikulum
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                      {lessons.length ? `${lessons.length} Dars Tuntas` : course.duration}
                    </p>
                    <p className="text-[11px] text-white/60 truncate pt-0.5">
                      Penjelasan Matan Per Kalimat
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* M3 Mobile Bottom Action Bar (Capsule Pill Button) */}
            <div className="flex sm:hidden items-center justify-between gap-3 pt-4 border-t border-white/15">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/60 font-semibold">
                  {isFree ? 'Format Program' : 'Investasi Belajar'}
                </p>
                <p className="text-lg font-extrabold text-white">
                  {isFree ? 'Gratis (Wakaf)' : money(course.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleEnroll}
                className="inline-flex items-center gap-2 rounded-full bg-[#83c5be] px-5 py-3 text-xs font-bold text-[#00383d] shadow-lg hover:bg-white active:scale-95 transition-all cursor-pointer"
              >
                <span>{hasAccess ? 'Buka Ruang Belajar' : isFree ? 'Mulai Belajar Sekarang' : 'Daftar Kelas Ini'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 2-Column Main Layout: Left Content, Right Sticky Sidebar */}
        <div className="grid gap-8 lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_390px] items-start">
          {/* Left Column: Comprehensive Course Details */}
          <div className="space-y-8 min-w-0">

            {/* Section 1: Hasil Belajar / Output Pengkajian */}
            <section className="rounded-[24px] border border-[#dce9df] bg-[#f9fbf9] p-6 sm:p-8">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Output Pengkajian
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-[#143428]">
                  Apa yang Akan Anda Kuasai
                </h2>
                <p className="text-xs text-[#597566]">
                  Target pemahaman yang dirancang agar santri dan mahasiswa memiliki pemahaman kokoh dan mandiri.
                </p>
              </div>

              <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
                {outcomes.map((outcome, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-[#dce9df] bg-white p-4 text-xs text-[#2b4c3c] shadow-2xs"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span className="font-medium leading-relaxed">{outcome}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 2: Kurikulum & Silabus Pertemuan (Material Design 3 Redesign) */}
            <section className="rounded-[32px] sm:rounded-[36px] border border-[#dce8df] bg-white p-6 sm:p-8 lg:p-9 shadow-xs space-y-6">
              {/* Header: Title, Description & Stats Pills */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#edf4ef] pb-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#006d77]">
                    <span className="h-2 w-2 rounded-full bg-[#006d77]" />
                    <span>Silabus &amp; Kurikulum Turats</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#143428] tracking-tight">
                    Alur Pembahasan Kitab
                  </h2>
                  <p className="text-xs sm:text-sm text-[#5e7a6c] leading-relaxed">
                    Disusun bertahap dari muqaddimah, bab-bab inti, hingga pendalaman dalil naqli dan aqli. Setiap dars membedah ibarat matan secara runtut kata demi kata.
                  </p>
                </div>

                {/* Header Summary Chips */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f4f2] px-3.5 py-1.5 text-xs font-bold text-[#006d77] border border-[#83c5be]/50">
                    <CirclePlay className="h-3.5 w-3.5 text-[#006d77]" />
                    <span>{lessons.length ? `${lessons.length} Dars Lengkap` : course.duration}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f6faf8] px-3.5 py-1.5 text-xs font-medium text-[#486354] border border-[#dce8df]">
                    <Clock className="h-3.5 w-3.5 text-[#83c5be]" />
                    <span>Akses Seumur Hidup</span>
                  </span>
                </div>
              </div>

              {/* Interactive Lesson Cards List */}
              <div className="space-y-3.5">
                {lessons.length ? (
                  lessons.map((lesson: any, idx: number) => {
                    const sortNum = lesson.sortOrder || idx + 1;
                    const youtubeId = lesson.youtubeId || null;
                    const thumbUrl = lesson.thumbnailUrl || (youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : null);
                    const isPreview = sortNum === 1;
                    const topicTitle = lesson.description || lesson.title;
                    const subtitleLabel = lesson.title || `Pertemuan ke-${sortNum}`;

                    return (
                      <div
                        key={idx}
                        className={`group relative overflow-hidden rounded-[24px] border transition-all duration-300 p-4 sm:p-5 ${
                          isPreview && !hasAccess
                            ? 'border-[#83c5be] bg-gradient-to-r from-[#f4faf7] via-white to-[#f0f8f5] shadow-[0_4px_20px_-4px_rgba(0,109,119,0.08)]'
                            : 'border-[#e5ede7] bg-white hover:border-[#83c5be]/80 hover:bg-[#fbfdfc] hover:shadow-sm'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 justify-between">
                          {/* Left: Thumbnail & Lesson Topic Info */}
                          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                            {/* Video Thumbnail with Play Overlay */}
                            <div
                              onClick={() => {
                                if (isPreview && youtubeId) {
                                  setPreviewVideo({ id: String(lesson.id || idx), title: topicTitle, youtubeId });
                                } else if (hasAccess) {
                                  onNavigate(`/belajar/${course.slug}?lesson=${lesson.id || idx + 1}`);
                                } else {
                                  setPaymentModalOpen(true);
                                }
                              }}
                              className="relative h-18 w-28 sm:h-20 sm:w-32 rounded-[18px] overflow-hidden shrink-0 bg-[#00383d] shadow-2xs group-hover:shadow-md transition cursor-pointer"
                            >
                              {thumbUrl ? (
                                <img
                                  src={thumbUrl}
                                  alt={topicTitle}
                                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="h-full w-full bg-gradient-to-br from-[#00383d] to-[#006d77] flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-[#83c5be]" />
                                </div>
                              )}
                              {/* Dark Glass Overlay with Play Icon */}
                              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition flex items-center justify-center">
                                <span className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-xs transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                                  isPreview || hasAccess ? 'bg-[#006d77] text-white' : 'bg-black/60 text-white/90'
                                }`}>
                                  {isPreview || hasAccess ? (
                                    <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
                                  ) : (
                                    <Lock className="h-3 w-3 text-white/80" />
                                  )}
                                </span>
                              </div>
                              {/* Duration Badge */}
                              <span className="absolute bottom-1 right-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[9.5px] font-bold text-white tracking-wide">
                                {lesson.duration || 'HD Video'}
                              </span>
                            </div>

                            {/* Text Info */}
                            <div className="min-w-0 flex-1 space-y-1">
                              {/* Badge Row */}
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5f1] px-2.5 py-0.5 text-[10.5px] font-bold text-[#006d77]">
                                  DARS {String(sortNum).padStart(2, '0')}
                                </span>
                                {isPreview && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#83c5be]/20 px-2.5 py-0.5 text-[10.5px] font-extrabold text-[#006d77] border border-[#83c5be]/50 animate-pulse">
                                    <Sparkles className="h-2.5 w-2.5 text-[#006d77]" />
                                    <span>Pratinjau Gratis</span>
                                  </span>
                                )}
                                <span className="text-[11px] text-[#718d7d] hidden sm:inline truncate">
                                  {subtitleLabel}
                                </span>
                              </div>

                              {/* Main Topic Heading */}
                              <h3 className="text-sm sm:text-base font-bold text-[#143428] leading-snug group-hover:text-[#006d77] transition-colors">
                                {topicTitle}
                              </h3>

                              {/* Topic Highlights / Features */}
                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#638071] pt-0.5">
                                <span className="inline-flex items-center gap-1">
                                  <CirclePlay className="h-3 w-3 text-[#006d77]" />
                                  <span>Penjelasan Matan</span>
                                </span>
                                <span className="text-black/15">•</span>
                                <span className="inline-flex items-center gap-1">
                                  <FileText className="h-3 w-3 text-[#006d77]" />
                                  <span>Diktat Teks Kitab</span>
                                </span>
                                <span className="text-black/15 hidden sm:inline">•</span>
                                <span className="hidden sm:inline-flex items-center gap-1 text-[#006d77] font-medium">
                                  <span>Talaqqi Sanad Al-Azhar</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Right: Action Button */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#edf4ef]">
                            {hasAccess ? (
                              <button
                                type="button"
                                onClick={() => onNavigate(`/belajar/${course.slug}?lesson=${lesson.id || idx + 1}`)}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#006d77] px-4.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] active:scale-95 transition cursor-pointer"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Pelajari Dars</span>
                              </button>
                            ) : isPreview ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (youtubeId) {
                                    setPreviewVideo({ id: String(lesson.id || idx), title: topicTitle, youtubeId });
                                  } else {
                                    onNavigate(`/belajar/${course.slug}`);
                                  }
                                }}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#006d77] px-4.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] active:scale-95 transition cursor-pointer"
                              >
                                <Play className="h-3.5 w-3.5 fill-current" />
                                <span>Tonton Gratis</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setPaymentModalOpen(true)}
                                className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-full border border-[#d6e5dc] bg-[#f8faf9] px-4 py-2 text-xs font-semibold text-[#486354] hover:border-[#006d77] hover:text-[#006d77] hover:bg-[#eef6f2] active:scale-95 transition cursor-pointer"
                              >
                                <Lock className="h-3.5 w-3.5 text-[#6c8577]" />
                                <span>Terkunci · Buka Akses</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center text-xs text-[#799083]">
                    Silabus materi sedang dimutakhirkan oleh tim Al Madraj.
                  </div>
                )}
              </div>
            </section>

            {/* Section 3: Profil Pengajar / Asatidz Dedikasi */}
            <section className="rounded-[24px] border border-[#dce9df] bg-white p-6 sm:p-8 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                Pengampu Program
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#143428]">
                Belajar Langsung Bersama Asatidz Alumni Al-Azhar
              </h2>

              <div className="mt-6 flex flex-col sm:flex-row items-start gap-5 rounded-2xl border border-[#e3ede6] bg-[#f8fbf9] p-5 sm:p-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#006d77] to-[#10b981] text-xl font-bold text-white shadow-md">
                  {tutorName.split(/\s+/).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#143428] flex items-center gap-2">
                      <span>{tutorName}</span>
                      <ShieldCheck className="h-4 w-4 text-[#10b981]" />
                    </h3>
                    <p className="text-xs font-semibold text-[#006d77] mt-0.5">
                      {tutorTitle}
                    </p>
                    <p className="text-[11px] text-[#698777] mt-0.5 flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-[#167a5b]" />
                      <span>{tutorAlmamater}</span>
                    </p>
                  </div>

                  <p className="text-xs leading-relaxed text-[#416150] pt-1">
                    {tutorBio}
                  </p>

                  <div className="pt-2 border-t border-[#e2ece5] text-[11px] text-[#557766] flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-[#006d77] shrink-0" />
                    <span>Pengajaran talaqqi &amp; tahqiq sanad keilmuan yang bersambung ke masyayikh Al-Azhar Kairo.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Target Peserta (Untuk Siapa Kelas Ini?) */}
            <section className="rounded-[24px] border border-[#dce9df] bg-[#f9fbf9] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                Relevansi Program
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#143428]">
                Untuk Siapa Program Ini Dirancang?
              </h2>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {targetAudience.map((target, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#dce9df] bg-white p-4.5 text-xs text-[#2d503e] shadow-2xs space-y-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e6f4ec] text-[#006d77] font-bold">
                      {idx + 1}
                    </div>
                    <p className="font-medium leading-relaxed">{target}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 5: Fasilitas Belajar Eksklusif */}
            <section className="rounded-[24px] border border-[#dce9df] bg-white p-6 sm:p-8 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                Fasilitas Pembelajaran
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#143428]">
                Kemudahan Belajar di Platform Al Madraj
              </h2>

              <div className="mt-6 grid gap-3.5 sm:grid-cols-2">
                {facilities.map((fac, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-[#dce9df] bg-[#f8fcf9] p-3.5 text-xs text-[#1e4231]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e3efe7] text-[#006d77]">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-semibold">{fac}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Section 6: FAQ / Tanya Jawab Seputar Program */}
            <section className="rounded-[24px] border border-[#dce9df] bg-[#fcfdfc] p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                Informasi Penting
              </p>
              <h2 className="mt-1 text-xl sm:text-2xl font-bold text-[#143428]">
                Pertanyaan yang Sering Diajukan
              </h2>

              <div className="mt-6 space-y-3">
                {[
                  {
                    q: 'Bagaimana cara mengakses rekaman video setelah pendaftaran?',
                    a: 'Setelah pembayaran terkonfirmasi, materi kelas otomatis terbuka di akun Anda. Anda bisa langsung masuk ke menu Ruang Belajar kapan saja melalui HP, tablet, maupun laptop.',
                  },
                  {
                    q: 'Apakah akses kelas ini memiliki masa kedaluwarsa?',
                    a: 'Tidak ada. Akses diberikan seumur hidup (lifetime access). Anda bebas menyimak dan mengulang materi kapan pun tanpa khawatir kehabisan waktu.',
                  },
                  {
                    q: 'Metode pembayaran apa saja yang diterima?',
                    a: 'Sistem mendukung QRIS otomatis (GoPay, OVO, ShopeePay, BCA Mobile, Livin, dll.), Virtual Account Bank (BCA, Mandiri, BNI, BRI, Permata), dan transfer bank instan.',
                  },
                  {
                    q: 'Apakah materi ini sesuai dengan kurikulum kuliah Al-Azhar Kairo?',
                    a: 'Ya, kurikulum disusun bersandar pada kitab muqarrar dan diktat resmi yang diajarkan oleh para masyayikh di Al-Azhar, membedah ibarat penting yang sering diujikan dalam imtihan.',
                  },
                ].map((faq, i) => (
                  <details
                    key={i}
                    className="group rounded-2xl border border-[#dce9df] bg-white p-4 transition hover:border-[#006d77] [&_summary::-webkit-details-marker]:hidden"
                  >
                    <summary className="flex cursor-pointer items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#143428]">
                      <span>{faq.q}</span>
                      <span className="shrink-0 transition group-open:rotate-180 text-[#006d77]">▼</span>
                    </summary>
                    <p className="mt-3 text-xs leading-relaxed text-[#4d6a5a] border-t border-[#edf4ef] pt-3">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Conversion Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-5">
            <div className="overflow-hidden rounded-[26px] border border-[#d6e7dc] bg-white shadow-xl">
              {/* Header Card */}
              <div className="bg-gradient-to-r from-[#006d77] to-[#0a6657] p-5 sm:p-6 text-white text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
                  {isFree ? 'Format Akses' : 'Investasi Belajar'}
                </p>
                <p className="mt-1 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {isFree ? 'Gratis' : money(course.price)}
                </p>
                <p className="mt-1 text-xs text-[#cbe9da]">
                  {isFree ? 'Program Terbuka · Siap dipelajari kapan saja' : 'Sekali bayar · Akses penuh selamanya'}
                </p>
              </div>

              {/* Value Stack & Features */}
              <div className="p-5 sm:p-6 space-y-5">
                <div className="space-y-3 text-xs text-[#2d503e]">
                  <p className="font-bold text-[#143428] uppercase tracking-wider text-[11px]">
                    Keuntungan yang Anda Dapatkan:
                  </p>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span><strong>{lessons.length || course.duration}</strong> materi video rekaman beresolusi jernih</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span>Penjelasan ibarat turats kalimat per kalimat</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span>Diktat teks matan &amp; catatan faedah penjelas</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span>Progress belajar tersimpan otomatis di dashboard</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#006d77] shrink-0 mt-0.5" />
                    <span>Bebas akses kapan saja (Lifetime Access)</span>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="space-y-2 pt-2">
                  {enrolled ? (
                    <button
                      type="button"
                      onClick={() => onNavigate('/belajar/' + course.slug)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white shadow-md hover:bg-[#00565e] transition active:scale-95 cursor-pointer"
                    >
                      <span>Buka Ruang Belajar</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : isFree ? (
                    <button
                      type="button"
                      onClick={handleEnroll}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white shadow-md hover:bg-[#00565e] transition active:scale-95 cursor-pointer"
                    >
                      <span>Mulai Belajar Sekarang</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPaymentModalOpen(true)}
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(7,84,71,0.25)] hover:bg-[#096353] transition active:scale-95 cursor-pointer"
                    >
                      <span>Daftar / Beli Sekarang</span>
                      <CreditCard className="h-4 w-4" />
                    </button>
                  )}

                  <p className="text-[11px] text-center text-[#739180]">
                    {isFree
                      ? 'Langsung masuk ke materi tanpa biaya.'
                      : 'Aktivasi otomatis seketika setelah pembayaran.'}
                  </p>
                </div>

                {/* Trust and Payment Security note */}
                <div className="border-t border-[#edf4ef] pt-4 space-y-2 text-[11px] text-[#557665]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#006d77] shrink-0" />
                    <span>Kurikulum terverifikasi standar akademik Al-Azhar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-[#006d77] shrink-0" />
                    <span>Mendukung QRIS, Virtual Account, &amp; Bank Transfer</span>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Assistance Card */}
            <div className="rounded-2xl border border-[#dce9df] bg-[#f7fbf8] p-4 text-center text-xs text-[#4b6d5b]">
              <p className="font-semibold text-[#143428]">Butuh Bantuan atau Konsultasi Program?</p>
              <p className="mt-1 text-[11px]">Tim admin Al Madraj siap menjawab pertanyaan Anda mengenai materi dan kurikulum.</p>
              <a
                href="https://wa.me/201099887766?text=Halo%20Admin%20Al%20Madraj,%20saya%20ingin%20tanya%20tentang%20kelas%20ini"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-full border border-[#cfe0d5] bg-white px-4 py-2 font-bold text-[#006d77] hover:bg-[#edf5f0] transition cursor-pointer"
              >
                <span>Hubungi Admin WhatsApp</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </aside>
        </div>

        {/* Mobile Sticky Bottom Floating Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#dce9df] bg-white/95 backdrop-blur-md p-3 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#698876]">
              {isFree ? 'Akses Terbuka' : 'Investasi'}
            </p>
            <p className="text-lg font-bold text-[#006d77]">
              {isFree ? 'Gratis' : money(course.price)}
            </p>
          </div>

          <div>
            {enrolled ? (
              <button
                type="button"
                onClick={() => onNavigate('/belajar/' + course.slug)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                <span>Buka Kelas</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : isFree ? (
              <button
                type="button"
                onClick={handleEnroll}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-sm cursor-pointer"
              >
                <span>Mulai Belajar</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setPaymentModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
              >
                <span>Beli Sekarang</span>
                <CreditCard className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {paymentModalOpen && (
          <MayarPaymentModal
            course={{
              id: course.slug,
              title: course.title,
              price: course.price,
              faculty: course.faculty,
              programType: course.program_type,
              tutor: tutorName,
              lessons: course.duration,
            }}
            onClose={() => setPaymentModalOpen(false)}
            onSuccessRedirect={(slug) => {
              setPaymentModalOpen(false);
              onNavigate('/belajar/' + slug);
            }}
          />
        )}

        {/* Video Preview Modal for Dars 1 */}
        {previewVideo && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewVideo(null)}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="relative w-full max-w-2xl overflow-hidden rounded-[28px] sm:rounded-[36px] bg-[#0c1f19] border border-white/15 shadow-2xl text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[#081813]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006d77] text-white shrink-0">
                    <Play className="h-4 w-4 fill-current ml-0.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#83c5be]">
                      Pratinjau Dars Pembuka
                    </p>
                    <p className="truncate text-xs sm:text-sm font-bold text-white">
                      {previewVideo.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewVideo(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 transition cursor-pointer shrink-0"
                  aria-label="Tutup pratinjau"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Video Iframe */}
              <div className="aspect-video w-full bg-black">
                {previewVideo.youtubeId ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${previewVideo.youtubeId}?autoplay=1&rel=0`}
                    title={previewVideo.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-white/60">
                    Video tidak tersedia untuk pratinjau.
                  </div>
                )}
              </div>

              {/* Modal Footer CTA */}
              <div className="p-4 sm:p-5 bg-[#081813] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-[#b8dfd2] text-center sm:text-left">
                  Suka metode pengajarannya? Buka akses penuh untuk mempelajari seluruh silabus {lessons.length} dars.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewVideo(null);
                    handleEnroll();
                  }}
                  className="inline-flex items-center gap-2 rounded-full bg-[#83c5be] px-5 py-2.5 text-xs font-bold text-[#00383d] shadow-md hover:bg-white active:scale-95 transition cursor-pointer shrink-0"
                >
                  <span>{hasAccess ? 'Buka Ruang Belajar' : isFree ? 'Mulai Belajar Sekarang' : 'Daftar Kelas Lengkap'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BackendShell>
  );
};

const CheckoutRoute = ({ path, onNavigate, onError }: { path: string; onNavigate: (path: string) => void; onError: (message: string) => void }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [hasActiveAccess, setHasActiveAccess] = useState(false);
  const [mayarError, setMayarError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const sb = requireSupabase();
        const slug = path.split('/')[2];
        const { data: cData } = await sb.from('courses').select('*').eq('slug', slug).eq('is_published', true).single();
        if (active && cData) {
          setCourse(cData as Course);
        }

        const { data: uData } = await sb.auth.getUser();
        if (active && uData?.user) {
          setCurrentUser(uData.user);
          const { data: pData } = await sb.from('profiles').select('*').eq('id', uData.user.id).single();
          if (active && pData) setCurrentProfile(pData as Profile);

          if (cData) {
            const { data: enr } = await sb.from('enrollments').select('status').eq('user_id', uData.user.id).eq('course_id', cData.id).eq('status', 'active').maybeSingle();
            if (active && enr) setHasActiveAccess(true);
          }
        }
      } catch (err: any) {
        if (active) onError(err?.message || 'Gagal memuat data kursus.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [path, onError]);

  const handleFreeEnroll = async () => {
    if (!course) return;
    setSubmitting(true);
    onError('');
    try {
      const sb = requireSupabase();
      try {
        await sb.rpc('enroll_lms_free_course', { p_course_slug: course.slug });
      } catch {}
      const { data: userData } = await sb.auth.getUser();
      if (userData?.user?.id) {
        await sb.from('enrollments').upsert({
          user_id: userData.user.id,
          course_id: course.id,
          status: 'active',
          activated_at: new Date().toISOString()
        }, { onConflict: 'user_id,course_id' });
      }
      onNavigate('/belajar/' + course.slug);
    } catch (err: any) {
      onError(err?.message || 'Gagal mengaktifkan kelas gratis.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMayarCheckout = async () => {
    if (!course) return;
    setSubmitting(true);
    onError('');
    setMayarError(null);
    try {
      const sb = requireSupabase();
      const order = await sb.rpc('create_lms_order', { p_course_slug: course.slug });
      if (order.error) throw new Error(order.error.message);

      const { data: sessionData } = await sb.auth.getSession();
      const endpoint = import.meta.env.VITE_MAYAR_CHECKOUT_ENDPOINT || '/api/mayar/create-checkout';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + (sessionData.session?.access_token || '')
        },
        body: JSON.stringify({ orderId: order.data.id })
      });
      const result = await response.json();
      if (!response.ok || !result.checkoutUrl) {
        throw new Error(result.message || 'Payment gateway Mayar sedang tahap verifikasi.');
      }
      window.location.assign(result.checkoutUrl);
    } catch (submitError: any) {
      const msg = submitError?.message || 'Checkout Mayar belum aktif.';
      setMayarError(msg);
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleWhatsAppConfirmation = async () => {
    if (!course) return;
    try {
      const sb = requireSupabase();
      await sb.rpc('create_lms_order', { p_course_slug: course.slug });
    } catch {}

    const pjRaw = course.pj_contact || '081282218903';
    let cleanPhone = pjRaw.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.slice(1);
    if (!cleanPhone.startsWith('62')) cleanPhone = '6281282218903';

    const pjName = course.pj_name || 'Admin Pusat Al Madraj';
    const userName = currentProfile?.full_name || currentUser?.user_metadata?.full_name || 'Santri/Mahasiswa';
    const userEmail = currentUser?.email || '-';

    const waText = `Assalamu'alaikum Warahmatullahi Wabarakatuh Kak ${pjName},\n\nSaya ingin mendaftar & aktivasi program Bimbel/Maddah:\n*${course.title}*\nBiaya: ${money(course.price)}\n\n*Data Akun Web:* \n- Nama: ${userName}\n- Email: ${userEmail}\n\nMohon info nomor rekening / QRIS pembayaran dan aktivasi akses kelas saya di website Al Madraj (almadraj-edu.com).\n\nJazakumullah khairan.`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading || !course) return <PublicLoading />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
      {/* Left Column: Course Overview */}
      <section className="rounded-2xl border border-[#dce9df] bg-white p-6 sm:p-8">
        <button onClick={() => onNavigate('/kelas/' + course.slug)} className="flex items-center gap-2 text-sm font-semibold text-[#607568] hover:text-[#006d77]">
          <ArrowLeft className="h-4 w-4" /> Kembali ke detail kelas
        </button>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">
          {course.price === 0 ? 'Akses Gratis' : 'Pendaftaran & Checkout'}
        </p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-[#17382c]">{course.title}</h1>
        {course.summary && <p className="mt-3 text-sm leading-relaxed text-[#607568]">{course.summary}</p>}

        <div className="mt-6 border-t border-[#e1eee4] pt-5 space-y-3">
          <Summary label="Format Pembelajaran" value={course.media_format === 'audio' ? '🎧 Audio Bimbel & Foto Saburah' : course.media_format === 'hybrid' ? '🎧 Audio + 🎬 Video' : '🎬 Video Dars & Bahasan'} />
          <Summary label="Fakultas / Maddah" value={course.faculty || 'Al-Azhar'} />
          <Summary label="Pengampu / Tutor" value={course.tutor || 'Asatidz Al Madraj'} />
          {course.pj_name && <Summary label="Koordinator Maddah (PJ)" value={`${course.pj_name} (${course.pj_contact || 'WhatsApp'})`} />}
          <Summary label="Akun Terdaftar" value={currentUser?.email || 'Akun Google'} />
          <Summary label="Total Investasi" value={course.price === 0 ? 'Gratis (Rp 0)' : money(course.price)} strong />
        </div>

        {hasActiveAccess && (
          <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-900">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
              <span>Akun Anda telah terdaftar aktif pada kelas ini!</span>
            </div>
            <button
              onClick={() => onNavigate('/belajar/' + course.slug)}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white hover:bg-[#005a63]"
            >
              Buka Ruang Belajar Sekarang <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Right Column: Payment & Activation Methods */}
      <section className="rounded-2xl bg-[#102c22] p-6 text-white sm:p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#83c5be]">
              {course.price === 0 ? 'Program Terbuka' : 'Metode Aktivasi'}
            </p>
            {course.price > 0 && (
              <span className="rounded-full bg-[#83c5be]/20 px-2.5 py-0.5 text-[11px] font-semibold text-[#83c5be]">
                Akses Terjamin
              </span>
            )}
          </div>

          <h2 className="mt-3 text-2xl font-bold">
            {course.price === 0 ? 'Mulai Belajar Sekarang' : 'Aktivasi Akses Kelas'}
          </h2>

          {course.price === 0 ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm leading-6 text-[#c5d9cf]">
                Program ini berstatus <span className="font-bold text-white">Gratis</span>. Anda dapat langsung membuka materi audio/video, foto papan tulis, dan modul tanpa pembayaran.
              </p>
              <button
                disabled={submitting}
                onClick={handleFreeEnroll}
                className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#83c5be] px-5 text-sm font-bold text-[#102c22] shadow-lg hover:bg-white active:scale-95 transition cursor-pointer"
              >
                {submitting ? 'Menyiapkan akses...' : 'Aktifkan Akses Gratis Sekarang'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {/* Primary Option: WhatsApp Confirmation (Fastest & Guaranteed) */}
              <div className="rounded-xl border border-[#83c5be]/30 bg-white/5 p-4 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-[#83c5be] font-bold text-xs uppercase tracking-wider">
                  <MessageCircle className="h-4 w-4" />
                  <span>Rekomendasi Cepat: Konfirmasi via PJ / Admin</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-[#c5d9cf]">
                  Hubungi Penanggung Jawab (PJ) Maddah atau Admin via WhatsApp untuk menerima nomor rekening transfer/QRIS, kirim bukti bayar, dan akses akun langsung diaktifkan.
                </p>
                {course.pj_name && (
                  <div className="mt-3 rounded-lg bg-black/20 p-2.5 text-xs text-[#a9cfbe]">
                    <p className="font-semibold text-white">PJ Maddah: {course.pj_name}</p>
                    <p className="mt-0.5 font-mono text-[11px]">{course.pj_contact || 'WhatsApp Admin'}</p>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleWhatsAppConfirmation}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-4 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#20bd5a] active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Daftar &amp; Konfirmasi via WhatsApp</span>
                </button>
              </div>

              {/* Secondary Option: Mayar Payment Gateway Notice */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs leading-relaxed text-[#a0baae]">
                <div className="flex items-center justify-between text-[#83c5be] font-semibold mb-1">
                  <span>Pembayaran Otomatis (Mayar)</span>
                  <span className="text-[10px] rounded bg-amber-400/20 text-amber-300 px-1.5 py-0.5">Tahap Verifikasi</span>
                </div>
                <p>
                  Gateway pembayaran instan (QRIS, VA, E-Wallet) sedang dalam integrasi final. Jika tombol di bawah belum dapat memproses, silakan gunakan konfirmasi WhatsApp di atas.
                </p>
                {mayarError && (
                  <p className="mt-2 text-amber-300 font-medium">
                    ⚠️ {mayarError} (Gunakan WhatsApp di atas)
                  </p>
                )}
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleMayarCheckout}
                  className="mt-3 flex min-h-9 w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 active:scale-95 transition cursor-pointer"
                >
                  <CreditCard className="h-3.5 w-3.5 text-[#83c5be]" />
                  <span>{submitting ? 'Menghubungkan ke Mayar...' : 'Coba Bayar Otomatis Mayar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 border-t border-white/10 pt-4 text-[11px] text-[#7ea090] flex items-center justify-between">
          <span>Official LMS Al Madraj · Kairo</span>
          <span>Bimbel Muqarrar Al-Azhar</span>
        </div>
      </section>
    </div>
  );
};

const LearningRoute = ({ path, user, onNavigate, onError }: { path: string; user: { id: string }; onNavigate: (path: string) => void; onError: (message: string) => void }) => { const [course, setCourse] = useState<Course | null>(null); const [lessons, setLessons] = useState<Lesson[]>([]); const [completed, setCompleted] = useState<string[]>([]); const [activeLesson, setActiveLesson] = useState<Lesson | null>(null); useEffect(() => { const load = async () => { const sb = requireSupabase(); const slug = path.split('/')[2]; const courseResult = await sb.from('courses').select('*').eq('slug', slug).single(); if (!courseResult.data) return; setCourse(courseResult.data); const lessonsResult = await sb.from('lessons').select('id,course_id,title,content_type,duration,sort_order').eq('course_id', courseResult.data.id).eq('is_published', true).order('sort_order'); setLessons(lessonsResult.data || []); const progressResult = await sb.from('lesson_progress').select('lesson_id').eq('user_id', user.id); setCompleted((progressResult.data || []).map((item: { lesson_id: string }) => item.lesson_id)); }; load().catch((loadError) => onError(loadError instanceof Error ? loadError.message : 'Materi gagal dimuat.')); }, [path, user.id, onError]); const toggle = async (lesson: Lesson) => { const sb = requireSupabase(); try { if (completed.includes(lesson.id)) { await sb.from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', lesson.id); setCompleted((items) => items.filter((item) => item !== lesson.id)); } else { const result = await sb.from('lesson_progress').upsert({ user_id: user.id, lesson_id: lesson.id }); if (result.error) throw new Error(result.error.message); setCompleted((items) => [...items, lesson.id]); } } catch (toggleError) { onError(toggleError instanceof Error ? toggleError.message : 'Progress gagal disimpan.'); } }; if (!course) return <PublicLoading />; return <BackendShell profile={null} onNavigate={onNavigate} onLogout={() => undefined}><div className="space-y-6"><button onClick={() => onNavigate('/dashboard')} className="flex items-center gap-2 text-sm font-semibold text-[#607568]"><ArrowLeft className="h-4 w-4" /> Kembali ke dashboard</button><section className="rounded-2xl bg-[#102c22] p-6 text-white sm:p-9"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#83c5be]">Ruang belajar</p><h1 className="mt-3 text-3xl font-semibold sm:text-5xl">{course.title}</h1><div className="mt-6 flex justify-between text-xs text-[#b7d0c3]"><span>Progress tersimpan di database</span><span>{completed.length}/{lessons.length} selesai</span></div><div className="mt-2 h-2 rounded-full bg-white/15"><div className="h-2 rounded-full bg-[#83c5be]" style={{ width: (completed.length / Math.max(lessons.length, 1)) * 100 + '%' }} /></div></section><section className="rounded-2xl border border-[#dce9df] bg-white p-6 sm:p-8"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Materi pertemuan</p><h2 className="mt-2 text-2xl font-semibold">{lessons.length} materi tersedia</h2></div></div><div className="mt-6 divide-y divide-[#e1eee4]">{lessons.map((lesson) => <div key={lesson.id} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><button onClick={() => toggle(lesson)} aria-label="Tandai selesai" className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ' + (completed.includes(lesson.id) ? 'border-[#006d77] bg-[#006d77] text-white' : 'border-[#cfe0d5] text-[#799083]')}>{completed.includes(lesson.id) && <Check className="h-4 w-4" />}</button><div><p className="text-sm font-semibold">{lesson.title}</p><p className="mt-1 text-xs text-[#799083]">{lesson.content_type} · {lesson.duration}</p></div></div><button onClick={() => setActiveLesson(lesson)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#cfe0d5] text-[#006d77]" aria-label="Buka materi">{lesson.content_type === 'video' ? <CirclePlay className="h-4 w-4" /> : <FileText className="h-4 w-4" />}</button></div>)}</div></section>{activeLesson && <ProductionContentModal lesson={activeLesson} onClose={() => setActiveLesson(null)} />}</div></BackendShell>; };

const ProductionContentModal = ({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) => <div className="fixed inset-0 z-[80] grid place-items-center bg-[#102c22]/45 px-4 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section role="dialog" aria-modal="true" aria-labelledby="content-modal-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#d4e1d8] bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006d77]">{lesson.content_type} · {lesson.duration}</p><h2 id="content-modal-title" className="mt-2 text-2xl font-semibold">{lesson.title}</h2></div><button onClick={onClose} aria-label="Tutup materi" title="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568]"><X className="h-4 w-4" /></button></div><div className="mt-5 rounded-2xl bg-[#102c22] p-5 text-white"><div className="flex aspect-video items-center justify-center rounded-xl bg-[#0d2f2b]">{lesson.content_type === 'video' ? <CirclePlay className="h-12 w-12 text-[#83c5be]" /> : <FileText className="h-12 w-12 text-[#83c5be]" />}</div><p className="mt-4 text-sm leading-6 text-[#c5d9cf]">Konten materi akan dimuat dari storage Supabase setelah file atau URL materi tersedia.</p></div><button onClick={onClose} className="mt-5 flex min-h-10 w-full items-center justify-center rounded-full bg-[#006d77] text-sm font-bold text-white">Tutup materi</button></section></div>;

const AdminRoute = ({ onError }: { onError: (message: string) => void }) => { const [rows, setRows] = useState<any[]>([]); useEffect(() => { requireSupabase().from('enrollments').select('id,status,created_at,profiles(full_name),courses(title,faculty)').order('created_at', { ascending: false }).then(({ data, error }: { data: any[] | null; error: { message: string } | null }) => { if (error) onError(error.message); else setRows(data || []); }); }, [onError]); return <div className="space-y-6"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Panel admin</p><h1 className="mt-2 text-3xl font-semibold sm:text-5xl">Pendaftaran peserta</h1></div><section className="overflow-x-auto rounded-2xl border border-[#dce9df] bg-white p-6 sm:p-8"><table className="w-full min-w-[700px] text-left text-sm"><thead className="border-b border-[#e1eee4] text-xs uppercase tracking-[0.12em] text-[#799083]"><tr><th className="pb-3">Peserta</th><th className="pb-3">Program</th><th className="pb-3">Status</th><th className="pb-3">Tanggal</th></tr></thead><tbody className="divide-y divide-[#e1eee4]">{rows.map((row) => <tr key={row.id}><td className="py-4 font-semibold">{row.profiles?.full_name || '-'}</td><td className="py-4">{row.courses?.title || '-'}</td><td className="py-4 text-[#006d77]">{row.status}</td><td className="py-4 text-[#607568]">{new Date(row.created_at).toLocaleDateString('id-ID')}</td></tr>)}</tbody></table>{!rows.length && <p className="pt-5 text-sm text-[#607568]">Belum ada enrollment.</p>}</section></div>; };

const CatalogRoute = ({ profile, onNavigate, onError, onLogout }: { profile: Profile | null; onNavigate: (path: string) => void; onError: (message: string) => void; onLogout: () => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledSlugs, setEnrolledSlugs] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [programType, setProgramType] = useState<'Semua' | ProgramType | 'Gratis'>('Semua');
  const [faculty, setFaculty] = useState('Semua');
  const [sortBy, setSortBy] = useState<'featured' | 'free_first' | 'paid_first' | 'lessons'>('featured');
  const [loading, setLoading] = useState(true);
  const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);
  const [paymentModalCourse, setPaymentModalCourse] = useState<Course | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const sb = requireSupabase();
        const { data, error } = await sb
          .from('courses')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });

        if (error) onError(error.message);
        if (active) setCourses((data || []) as Course[]);

        if (profile?.id) {
          const { data: enrollments } = await sb
            .from('enrollments')
            .select('courses(slug), status')
            .eq('user_id', profile.id)
            .eq('status', 'active');
          if (active && enrollments) {
            const slugs = (enrollments as any[])
              .map((item) => item.courses?.slug)
              .filter(Boolean) as string[];
            setEnrolledSlugs(slugs);
          }
        }
      } catch (loadError) {
        if (active) onError(loadError instanceof Error ? loadError.message : 'Katalog gagal dimuat.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [profile?.id, onError]);

  const faculties = ['Semua', ...Array.from(new Set(courses.map((course) => course.faculty)))];

  const visibleCourses = useMemo(() => {
    let filtered = courses.filter((course) => {
      const detail = getCourseDetail(course.slug);
      const isFree = course.price === 0;

      let matchesProgramType = true;
      if (programType === 'Gratis') {
        matchesProgramType = isFree;
      } else if (programType !== 'Semua') {
        matchesProgramType = (course.program_type || 'Dars') === programType;
      }

      const matchesFaculty = faculty === 'Semua' || course.faculty === faculty;
      const tutorName = getCourseTutorName(course.slug, course.tutor);
      const searchableText = `${course.title} ${course.faculty} ${course.summary} ${tutorName} ${detail?.kitabName || ''} ${detail?.authorName || ''}`.toLowerCase();
      const matchesQuery = !query.trim() || searchableText.includes(query.toLowerCase().trim());

      return matchesProgramType && matchesFaculty && matchesQuery;
    });

    if (sortBy === 'free_first') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'paid_first') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'lessons') {
      filtered = [...filtered].sort((a, b) => {
        const numA = parseInt(a.duration) || 0;
        const numB = parseInt(b.duration) || 0;
        return numB - numA;
      });
    }

    return filtered;
  }, [courses, programType, faculty, query, sortBy]);

  const handleSelectQuickTag = (tag: string) => {
    if (tag === 'Semua') {
      setQuery('');
      setProgramType('Semua');
      setFaculty('Semua');
    } else if (tag === 'Gratis') {
      setProgramType('Gratis');
    } else if (tag === 'Syariah' || tag === 'Ushuluddin' || tag === 'Lughah Arabiyyah') {
      setFaculty(tag);
    } else {
      setQuery(tag);
    }
  };

  return (
    <BackendShell profile={profile} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-6">
        {/* Open Editorial Hero Header (No Heavy Box Container) */}
        <section className="relative pt-2 pb-5 sm:pt-4 sm:pb-7">
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute left-1/2 -top-20 -translate-x-1/2 h-64 w-full max-w-4xl rounded-full bg-emerald-100/40 blur-3xl -z-10" />

          <div className="text-center max-w-3xl mx-auto px-2">
            {/* Elegant Editorial Eyebrow */}
            <p className="text-[11.5px] sm:text-xs font-semibold uppercase tracking-[0.22em] text-[#006d77] mb-3">
              Kurikulum Muqarrar Al-Azhar Kairo · Dars Turats &amp; Bimbel Imtihan
            </p>

            {/* Editorial Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-tight text-[#0f2d22] leading-[1.18]">
              Katalog Program &amp; Muqarrar Kuliah
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#4f6d5e] max-w-2xl mx-auto font-normal">
              Ruang belajar digital untuk dars muqarrar turats dan pendampingan imtihan Universitas Al-Azhar Kairo bersama para asatidz alumni Mesir.
            </p>

            {/* Minimalist Horizontal Metric Strip */}
            <div className="mt-4.5 inline-flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#466856]">
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[#006d77]">{courses.length}</span> Program Aktif
              </span>
              <span className="text-[#c1d9cc] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[#006d77]">100%</span> Muqarrar Turats
              </span>
              <span className="text-[#c1d9cc] hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="font-bold text-[#006d77]">Aktivasi Instan</span> Otomatis
              </span>
            </div>

            {/* Floating Hero Spotlight Search Bar */}
            <div className="mt-7 max-w-2xl mx-auto">
              <label className="relative flex min-h-13 w-full items-center gap-3 rounded-full border border-[#c4dcce] bg-white px-5 text-sm text-[#3b5949] shadow-[0_8px_30px_rgba(7,84,71,0.06)] transition-all focus-within:border-[#006d77] focus-within:ring-3 focus-within:ring-[#006d77]/10">
                <Search className="h-5 w-5 shrink-0 text-[#167a5b]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari judul maddah, kitab, fakultas, atau tutor..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-[#133227] outline-none placeholder:text-[#90a89b]"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e3efe7] text-[11px] text-[#557263] hover:bg-[#d5e8dc]"
                    title="Hapus pencarian"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <span className="hidden whitespace-nowrap text-xs font-medium text-[#6a8777] sm:inline-flex">
                  {visibleCourses.length} Program
                </span>
              </label>

              {/* Clickable Quick Tags Under Search (Clean Text Style, No Clunky Badges) */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1.5 text-xs">
                <span className="text-[11px] font-medium text-[#7d9788]">Pencarian Cepat:</span>
                {[
                  { label: 'Semua', value: 'Semua' },
                  { label: 'Fikih Abi Syuja\'', value: 'Abi Syuja' },
                  { label: 'Aqidah Ithaf', value: 'Ithaf' },
                  { label: 'Kajian Tajwid', value: 'Tajwid' },
                  { label: 'Gratis', value: 'Gratis' },
                  { label: 'Syariah', value: 'Syariah' },
                  { label: 'Ushuluddin', value: 'Ushuluddin' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => handleSelectQuickTag(chip.value)}
                    className="text-[11.5px] font-medium text-[#4f6f5e] transition hover:text-[#006d77] hover:underline underline-offset-4 cursor-pointer"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Modern Structured Filter Toolbar */}
        <div className="space-y-3.5 border-b border-[#e1ece4] pb-4.5">
          {/* Top Tier: Program Type Tabs (Left) + Sorting Dropdown (Right) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Program Type Tabs (Never wraps awkwardly, horizontal scroll on mobile) */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5" role="tablist">
              {[
                { key: 'Semua', label: 'Semua Program', icon: null },
                { key: 'Dars', label: 'Dars Turats', icon: BookOpen },
                { key: 'Bimbel', label: 'Bimbel Imtihan', icon: Target },
                { key: 'Gratis', label: 'Program Gratis', icon: Sparkles },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = programType === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setProgramType(item.key as any)}
                    aria-pressed={isSelected}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-[#006d77] text-white shadow-xs'
                        : 'border border-[#d6e5dc] bg-white text-[#4f6f5e] hover:border-[#006d77] hover:text-[#006d77]'
                    }`}
                  >
                    {Icon && <Icon className="h-3.5 w-3.5 stroke-[1.8]" />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sorting Filter (Right aligned) */}
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <span className="hidden text-xs text-[#718f7f] md:inline">Urutkan:</span>
              <div className="flex items-center gap-1.5 rounded-full border border-[#cfe2d6] bg-white px-3.5 py-1.5 text-xs shadow-2xs hover:border-[#006d77] transition">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#167a5b]" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#183a2d] outline-none cursor-pointer pr-1"
                  aria-label="Urutan katalog"
                >
                  <option value="featured">Rekomendasi</option>
                  <option value="free_first">Gratis Duluan</option>
                  <option value="paid_first">Investasi Berbayar</option>
                  <option value="lessons">Pertemuan Terbanyak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bottom Tier: Faculty Chips Filter + Items Count */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#799484] shrink-0">
                Fakultas:
              </span>
              <div className="flex items-center gap-1.5">
                {faculties.map((item) => {
                  const active = faculty === item;
                  const norm = item.toLowerCase();
                  const dotColor = norm.includes('syariah')
                    ? 'bg-[#10b981]'
                    : norm.includes('ushuluddin')
                    ? 'bg-[#0ea5e9]'
                    : 'bg-[#84cc16]';
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFaculty(item)}
                      aria-pressed={active}
                      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        active
                          ? 'border border-[#006d77] bg-[#006d77] text-white shadow-xs'
                          : 'border border-[#d0e3d7] bg-white text-[#4e6e5d] hover:border-[#006d77] hover:text-[#006d77]'
                      }`}
                    >
                      {item !== 'Semua' && <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-white' : dotColor}`} />}
                      <span>{item === 'Semua' ? 'Semua Fakultas' : item}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total Count & Reset Trigger */}
            <div className="flex items-center gap-3 text-xs text-[#6e8a7c]">
              <span>Menampilkan <strong className="text-[#006d77]">{visibleCourses.length}</strong> program</span>
              {(faculty !== 'Semua' || programType !== 'Semua' || query) && (
                <button
                  type="button"
                  onClick={() => {
                    setFaculty('Semua');
                    setProgramType('Semua');
                    setQuery('');
                  }}
                  className="font-semibold text-[#b45309] hover:underline cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content Listing Grid */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[24px] border border-[#dce9df] bg-white p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[#006d77]" />
            <p className="mt-3 text-sm font-semibold text-[#143428]">Memuat katalog program Al Madraj...</p>
            <p className="mt-1 text-xs text-[#6e8a7c]">Sinkronisasi data muqarrar &amp; dars turats.</p>
          </div>
        ) : visibleCourses.length ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-6 lg:grid-cols-3">
            {visibleCourses.map((course) => (
              <CatalogCourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledSlugs.includes(course.slug)}
                onOpenDetail={() => setSelectedDetailCourse(course)}
                onOpenCoursePage={() => onNavigate('/kelas/' + course.slug)}
                onDirectBuy={() => {
                  if (course.price === 0) {
                    if (profile?.id) {
                      const sb = requireSupabase();
                      void sb.rpc('enroll_lms_free_course', { p_course_slug: course.slug });
                      void sb.from('enrollments').upsert({
                        user_id: profile.id,
                        course_id: course.id,
                        status: 'active',
                        activated_at: new Date().toISOString(),
                      }, { onConflict: 'user_id,course_id' });
                    }
                    onNavigate('/belajar/' + course.slug);
                  } else {
                    setPaymentModalCourse(course);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-[#b9d4c4] bg-[#f8fcf9] p-12 text-center shadow-xs">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c5e1cf] bg-white text-[#006d77] shadow-xs">
              <BookOpen className="h-6 w-6 text-[#006d77]" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-[#143428]">
              {query
                ? `Tidak ada program yang cocok dengan "${query}"`
                : programType === 'Bimbel'
                ? 'Belum ada kelas Bimbel yang dipublikasikan.'
                : 'Kelas tidak ditemukan'}
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5c7768]">
              {programType === 'Bimbel'
                ? 'Jadwal bimbingan intensif imtihan akan segera dibuka menjelang masa ujian kuliah Al-Azhar.'
                : 'Coba ubah kata kunci pencarian, pilih semua program, atau reset filter fakultas.'}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => { setQuery(''); setProgramType('Semua'); setFaculty('Semua'); setSortBy('featured'); }}
                className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#064439] transition-all active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Semua Filter</span>
              </button>
              <button
                onClick={() => { setQuery(''); setProgramType('Gratis'); setFaculty('Semua'); }}
                className="inline-flex items-center gap-2 rounded-full border border-[#cfe2d6] bg-white px-4 py-2.5 text-xs font-bold text-[#006d77] hover:bg-[#eef7f2] transition-all active:scale-95"
              >
                <span>Lihat Program Gratis</span>
              </button>
            </div>
          </div>
        )}

        {/* Quick Detail Modal */}
        {selectedDetailCourse && (
          <CatalogDetailModal
            course={selectedDetailCourse}
            isEnrolled={enrolledSlugs.includes(selectedDetailCourse.slug)}
            onClose={() => setSelectedDetailCourse(null)}
            onOpenFullPage={() => {
              const slug = selectedDetailCourse.slug;
              setSelectedDetailCourse(null);
              onNavigate('/kelas/' + slug);
            }}
            onEnroll={() => {
              const crs = selectedDetailCourse;
              setSelectedDetailCourse(null);
              if (crs.price === 0) {
                onNavigate('/belajar/' + crs.slug);
              } else {
                setPaymentModalCourse(crs);
              }
            }}
          />
        )}

        {/* 1-Click Mayar Payment Modal */}
        {paymentModalCourse && (
          <MayarPaymentModal
            course={{
              id: paymentModalCourse.slug,
              title: paymentModalCourse.title,
              price: paymentModalCourse.price,
              faculty: paymentModalCourse.faculty,
              programType: paymentModalCourse.program_type,
              tutor: paymentModalCourse.tutor,
              lessons: paymentModalCourse.duration,
            }}
            onClose={() => setPaymentModalCourse(null)}
            onSuccessRedirect={(slug) => {
              setPaymentModalCourse(null);
              onNavigate('/belajar/' + slug);
            }}
          />
        )}
      </div>
    </BackendShell>
  );
};

const CatalogCourseCard = ({
  course,
  isEnrolled,
  onOpenDetail,
  onOpenCoursePage,
  onDirectBuy,
}: {
  course: Course;
  isEnrolled?: boolean;
  onOpenDetail: () => void;
  onOpenCoursePage: () => void;
  onDirectBuy: () => void;
}) => {
  const theme = getFacultyVisual(course.faculty);
  const detail = getCourseDetail(course.slug);
  const isFree = course.price === 0;

  return (
    <article
      onClick={isEnrolled ? onOpenCoursePage : onOpenDetail}
      className="group relative flex h-full flex-col overflow-hidden rounded-[16px] sm:rounded-[22px] border border-[#dce8df] bg-white shadow-[0_3px_16px_rgba(7,84,71,0.04)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-[#10b981]/50 hover:shadow-[0_16px_36px_rgba(7,84,71,0.10)] cursor-pointer"
    >
      {/* Top Faculty Banner / Course Cover with exact ratio 116.501mm : 65.024mm */}
      <div
        className={`relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br ${theme.bannerGradient} text-white`}
        style={{ aspectRatio: '116501 / 65024' }}
      >
        {(getCourseCoverImage(course.slug || course.title, course.faculty) || course.thumbnail || course.thumbnail_url) ? (
          <img
            src={getCourseCoverImage(course.slug || course.title, course.faculty) || course.thumbnail || course.thumbnail_url}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.src.includes('cover-fikih')) {
                target.src = '/courses/cover-fikih-matan-abi-syuja.png';
              }
            }}
          />
        ) : (
          <div className="flex h-full w-full flex-col justify-between p-3 sm:p-4">
            {/* Subtle Islamic Geometric Watermark */}
            <IslamicPatternWatermark className="text-white/[0.13] -right-7 -top-7 h-44 w-44" />

            {/* Ambient Glow */}
            <div className="pointer-events-none absolute -left-8 -bottom-8 h-28 w-28 rounded-full bg-white/5 blur-2xl" />

            {/* Top Row: Dars • Fakultas & Thin Book Icon */}
            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <span className="text-[10px] sm:text-[12px] font-medium tracking-tight sm:tracking-wide text-white/90 truncate">
                {course.program_type || 'Dars'} • {theme.shortName}
              </span>
              <div className="flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80 transition-transform duration-300 group-hover:scale-110">
                <BookOpen className="h-3 w-3 sm:h-3.5 sm:w-3.5 stroke-[1.8]" />
              </div>
            </div>

            {/* Bottom Row: CirclePlay & Lessons Duration */}
            <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 text-[9.5px] sm:text-[11.5px] font-medium text-white/85 truncate">
              <CirclePlay className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-white/80 shrink-0" />
              <span className="truncate">{course.duration || '20 pertemuan'}</span>
              <span className="hidden sm:inline"> · {isFree ? 'Video & materi gratis' : 'Video & pembahasan'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="flex flex-1 flex-col p-3 sm:p-5 text-left">
        {/* Judul Maddah / Program */}
        <h3 className="text-xs sm:text-[17px] font-bold leading-tight sm:leading-snug tracking-tight text-[#143428] transition-colors group-hover:text-[#006d77] line-clamp-2 min-h-[32px] sm:min-h-[46px]">
          {course.title}
        </h3>

        {/* Ringkasan / Summary */}
        <p className="mt-1 sm:mt-2 text-[11px] sm:text-[12.5px] leading-relaxed text-[#597365] line-clamp-1 sm:line-clamp-2 min-h-0 sm:min-h-[36px]">
          {course.summary}
        </p>

        {/* Elegant Hairline Metadata Divider */}
        <div className="mt-2.5 sm:mt-4.5 pt-2 sm:pt-3.5 border-t border-[#eaf1ec] flex items-center justify-between text-xs text-[#527061]">
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 pr-1">
            <UserRound className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#86a292] shrink-0" />
            <span className="truncate font-medium text-[10.5px] sm:text-[12px]">{getCourseTutorName(course.slug, course.tutor)}</span>
          </div>
          <span className="hidden sm:inline text-[11.5px] font-medium text-[#739282] shrink-0">
            {isFree ? 'Kajian Terbuka' : 'Materi Terstruktur'}
          </span>
        </div>

        {/* Footer: Investasi / Akses & Tombol Aksi */}
        <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between sm:pt-5">
          <div className="min-w-0">
            <p className="text-[8.5px] sm:text-[10px] font-medium uppercase tracking-wider text-[#789585]">
              {isFree ? 'AKSES' : 'INVESTASI'}
            </p>
            <p className="mt-0.5 text-xs sm:text-xl font-extrabold tracking-tight text-[#006d77] truncate">
              {isFree ? 'Gratis' : money(course.price)}
            </p>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (isEnrolled) {
                onOpenCoursePage();
              } else {
                onOpenDetail();
              }
            }}
            className="group/btn inline-flex w-full sm:w-auto items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-full bg-[#006d77] py-1.5 px-2 sm:pl-3.5 sm:pr-3 sm:py-2 text-[11px] sm:text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#00565e] hover:shadow-sm active:scale-95 cursor-pointer"
          >
            <span>{isEnrolled ? 'Buka Kelas' : 'Lihat Kelas'}</span>
            <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 shrink-0" />
          </button>
        </div>
      </div>
    </article>
  );
};

const CatalogDetailModal = ({
  course,
  isEnrolled,
  onClose,
  onOpenFullPage,
  onEnroll,
}: {
  course: Course;
  isEnrolled?: boolean;
  onClose: () => void;
  onOpenFullPage: () => void;
  onEnroll: () => void;
}) => {
  const theme = getFacultyVisual(course.faculty);
  const detail = getCourseDetail(course.slug);
  const [activeTab, setActiveTab] = useState<'silabus' | 'ikhtisar' | 'tutor' | 'fasilitas'>('silabus');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const isFree = course.price === 0;
  const hasAccess = isFree || Boolean(isEnrolled);

  const kitabName = detail?.kitabName || course.title;
  const authorName = detail?.authorName || 'Ulama Ahlussunnah';
  const tutorName = getCourseTutorName(course.slug, detail?.tutorName || course.tutor);
  const tutorTitle = detail?.tutorTitle || 'Pengajar Turats Islam';
  const tutorBio = detail?.tutorBio || 'Alumni Universitas Al-Azhar Kairo yang membimbing pembahasan materi kitab turats dan persiapan imtihan.';
  const tutorAlmamater = detail?.tutorAlmamater || 'Universitas Al-Azhar, Kairo';
  const lessons = detail?.lessons || [];
  const outcomes = detail?.outcomes || [
    'Memahami ibarat turats dan konsep dasar materi secara runtut.',
    'Mempersiapkan diri lebih matang sebelum menghadapi imtihan muqarrar.',
    'Mendapatkan panduan langsung dari asatidz alumni Al-Azhar Kairo.',
  ];
  const targetAudience = detail?.targetAudience || [
    'Mahasiswa Al-Azhar yang sedang menempuh maddah terkait.',
    'Santri dan pembelajar ilmu Islam yang ingin belajar secara terarah.',
  ];
  const facilities = detail?.facilities || [
    'Akses rekaman video pembelajaran beresolusi tinggi',
    'Diktat teks matan & catatan faedah ibarat kitab',
    'Tersimpan di dashboard akun mahasiswa Al Madraj',
    'Akses fleksibel tanpa batas waktu',
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-xs sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="catalog-modal-title"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[26px] border border-[#d6e7dc] bg-white shadow-2xl">
        {/* Header Modal with Clean Solid Brand Color #006d77 */}
        <div className="relative overflow-hidden bg-[#006d77] p-5 text-white sm:p-7">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              {/* Clean Noble Metadata Header (No Badges) */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-white/80">
                <span className="font-bold tracking-wider uppercase text-white">{course.faculty}</span>
                <span className="text-white/40">·</span>
                <span>{course.program_type || 'Dars'}</span>
                <span className="text-white/40">·</span>
                <span>{course.duration}</span>
                {course.price === 0 && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="font-bold text-[#83c5be]">Akses Gratis</span>
                  </>
                )}
              </div>

              <h2 id="catalog-modal-title" className="text-xl font-bold leading-snug sm:text-2xl">
                {course.title}
              </h2>

              <p className="text-xs text-[#bfe8d4] flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold text-white">{kitabName}</span>
                <span>({authorName})</span>
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition active:scale-95 cursor-pointer"
              aria-label="Tutup pratinjau"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="relative z-10 mt-6 flex gap-2 border-b border-white/15 overflow-x-auto text-xs">
            {[
              { id: 'silabus', label: `Silabus (${lessons.length || course.duration})` },
              { id: 'ikhtisar', label: 'Ikhtisar & Faedah' },
              { id: 'tutor', label: 'Pengajar' },
              { id: 'fasilitas', label: 'Fasilitas' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2.5 px-3 font-bold whitespace-nowrap transition-colors border-b-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[#83c5be] text-white'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {activeTab === 'silabus' && (
            <div className="space-y-4">
              {/* Video Player when active and user has access (free or enrolled) */}
              {hasAccess && playingVideoId && (
                <div className="overflow-hidden rounded-2xl border border-[#cfe2d6] bg-black shadow-md">
                  <div className="flex items-center justify-between bg-[#122e23] px-4 py-2 text-xs text-white">
                    <span className="flex items-center gap-1.5 font-semibold text-[#83c5be]">
                      <CirclePlay className="h-3.5 w-3.5 text-[#5eead4]" />
                      Pemutar Video Kajian
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlayingVideoId(null)}
                      className="rounded-md bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/20 transition cursor-pointer"
                    >
                      Tutup Video
                    </button>
                  </div>
                  <div className="relative aspect-video w-full">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${playingVideoId}?autoplay=1&rel=0`}
                      title="Pemutar Video Kajian"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                    />
                  </div>
                </div>
              )}

              {/* Protected Paid Class Banner: Never show full video before purchase */}
              {!hasAccess && (
                <div className="flex flex-col sm:flex-row items-center gap-4 rounded-2xl border border-amber-200/90 bg-gradient-to-r from-[#fefcf8] via-white to-[#f7fbf8] p-4 sm:p-5 shadow-xs">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100/70 text-[#966314]">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="text-[11px] font-bold text-[#8c5a08] uppercase tracking-wider">
                        Materi Pembelajaran Terkunci
                      </span>
                      <span className="text-xs font-semibold text-[#6d8878]">
                        Investasi: {money(course.price)}
                      </span>
                    </div>
                    <h4 className="mt-1 text-sm font-bold text-[#17382c]">
                      Akses Video &amp; Rekaman Kitab Terbuka Setelah Pendaftaran
                    </h4>
                    <p className="mt-0.5 text-xs text-[#597566]">
                      Daftar program ini untuk membuka seluruh materi video pembelajaran, diktat catatan faedah, dan pelacakan progres belajar.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onEnroll}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#096353] transition active:scale-[0.98] cursor-pointer"
                  >
                    <span>Daftar / Beli Sekarang</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Alur Pembahasan Muqarrar
                </p>
                <p className="mt-1 text-xs text-[#5f7b6c]">
                  Materi disusun bertahap mulai dari muqaddimah hingga bab-bab penting yang diujikan dalam imtihan Al-Azhar.
                </p>
              </div>

              <div className="divide-y divide-[#edf4ef] rounded-2xl border border-[#dce9df] bg-[#f9fbf9]">
                {lessons.length ? (
                  lessons.map((lesson, idx) => (
                    <div
                      key={lesson.youtubeId || idx}
                      className="flex items-start justify-between gap-3 p-3.5 transition hover:bg-white"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e3efe7] text-xs font-bold text-[#006d77]">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#143428] leading-tight">
                            {lesson.title}
                          </p>
                          {lesson.description && (
                            <p className="mt-0.5 text-[11px] text-[#5e796b] line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                          <span className="mt-1 inline-block text-[10px] font-medium text-[#7d9789]">
                            {hasAccess ? (lesson.duration || 'Video Kajian') : 'Materi Eksklusif · Terkunci'}
                          </span>
                        </div>
                      </div>

                      {/* Video Action: Play for Free/Enrolled, Locked for Paid */}
                      {hasAccess && lesson.youtubeId ? (
                        <button
                          type="button"
                          onClick={() => setPlayingVideoId(lesson.youtubeId)}
                          className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#006d77] hover:text-[#06382e] hover:underline transition cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Putar Video</span>
                        </button>
                      ) : !hasAccess ? (
                        <button
                          type="button"
                          onClick={onEnroll}
                          className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#8a5b0b] hover:text-[#644207] hover:underline transition cursor-pointer"
                          title="Daftar kelas untuk membuka materi ini"
                        >
                          <Lock className="h-3 w-3 text-[#996515]" />
                          <span>Terkunci</span>
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-[#6e8a7c]">
                    Silabus lengkap terdiri dari {course.duration} pembahasan materi bertahap.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ikhtisar' && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Deskripsi &amp; Orientasi Belajar
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#355244]">
                  {detail?.overview || course.summary}
                </p>
              </div>

              <div className="rounded-2xl border border-[#dce9df] bg-[#f4faf6] p-4 sm:p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Target Capaian Pembelajaran
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {outcomes.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#2b4d3c]">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#10b981]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Program Ini Tepat Untuk:
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-[#446654]">
                  {targetAudience.map((target, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#006d77]" />
                      <span>{target}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tutor' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-2xl border border-[#dce9df] bg-[#f7fbf8] p-4 sm:p-5">
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${theme.avatarBg} text-lg font-bold text-white shadow-md`}>
                  {tutorName
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#143428] flex items-center gap-1.5">
                    {tutorName}
                    <ShieldCheck className="h-4 w-4 text-[#10b981]" />
                  </h3>
                  <p className="text-xs font-semibold text-[#006d77] mt-0.5">{tutorTitle}</p>
                  <p className="text-[11px] text-[#698777] mt-0.5 flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5 text-[#167a5b]" />
                    {tutorAlmamater}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#edf4ef] p-4 text-xs leading-relaxed text-[#3a5948]">
                <p className="font-bold text-[#143428] mb-1">Profil &amp; Dedikasi Pengajar</p>
                <p>{tutorBio}</p>
              </div>
            </div>
          )}

          {activeTab === 'fasilitas' && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006d77]">
                  Fasilitas Belajar yang Diperoleh
                </p>
                <p className="mt-1 text-xs text-[#5f7b6c]">
                  Seluruh materi dan kemudahan belajar terintegrasi langsung di akun mahasiswa Al Madraj.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {facilities.map((fac, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-[#dce9df] bg-[#f8fbf9] p-3.5 text-xs text-[#234b38]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#e3efe7] text-[#006d77]">
                      <Check className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{fac}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#edf4ef] bg-[#f7fbf8] p-4 sm:p-5">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a9586]">
              {course.price === 0 ? 'Format Akses' : 'Investasi Program'}
            </p>
            <p className="text-xl font-bold text-[#006d77]">
              {course.price === 0 ? 'Gratis' : money(course.price)}
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onOpenFullPage}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border border-[#cfe0d5] bg-white px-4 py-2.5 text-xs font-bold text-[#2d5643] hover:border-[#006d77] transition active:scale-95"
            >
              <span>Halaman Lengkap</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>

            {isEnrolled ? (
              <button
                type="button"
                onClick={onOpenFullPage}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#00565e] transition active:scale-95"
              >
                <span>Buka Ruang Belajar</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onEnroll}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-[#006d77] px-6 py-2.5 text-xs font-bold text-white shadow-[0_4px_14px_rgba(7,84,71,0.2)] hover:bg-[#096353] transition active:scale-95"
              >
                {course.price === 0 ? (
                  <>
                    <span>Mulai Belajar Sekarang</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <span>Daftar / Beli Sekarang</span>
                    <CreditCard className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


const DashboardSidebarLink = ({ icon: Icon, label, active = false, onClick }: { icon: React.ElementType; label: string; active?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={'flex min-h-12 w-full items-center gap-3.5 rounded-full px-4 text-left text-xs transition-all duration-200 cursor-pointer ' + (active ? 'bg-[#83c5be] text-[#00201a] font-bold shadow-2xs' : 'text-[#3f4945] hover:bg-[#eef4f0] hover:text-[#181c1a] font-medium')}
  >
    <Icon className={'h-4 w-4 shrink-0 ' + (active ? 'text-[#00201a]' : 'text-[#52605a]')} />
    <span className="tracking-wide">{label}</span>
  </button>
);

const DashboardSidebar = ({ profile, currentPath, open, onNavigate, onLogout, onProfileClick }: { profile: Profile | null; currentPath: string; open: boolean; onNavigate: (path: string) => void; onLogout: () => void; onProfileClick: () => void }) => {
  const name = profile?.full_name?.trim() || 'Pengguna';
  const avatarUrl = profile?.avatar_url;
  const roleLabel = profile?.role === 'admin' ? 'Khadim Majelis (Admin)' : 'Mahasiswa Aktif Al-Azhar';

  return (
    <aside className={'fixed left-0 top-[64px] z-40 h-[calc(100dvh-64px)] w-[min(84vw,280px)] border-r border-[#e2ece5] bg-[#fbfcfb] transition-transform duration-200 lg:w-[224px] ' + (open ? 'translate-x-0' : '-translate-x-full')}>
      <div className="flex h-full flex-col overflow-hidden px-3.5 py-5">
        {/* User Card */}
        <button
          type="button"
          onClick={onProfileClick}
          className="flex items-center gap-3 rounded-[18px] bg-white border border-[#e2ece5] p-3 text-left hover:border-[#006d77]/40 hover:shadow-xs transition cursor-pointer group"
          aria-label="Atur foto dan nama profil"
        >
          <UserAvatar
            src={avatarUrl}
            name={name}
            size="md"
            className="ring-2 ring-white"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-bold text-[#181c1a] group-hover:text-[#006d77] transition">{name}</span>
            <span className="mt-0.5 block truncate text-[10px] font-medium text-[#52605a]">{roleLabel}</span>
          </span>
          <Pencil className="ml-auto h-3.5 w-3.5 shrink-0 text-[#717e78] group-hover:text-[#006d77] transition" />
        </button>

        {/* Menu Utama */}
        <div className="px-1 pt-6">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#52605a]">Menu utama</p>
          <nav className="mt-2.5 grid gap-1" aria-label="Navigasi dashboard">
            <DashboardSidebarLink icon={LayoutDashboard} label="Ringkasan" active={currentPath === '/dashboard'} onClick={() => onNavigate('/dashboard')} />
            <DashboardSidebarLink icon={BookOpen} label="Katalog program" active={currentPath === '/kelas' || currentPath.startsWith('/kelas/')} onClick={() => onNavigate('/kelas')} />
            <DashboardSidebarLink icon={CirclePlay} label="Ruang belajar" active={currentPath === '/belajar' || currentPath.startsWith('/belajar/')} onClick={() => onNavigate('/belajar')} />
            <DashboardSidebarLink icon={CreditCard} label="Transaksi" active={currentPath === '/transaksi'} onClick={() => onNavigate('/transaksi')} />
            {profile?.role === 'admin' && <DashboardSidebarLink icon={ShieldCheck} label="Panel admin" active={currentPath === '/admin'} onClick={() => onNavigate('/admin')} />}
          </nav>
        </div>

        {/* Akun */}
        <div className="mt-6 px-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-[#52605a]">Akun</p>
          <nav className="mt-2.5 grid gap-1" aria-label="Navigasi akun">
            <DashboardSidebarLink icon={Settings2} label="Pengaturan" active={currentPath === '/pengaturan'} onClick={() => onNavigate('/pengaturan')} />
          </nav>
        </div>

        {/* Logout */}
        <div className="mt-auto border-t border-[#bfc9c3]/40 px-2 pt-4">
          <button onClick={onLogout} className="flex min-h-10 w-full items-center gap-2.5 rounded-full px-3 text-xs font-semibold text-[#52605a] hover:bg-[#ffdad6] hover:text-[#ba1a1a] transition cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

const ProfileQuickEdit = ({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: (profile: Profile) => void }) => {
  const [name, setName] = useState(profile.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<Blob | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);
  useEffect(() => () => { if (avatarUrl.startsWith('blob:')) URL.revokeObjectURL(avatarUrl); }, [avatarUrl]);

  const selectPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Pilih file gambar untuk foto profil.'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran foto maksimal 5 MB.'); return; }
    try {
      const compressed = await compressAvatar(file);
      setAvatarFile(compressed);
      setAvatarUrl(URL.createObjectURL(compressed));
      setRemoveAvatar(false);
      setError('');
    } catch (photoError) { setError(photoError instanceof Error ? photoError.message : 'Foto profil gagal diproses.'); }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextName = name.trim();
    if (!nextName) { setError('Nama wajib diisi.'); return; }
    setSaving(true);
    setError('');
    try {
      const sb = requireSupabase();
      let avatarPath = profile.avatar_path || null;
      let savedAvatarUrl = removeAvatar ? '' : avatarUrl;
      if (removeAvatar && avatarPath) {
        const removal = await sb.storage.from('profile-avatars').remove([avatarPath]);
        if (removal.error) throw new Error(removal.error.message);
        avatarPath = null;
      } else if (avatarFile) {
        avatarPath = profile.id + '/avatar.jpg';
        const upload = await sb.storage.from('profile-avatars').upload(avatarPath, avatarFile, { upsert: true, contentType: 'image/jpeg', cacheControl: '3600' });
        if (upload.error) throw new Error(upload.error.message);
        const signed = await sb.storage.from('profile-avatars').createSignedUrl(avatarPath, 3600);
        if (signed.error) throw new Error(signed.error.message);
        savedAvatarUrl = signed.data.signedUrl;
      }
      const profileResult = await sb.from('profiles').update({ full_name: nextName, avatar_path: avatarPath, updated_at: new Date().toISOString() }).eq('id', profile.id);
      if (profileResult.error) throw new Error(profileResult.error.message);
      const authResult = await sb.auth.updateUser({ data: { full_name: nextName } });
      if (authResult.error) throw new Error(authResult.error.message);
      onSaved({ ...profile, full_name: nextName, avatar_path: avatarPath, avatar_url: savedAvatarUrl });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Profil gagal disimpan. Coba masuk ulang lalu ulangi.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[70] grid place-items-center bg-[#102c22]/55 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="profile-editor-title"><button type="button" aria-label="Tutup pengaturan profil" className="absolute inset-0 cursor-default" onClick={onClose} /><section className="relative max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#dce9df] bg-white shadow-[0_28px_90px_rgba(16,44,34,0.22)]"><div className="flex items-start justify-between gap-5 border-b border-[#e5eee8] px-6 py-6 sm:px-8"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Profil pengguna</p><h2 id="profile-editor-title" className="mt-2 text-3xl font-semibold tracking-[-0.02em] text-[#17382c]">Atur foto dan nama</h2><p className="mt-2 max-w-lg text-sm leading-6 text-[#799083]">Data ini akan tampil di ruang belajar dan dashboard akunmu.</p></div><button type="button" onClick={onClose} aria-label="Tutup" title="Tutup" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568] transition hover:border-[#006d77] hover:bg-[#f1f8f4] hover:text-[#006d77]"><X className="h-5 w-5" /></button></div>{error && <p role="alert" className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:mx-8">{error}</p>}<form onSubmit={save} className="mt-0"><div className="flex items-center gap-5 border-b border-[#e5eee8] px-6 py-6 sm:gap-6 sm:px-8"><div className="relative shrink-0">{avatarUrl && !removeAvatar ? <UserAvatar src={avatarUrl} name={name} size="custom" className="h-24 w-24 ring-4 ring-[#e5f4f2] sm:h-28 sm:w-28 text-3xl font-bold" /> : <span className="flex h-24 w-24 items-center justify-center rounded-full bg-[#e5f4f2] text-3xl font-bold text-[#006d77] ring-4 ring-[#edf8f1] sm:h-28 sm:w-28">{(name.trim() || 'M').slice(0, 1).toUpperCase()}</span>}<button type="button" onClick={() => inputRef.current?.click()} aria-label="Pilih foto profil" title="Pilih foto profil" className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-[#006d77] text-white ring-4 ring-white"><Camera className="h-4 w-4" /></button></div><div className="min-w-0"><button type="button" onClick={() => inputRef.current?.click()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#cfe0d5] bg-white px-3 text-xs font-bold text-[#315747] hover:border-[#006d77] hover:text-[#006d77]"><Camera className="h-3.5 w-3.5" /> Upload foto baru</button><p className="mt-2 text-xs leading-5 text-[#799083]">Minimal 800 x 800 px disarankan.<br />JPG, PNG, atau WebP.</p>{avatarUrl && !removeAvatar && <button type="button" onClick={() => setRemoveAvatar(true)} className="mt-2 text-xs font-semibold text-[#b36d4c] hover:underline">Hapus foto</button>}{removeAvatar && <button type="button" onClick={() => setRemoveAvatar(false)} className="mt-2 text-xs font-semibold text-[#006d77] hover:underline">Pakai foto sekarang</button>}</div><input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void selectPhoto(event)} className="sr-only" /></div><div className="border-b border-[#e5eee8] px-6 py-6 sm:px-8"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-bold text-[#17382c]">Personal info</p><p className="mt-1 text-xs text-[#799083]">Informasi dasar akun Al Madraj.</p></div><span className="rounded-full bg-[#e5f4f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#006d77]">Google Auth</span></div><label className="mt-5 block"><span className="mb-2 block text-xs font-semibold text-[#607568]">Nama tampilan</span><input value={name} onChange={(event) => setName(event.target.value)} autoFocus className="min-h-12 w-full rounded-xl border border-[#cbded0] bg-white px-4 text-sm outline-none transition focus:border-[#006d77] focus:ring-4 focus:ring-[#e5f4f2]" placeholder="Nama lengkap" /></label><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-[#799083]">Nomor WhatsApp</p><p className="mt-1 text-sm font-semibold text-[#17382c]">{profile.whatsapp || 'Belum diatur'}</p></div><div><p className="text-xs font-semibold text-[#799083]">Level akun</p><p className="mt-1 text-sm font-semibold text-[#17382c]">{profile.role === 'admin' ? 'Admin Master (Owner)' : 'Mahasiswa'}</p></div></div></div><div className="flex flex-col-reverse gap-3 bg-[#f5fbf7] px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8"><p className="text-xs leading-5 text-[#799083]">Perubahan nama dan foto akan tersimpan ke akunmu.</p><div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded-full border border-[#cfe0d5] bg-white px-4 text-sm font-semibold text-[#607568] hover:border-[#006d77]">Batal</button><button type="submit" disabled={saving} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(2,118,128,0.16)] hover:bg-[#016b72] disabled:cursor-wait disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan perubahan'}<Check className="h-4 w-4" /></button></div></div></form></section></div>;
};

const DashboardShortcut = ({ icon: Icon, label, detail, onClick }: { icon: React.ElementType; label: string; detail: string; onClick: () => void }) => <button onClick={onClick} className="flex min-h-[76px] items-center gap-3 rounded-[18px] border border-[#dce9df] bg-white px-4 text-left hover:border-[#8cc6a2]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e5f4f2] text-[#006d77]"><Icon className="h-4 w-4" /></span><span><span className="block text-sm font-semibold text-[#17382c]">{label}</span><span className="mt-1 block text-xs text-[#799083]">{detail}</span></span><ArrowRight className="ml-auto h-4 w-4 text-[#006d77]" /></button>;
const Summary = ({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) => <div className="flex justify-between gap-4 py-2 text-sm"><span className="text-[#799083]">{label}</span><span className={strong ? 'font-bold text-[#006d77]' : 'font-semibold text-right'}>{value}</span></div>;
const Notice = ({ title, text }: { title: string; text: string }) => <section className="rounded-2xl border border-[#dce9df] bg-white p-8"><ShieldCheck className="h-6 w-6 text-[#006d77]" /><h1 className="mt-4 text-2xl font-semibold">{title}</h1><p className="mt-3 text-sm leading-6 text-[#607568]">{text}</p></section>;
const PublicLoading = () => <main className="grid min-h-[100dvh] place-items-center bg-[#f7faf8] text-sm text-[#607568]">Memuat data dari backend...</main>;

export default ProductionPlatformPage;

type ProductionAdminCourse = Course & { is_published: boolean; created_at: string };
type ProductionAdminLesson = Lesson & { is_published: boolean };
type ProductionAdminProfile = { id: string; full_name: string; whatsapp: string; role: 'student' | 'admin'; email?: string; created_at?: string };
type ProductionAdminEnrollment = { id: string; user_id: string; course_id: string; status: 'pending' | 'active' | 'cancelled'; created_at: string; activated_at: string | null; profiles?: ProductionAdminProfile; courses?: { title: string; slug: string } };
type ProductionAdminOrder = { id: string; amount: number; status: string; provider: string; created_at: string; profiles?: { full_name: string }; courses?: { title: string } };
type ProductionAdminProgress = LessonProgress & { user_id: string };

const AdminProductionRoute = ({ onError, user, profile }: { onError: (message: string) => void; user?: { id: string; email?: string } | null; profile?: Profile | null }) => {
  type Tab = 'overview' | 'classes' | 'materials' | 'participants' | 'access' | 'progress' | 'transactions';
  type CourseDraft = {
    id?: string;
    slug: string;
    title: string;
    program_type: ProgramType;
    faculty: string;
    summary: string;
    tutor: string;
    schedule: string;
    duration: string;
    price: string;
    is_published: boolean;
    pj_name?: string;
    pj_contact?: string;
    pj_email?: string;
    media_format?: 'video' | 'audio' | 'hybrid';
    modul_url?: string;
    has_certificate?: boolean;
  };
  type LessonDraft = {
    id?: string;
    course_id: string;
    title: string;
    content_type: Lesson['content_type'];
    duration: string;
    content_url: string;
    sort_order: string;
    is_published: boolean;
    teacher_notes?: string;
    board_photos?: string;
  };
  const [tab, setTab] = useState<Tab>('overview');
  const [courses, setCourses] = useState<ProductionAdminCourse[]>([]);
  const [lessons, setLessons] = useState<ProductionAdminLesson[]>([]);
  const [profiles, setProfiles] = useState<ProductionAdminProfile[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<ProductionAdminProfile[]>([]);
  const [enrollments, setEnrollments] = useState<ProductionAdminEnrollment[]>([]);
  const [orders, setOrders] = useState<ProductionAdminOrder[]>([]);
  const [progressRows, setProgressRows] = useState<ProductionAdminProgress[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseDraft, setCourseDraft] = useState<CourseDraft | null>(null);
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const isMaster = isMasterAdmin(user?.email);

  const toggleRole = async (targetProfile: ProductionAdminProfile) => {
    const nextRole = targetProfile.role === 'admin' ? 'student' : 'admin';
    const actionLabel = nextRole === 'admin'
      ? `Jadikan ${targetProfile.full_name || 'pengguna ini'} sebagai Admin / Penanggung Jawab (PJ)?`
      : `Turunkan status ${targetProfile.full_name || 'pengguna ini'} kembali menjadi Mahasiswa?`;
    if (!window.confirm(actionLabel)) return;

    try {
      const sb = requireSupabase();
      // 1. Coba lewat RPC set_lms_user_role terlebih dahulu (Security Definer)
      const rpcResult = await sb.rpc('set_lms_user_role', { target_user_id: targetProfile.id, new_role: nextRole });
      
      if (rpcResult.error) {
        // 2. Fallback update tabel langsung dengan validasi data hasil select
        const result = await sb.from('profiles').update({ role: nextRole, updated_at: new Date().toISOString() }).eq('id', targetProfile.id).select();
        if (result.error) throw new Error(result.error.message);
        if (!result.data || result.data.length === 0) {
          throw new Error('Supabase RLS memblokir update role akun lain. Harap jalankan script SQL perbaikan kebijakan RLS (profiles_admin_update) di SQL Editor Supabase.');
        }
      }

      setProfiles((prev) => prev.map((p) => p.id === targetProfile.id ? { ...p, role: nextRole } : p));
      await recordAudit('profile.role_updated', 'profile', targetProfile.id, { target_name: targetProfile.full_name, new_role: nextRole });
      await loadData();
    } catch (updateError) {
      onError(updateError instanceof Error ? updateError.message : 'Gagal memperbarui role akun.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const sb = requireSupabase();
      let lessonPromise = sb.from('lessons').select('id,course_id,title,content_type,duration,content_url,sort_order,is_published,teacher_notes,board_photos').order('sort_order');
      const [courseResult, lessonResult, profileResult, enrollmentResult, orderResult, progressResult] = await Promise.all([
        sb.from('courses').select('*').order('created_at', { ascending: false }),
        lessonPromise.then(async (res) => {
          if (res.error) {
            return sb.from('lessons').select('id,course_id,title,content_type,duration,content_url,sort_order,is_published').order('sort_order');
          }
          return res;
        }),
        sb.from('profiles').select('id,full_name,whatsapp,role').order('created_at', { ascending: false }),
        sb.from('enrollments').select('id,user_id,course_id,status,created_at,activated_at,profiles(id,full_name,whatsapp,role),courses(title,slug)').order('created_at', { ascending: false }),
        sb.from('orders').select('id,amount,status,provider,created_at,profiles(full_name),courses(title)').order('created_at', { ascending: false }),
        sb.from('lesson_progress').select('user_id,lesson_id,watched_seconds,duration_seconds,completed_at'),
      ]);
      const firstError = [courseResult, lessonResult, profileResult, enrollmentResult, orderResult, progressResult].find((result) => result.error)?.error;
      if (firstError) throw new Error(firstError.message);
      const nextCourses = (courseResult.data || []) as ProductionAdminCourse[];
      setCourses(nextCourses);
      setLessons((lessonResult.data || []) as ProductionAdminLesson[]);

      let loadedUsers: ProductionAdminProfile[] = [];
      try {
        const rpcUsers = await sb.rpc('get_lms_registered_users');
        if (rpcUsers.data && !rpcUsers.error && Array.isArray(rpcUsers.data)) {
          loadedUsers = rpcUsers.data as ProductionAdminProfile[];
        }
      } catch {}

      if (!loadedUsers.length) {
        try {
          const pWithEmail = await sb.from('profiles').select('id,full_name,whatsapp,role,email,created_at').order('created_at', { ascending: false });
          if (pWithEmail.data && !pWithEmail.error) {
            loadedUsers = pWithEmail.data as ProductionAdminProfile[];
          }
        } catch {}
      }

      if (!loadedUsers.length) {
        loadedUsers = (profileResult.data || []) as ProductionAdminProfile[];
      }
      setRegisteredUsers(loadedUsers);
      setProfiles(loadedUsers);

      setEnrollments((enrollmentResult.data || []).map((item: any) => ({ ...item, profiles: item.profiles?.[0], courses: item.courses?.[0] })) as ProductionAdminEnrollment[]);
      setOrders((orderResult.data || []).map((item: any) => ({ ...item, profiles: item.profiles?.[0], courses: item.courses?.[0] })) as ProductionAdminOrder[]);
      setProgressRows((progressResult.data || []) as ProductionAdminProgress[]);
      setSelectedCourseId((current) => current || nextCourses[0]?.id || '');
    } catch (loadError) {
      onError(loadError instanceof Error ? loadError.message : 'Data admin gagal dimuat.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPjAccount = (selectedEmail: string) => {
    if (!courseDraft) return;
    if (!selectedEmail) {
      setCourseDraft({ ...courseDraft, pj_email: '', pj_name: '', pj_contact: '' });
      return;
    }
    const cleanSelected = selectedEmail.toLowerCase().trim();
    const matched = registeredUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanSelected)
      || profiles.find((u) => (u.email || '').toLowerCase().trim() === cleanSelected);

    if (matched) {
      setCourseDraft({
        ...courseDraft,
        pj_email: matched.email || selectedEmail,
        pj_name: matched.full_name || selectedEmail.split('@')[0],
        pj_contact: matched.whatsapp || courseDraft.pj_contact || '',
      });
    } else {
      setCourseDraft({ ...courseDraft, pj_email: selectedEmail });
    }
  };

  useEffect(() => { void loadData(); }, []);
  useEffect(() => {
    const handleFile = (event: Event) => setContentFile((event as CustomEvent<File | null>).detail || null);
    window.addEventListener('al-madraj-content-file', handleFile);
    return () => window.removeEventListener('al-madraj-content-file', handleFile);
  }, []);

  const recordAudit = async (action: string, entityType: string, entityId?: string, metadata: Record<string, unknown> = {}) => {
    await requireSupabase().from('admin_audit_logs').insert({ action, entity_type: entityType, entity_id: entityId || null, metadata });
  };

  const startCourse = (course?: ProductionAdminCourse) => setCourseDraft(course ? {
    id: course.id,
    slug: course.slug,
    title: course.title,
    program_type: course.program_type || 'Dars',
    faculty: course.faculty,
    summary: course.summary,
    tutor: course.tutor,
    schedule: course.schedule,
    duration: course.duration,
    price: String(course.price),
    is_published: course.is_published,
    pj_name: course.pj_name || '',
    pj_contact: course.pj_contact || '',
    pj_email: course.pj_email || '',
    media_format: course.media_format || (course.program_type === 'Bimbel' ? 'audio' : 'video'),
    modul_url: course.modul_url || '',
    has_certificate: course.has_certificate ?? true,
  } : {
    slug: '',
    title: '',
    program_type: 'Dars',
    faculty: '',
    summary: '',
    tutor: '',
    schedule: '',
    duration: '',
    price: '0',
    is_published: false,
    pj_name: '',
    pj_contact: '',
    pj_email: '',
    media_format: 'audio',
    modul_url: '',
    has_certificate: true,
  });

  const startLesson = (lesson?: ProductionAdminLesson) => {
    setContentFile(null);
    setLessonDraft(lesson ? {
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content_type: lesson.content_type,
      duration: lesson.duration,
      content_url: lesson.content_url || '',
      sort_order: String(lesson.sort_order),
      is_published: lesson.is_published,
      teacher_notes: lesson.teacher_notes || '',
      board_photos: (lesson.board_photos || []).join('\n'),
    } : {
      course_id: selectedCourseId,
      title: '',
      content_type: 'audio',
      duration: '',
      content_url: '',
      sort_order: String(lessons.filter((item) => item.course_id === selectedCourseId).length + 1),
      is_published: false,
      teacher_notes: '',
      board_photos: '',
    });
  };

  const saveCourse = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!courseDraft?.title.trim() || !courseDraft.slug.trim()) { onError('Judul dan slug kelas wajib diisi.'); return; }
    const normalizedSlug = courseDraft.slug.trim().toLowerCase().replace(/\s+/g, '-');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) { onError('Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.'); return; }
    const parsedPrice = Number(courseDraft.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) { onError('Harga harus berupa angka nol atau lebih besar.'); return; }
    if (courseDraft.is_published && [courseDraft.faculty, courseDraft.summary, courseDraft.tutor, courseDraft.schedule, courseDraft.duration].some((value) => !value.trim())) { onError('Fakultas, ringkasan, tutor, jadwal, dan durasi wajib lengkap sebelum kelas dipublikasikan.'); return; }
    setSaving(true);
    try {
      const fullPayload = {
        slug: normalizedSlug,
        title: courseDraft.title.trim(),
        program_type: courseDraft.program_type || 'Dars',
        faculty: courseDraft.faculty.trim(),
        summary: courseDraft.summary.trim(),
        tutor: courseDraft.tutor.trim(),
        schedule: courseDraft.schedule.trim(),
        duration: courseDraft.duration.trim(),
        price: parsedPrice,
        is_published: courseDraft.is_published,
        pj_name: courseDraft.pj_name?.trim() || '',
        pj_contact: courseDraft.pj_contact?.trim() || '',
        pj_email: courseDraft.pj_email?.trim() || '',
        media_format: courseDraft.media_format || (courseDraft.program_type === 'Bimbel' ? 'audio' : 'video'),
        modul_url: courseDraft.modul_url?.trim() || '',
        has_certificate: courseDraft.has_certificate ?? true,
        updated_at: new Date().toISOString(),
      };
      let result = courseDraft.id
        ? await requireSupabase().from('courses').update(fullPayload).eq('id', courseDraft.id)
        : await requireSupabase().from('courses').insert(fullPayload);

      if (result.error) {
        // Fallback in case schema migration has not run yet in user's Supabase
        const basePayload = {
          slug: normalizedSlug,
          title: courseDraft.title.trim(),
          program_type: courseDraft.program_type || 'Dars',
          faculty: courseDraft.faculty.trim(),
          summary: courseDraft.summary.trim(),
          tutor: courseDraft.tutor.trim(),
          schedule: courseDraft.schedule.trim(),
          duration: courseDraft.duration.trim(),
          price: parsedPrice,
          is_published: courseDraft.is_published,
          updated_at: new Date().toISOString(),
        };
        result = courseDraft.id
          ? await requireSupabase().from('courses').update(basePayload).eq('id', courseDraft.id)
          : await requireSupabase().from('courses').insert(basePayload);
        if (result.error) throw new Error(result.error.message);
      }
      await recordAudit(courseDraft.id ? 'course.updated' : 'course.created', 'course', courseDraft.id, { slug: normalizedSlug });
      setCourseDraft(null);
      await loadData();
    } catch (saveError) { onError(saveError instanceof Error ? saveError.message : 'Kelas gagal disimpan.'); } finally { setSaving(false); }
  };

  const saveLesson = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!lessonDraft?.title.trim() || !lessonDraft.course_id) { onError('Judul materi dan kelas wajib diisi.'); return; }
    const sortOrder = Number(lessonDraft.sort_order);
    if (!Number.isInteger(sortOrder) || sortOrder < 1) { onError('Urutan materi harus berupa bilangan bulat mulai dari 1.'); return; }
    if (lessonDraft.is_published && !lessonDraft.duration.trim()) { onError('Durasi wajib diisi sebelum materi dipublikasikan.'); return; }
    if (lessonDraft.is_published && !lessonDraft.content_url.trim() && !contentFile) { onError('URL konten atau file wajib tersedia sebelum materi dipublikasikan.'); return; }
    setSaving(true);
    try {
      let contentUrl = lessonDraft.content_url.trim() || null;
      if (contentFile) {
        const path = lessonDraft.course_id + '/' + crypto.randomUUID() + '-' + contentFile.name.replace(/[^a-zA-Z0-9._-]/g, '-');
        const upload = await requireSupabase().storage.from('lms-materials').upload(path, contentFile, { upsert: false, contentType: contentFile.type || undefined });
        if (upload.error) throw new Error(upload.error.message);
        contentUrl = upload.data.path;
      }
      const rawPhotos = (lessonDraft.board_photos || '')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const fullPayload = {
        course_id: lessonDraft.course_id,
        title: lessonDraft.title.trim(),
        content_type: lessonDraft.content_type,
        duration: lessonDraft.duration.trim(),
        content_url: contentUrl,
        sort_order: sortOrder,
        is_published: lessonDraft.is_published,
        teacher_notes: lessonDraft.teacher_notes?.trim() || '',
        board_photos: rawPhotos,
      };

      let result = lessonDraft.id
        ? await requireSupabase().from('lessons').update(fullPayload).eq('id', lessonDraft.id)
        : await requireSupabase().from('lessons').insert(fullPayload);

      if (result.error) {
        // Fallback in case schema migration has not run yet in user's Supabase
        const basePayload = {
          course_id: lessonDraft.course_id,
          title: lessonDraft.title.trim(),
          content_type: lessonDraft.content_type,
          duration: lessonDraft.duration.trim(),
          content_url: contentUrl,
          sort_order: sortOrder,
          is_published: lessonDraft.is_published,
        };
        result = lessonDraft.id
          ? await requireSupabase().from('lessons').update(basePayload).eq('id', lessonDraft.id)
          : await requireSupabase().from('lessons').insert(basePayload);
        if (result.error) throw new Error(result.error.message);
      }
      await recordAudit(lessonDraft.id ? 'lesson.updated' : 'lesson.created', 'lesson', lessonDraft.id, { course_id: lessonDraft.course_id, content_type: lessonDraft.content_type });
      setLessonDraft(null);
      await loadData();
    } catch (saveError) { onError(saveError instanceof Error ? saveError.message : 'Materi gagal disimpan.'); } finally { setSaving(false); }
  };

  const removeRow = async (table: 'courses' | 'lessons', id: string, label: string) => {
    if (!window.confirm('Hapus ' + label + '? Tindakan ini tidak dapat dibatalkan.')) return;
    const result = await requireSupabase().from(table).delete().eq('id', id);
    if (result.error) onError(result.error.message); else { await recordAudit(table === 'courses' ? 'course.deleted' : 'lesson.deleted', table === 'courses' ? 'course' : 'lesson', id, { label }); await loadData(); }
  };

  const updateAccess = async (enrollment: ProductionAdminEnrollment, status: ProductionAdminEnrollment['status']) => {
    const result = await requireSupabase().from('enrollments').update({ status, activated_at: status === 'active' ? new Date().toISOString() : null }).eq('id', enrollment.id);
    if (result.error) onError(result.error.message); else { await recordAudit('enrollment.' + status, 'enrollment', enrollment.id, { user_id: enrollment.user_id, course_id: enrollment.course_id }); await loadData(); }
  };

  const selectedLessons = lessons.filter((lesson) => lesson.course_id === selectedCourseId).sort((a, b) => a.sort_order - b.sort_order);
  const filteredProfiles = profiles.filter((profile) => (profile.full_name + ' ' + profile.whatsapp).toLowerCase().includes(search.toLowerCase()));
  const activeEnrollments = enrollments.filter((item) => item.status === 'active').length;
  const publishedCourses = courses.filter((course) => course.is_published).length;
  const progressByCourse = courses.map((course) => {
    const courseLessons = lessons.filter((lesson) => lesson.course_id === course.id);
    const enrolled = enrollments.filter((item) => item.course_id === course.id && item.status === 'active');
    const rows = progressRows.filter((row) => courseLessons.some((lesson) => lesson.id === row.lesson_id));
    const complete = rows.filter((row) => Boolean(row.completed_at)).length;
    return { course, enrolled: enrolled.length, complete, lessons: courseLessons.length, percent: courseLessons.length ? Math.round(rows.reduce((total, row) => total + progressPercent(row, courseLessons.find((lesson) => lesson.id === row.lesson_id)), 0) / Math.max(enrolled.length * courseLessons.length, 1)) : 0 };
  });
  const tabs: { id: Tab; label: string }[] = [{ id: 'overview', label: 'Ringkasan' }, { id: 'classes', label: 'Kelas' }, { id: 'materials', label: 'Materi' }, { id: 'participants', label: 'Peserta' }, { id: 'access', label: 'Akses' }, { id: 'progress', label: 'Progress' }, { id: 'transactions', label: 'Transaksi' }];

  return <div className="space-y-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Workspace pengelola</p><div className="mt-2 flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold sm:text-5xl">Panel admin</h1><span className="rounded-full border border-[#006d77] bg-[#e5f4f2] px-3.5 py-1 text-xs font-bold text-[#006d77]">{isMaster ? ('Admin Master (Owner): ' + (user?.email || 'daru.fahma@gmail.com')) : 'Admin LMS'}</span></div><p className="mt-3 text-sm text-[#607568]">Kelola kelas, materi, penunjukan PJ per maddah, peserta, progress, dan transaksi dari database.</p></div><button onClick={() => void loadData()} className="flex min-h-10 items-center gap-2 self-start rounded-full border border-[#cfe0d5] px-4 text-sm font-semibold text-[#607568]"><RefreshCw className="h-4 w-4" /> Muat ulang</button></div><nav className="flex gap-5 overflow-x-auto border-b border-[#dce9df]" aria-label="Menu admin">{tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={'min-h-11 shrink-0 border-b-2 px-1 text-sm font-semibold ' + (tab === item.id ? 'border-[#006d77] text-[#006d77]' : 'border-transparent text-[#819289]')}>{item.label}</button>)}</nav>{loading ? <p className="py-10 text-center text-sm text-[#607568]">Memuat data operasional...</p> : <>{tab === 'overview' && <div className="space-y-5"><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><ProductionAdminStat label="Kelas published" value={String(publishedCourses)} detail="Dari database" /><ProductionAdminStat label="Materi" value={String(lessons.length)} detail="Audio, Video, PDF" /><ProductionAdminStat label="Peserta aktif" value={String(activeEnrollments)} detail="Enrollment aktif" /><ProductionAdminStat label="Transaksi" value={String(orders.length)} detail="Order tercatat" /></section><section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Kesehatan konten</p><h2 className="mt-2 text-xl font-semibold">Kelas dan materi</h2></div><BookOpen className="h-5 w-5 text-[#006d77]" /></div><div className="mt-5 divide-y divide-[#e4eee7]">{courses.map((course) => <div key={course.id} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{course.title}</p><p className="mt-1 text-xs text-[#819289]">{lessons.filter((lesson) => lesson.course_id === course.id).length} materi · {course.is_published ? 'Published' : 'Draft'}{course.pj_name ? ` · PJ: ${course.pj_name}` : ''}</p></div><button onClick={() => { setSelectedCourseId(course.id); setTab('materials'); }} className="text-xs font-bold text-[#006d77]">Atur materi</button></div>)}</div></div><div className="rounded-[18px] bg-[#102c22] p-5 text-white"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#83c5be]">Aksi utama</p><h2 className="mt-2 text-xl font-semibold">Siapkan kelas untuk peserta.</h2><p className="mt-3 text-sm leading-6 text-[#c5d9cf]">Tunjuk PJ per maddah bimbel, upload link audio/video dari Google Drive, dan tambahkan foto papan tulis serta diktat PDF.</p><button onClick={() => setTab('classes')} className="mt-5 flex min-h-10 items-center gap-2 rounded-full bg-[#83c5be] px-4 text-sm font-bold text-[#102c22]">Kelola kelas <ArrowRight className="h-4 w-4" /></button></div></section></div>}{tab === 'classes' && <div className="space-y-5">{courseDraft && <ProductionAdminForm title={courseDraft.id ? 'Edit kelas & PJ Maddah' : 'Tambah kelas & PJ Maddah'} onClose={() => setCourseDraft(null)}><form onSubmit={saveCourse} className="grid gap-4 md:grid-cols-2"><ProductionAdminField label="Slug" value={courseDraft.slug} onChange={(value) => setCourseDraft({ ...courseDraft, slug: value })} placeholder="ushul-fiqh" /><ProductionAdminField label="Nama kelas / Maddah" value={courseDraft.title} onChange={(value) => setCourseDraft({ ...courseDraft, title: value })} placeholder="Ushul Fiqh (Bimbel)" /><ProductionAdminField label="Fakultas" value={courseDraft.faculty} onChange={(value) => setCourseDraft({ ...courseDraft, faculty: value })} placeholder="Syariah / Ushuluddin" /><ProductionAdminSelect label="Jenis program" value={courseDraft.program_type} onChange={(value) => setCourseDraft({ ...courseDraft, program_type: value as ProgramType })} options={["Bimbel", "Dars"]} /><ProductionAdminSelect label="Format Media" value={courseDraft.media_format || 'audio'} onChange={(value) => setCourseDraft({ ...courseDraft, media_format: value as any })} options={["audio", "video", "hybrid"]} /><ProductionAdminField label="Syaikh / Pengampu Dars" value={courseDraft.tutor} onChange={(value) => setCourseDraft({ ...courseDraft, tutor: value })} placeholder="Dr. Syaikh Ahmad..." /><div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 sm:p-5 md:col-span-2 shadow-xs space-y-4">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-[#006d77] flex items-center gap-1.5">
        <UsersRound className="h-4 w-4 text-[#006d77]" />
        Penanggung Jawab (PJ) Maddah Bimbel
      </p>
      <p className="mt-0.5 text-xs text-[#526f61]">
        Pilih PJ langsung dari akun Google yang terdaftar di platform Al Madraj.
      </p>
    </div>
    {courseDraft.pj_email && (
      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-[11px] font-bold text-emerald-800 flex items-center gap-1">
        <Check className="h-3 w-3 text-emerald-700" /> PJ: {courseDraft.pj_email}
      </span>
    )}
  </div>

  {/* Dropdown Selector Akun Google Terdaftar */}
  <div>
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-[#17382c]">
        Pilih dari Email Google Terdaftar di Sistem:
      </span>
      <select
        value={courseDraft.pj_email || ''}
        onChange={(e) => handleSelectPjAccount(e.target.value)}
        className="min-h-11 w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs sm:text-sm font-medium text-[#17382c] shadow-xs outline-none focus:border-[#006d77] focus:ring-2 focus:ring-[#006d77]/20 cursor-pointer"
      >
        <option value="">-- Klik untuk Memilih Akun Google PJ --</option>
        {registeredUsers
          .filter((u) => Boolean(u.email || u.full_name))
          .map((u) => {
            const emailDisplay = u.email || 'Tanpa Email';
            const nameDisplay = u.full_name || 'Tanpa Nama';
            const roleDisplay = u.role === 'admin' ? 'Admin / PJ' : 'Mahasiswa';
            return (
              <option key={u.id} value={u.email || ''}>
                {emailDisplay} — {nameDisplay} [{roleDisplay}]
              </option>
            );
          })}
      </select>
    </label>
  </div>

  {/* Detail Info PJ & Promotion Button */}
  {courseDraft.pj_email && (() => {
    const cleanMail = (courseDraft.pj_email || '').toLowerCase().trim();
    const matchedPj = registeredUsers.find((u) => (u.email || '').toLowerCase().trim() === cleanMail)
      || profiles.find((u) => (u.email || '').toLowerCase().trim() === cleanMail);
    return (
      <div className="rounded-xl border border-emerald-200 bg-white p-3.5 sm:p-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-[#17382c]">
              Email Google Terhubung: <span className="font-mono text-[#006d77]">{courseDraft.pj_email}</span>
            </p>
            <p className="text-gray-600 mt-1">
              Nama Akun: <strong>{matchedPj?.full_name || courseDraft.pj_name || '-'}</strong>
              {' · '}
              Level Akun: <span className={`font-semibold ${matchedPj?.role === 'admin' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {matchedPj?.role === 'admin' ? '✓ Admin / PJ (Memiliki Hak Akses Editor)' : 'Mahasiswa (Belum berstatus Admin/PJ)'}
              </span>
            </p>
          </div>
          {matchedPj && matchedPj.role !== 'admin' && isMaster && (
            <button
              type="button"
              onClick={() => void toggleRole(matchedPj)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#005a63] transition active:scale-95 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Jadikan Admin / PJ Sekarang</span>
            </button>
          )}
        </div>
      </div>
    );
  })()}

  {/* Form fields for fine-tuning name, WA, and custom email */}
  <div className="grid gap-3 sm:grid-cols-3">
    <ProductionAdminField
      label="Nama Tampilan PJ"
      value={courseDraft.pj_name || ''}
      onChange={(value) => setCourseDraft({ ...courseDraft, pj_name: value })}
      placeholder="Ahmad (Koordinator)"
    />
    <ProductionAdminField
      label="Kontak WhatsApp PJ"
      value={courseDraft.pj_contact || ''}
      onChange={(value) => setCourseDraft({ ...courseDraft, pj_contact: value })}
      placeholder="0812xxxxxxxx"
    />
    <ProductionAdminField
      label="Email Akun PJ (Google Auth)"
      value={courseDraft.pj_email || ''}
      onChange={(value) => setCourseDraft({ ...courseDraft, pj_email: value })}
      placeholder="pj.maddah@gmail.com"
    />
  </div>
  <p className="text-[11px] text-gray-500 leading-relaxed">
    PJ dengan email ini otomatis mendapatkan tombol <strong>Upload Foto Saburah</strong> dan <strong>Edit Catatan Guru</strong> di ruang belajar maddah ini.
  </p>
</div><ProductionAdminField label="Jadwal" value={courseDraft.schedule} onChange={(value) => setCourseDraft({ ...courseDraft, schedule: value })} placeholder="Rabu, 20.00 WIB" /><ProductionAdminField label="Durasi / Jumlah Pertemuan" value={courseDraft.duration} onChange={(value) => setCourseDraft({ ...courseDraft, duration: value })} placeholder="14 pertemuan" /><ProductionAdminField label="Harga (Rp)" type="number" value={courseDraft.price} onChange={(value) => setCourseDraft({ ...courseDraft, price: value })} placeholder="0 (gratis) atau 199000" /><ProductionAdminField label="Link Diktat / Modul PDF" value={courseDraft.modul_url || ''} onChange={(value) => setCourseDraft({ ...courseDraft, modul_url: value })} placeholder="https://drive.google.com/... atau link PDF" /><label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Deskripsi &amp; Ringkasan Maddah</span><textarea value={courseDraft.summary} onChange={(event) => setCourseDraft({ ...courseDraft, summary: event.target.value })} rows={3} className="w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#006d77]" /></label><div className="flex flex-wrap items-center gap-6 md:col-span-2"><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={courseDraft.is_published} onChange={(event) => setCourseDraft({ ...courseDraft, is_published: event.target.checked })} /> Publish kelas</label><label className="flex items-center gap-2 text-sm font-semibold cursor-pointer"><input type="checkbox" checked={courseDraft.has_certificate ?? true} onChange={(event) => setCourseDraft({ ...courseDraft, has_certificate: event.target.checked })} /> Sediakan Syahadah Khatam (Sertifikat)</label></div><div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setCourseDraft(null)} className="min-h-10 rounded-full border border-[#cfe0d5] px-4 text-sm font-semibold cursor-pointer">Batal</button><button disabled={saving} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white hover:bg-[#00565e] cursor-pointer"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan kelas & PJ'}</button></div></form></ProductionAdminForm>}<section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Program belajar</p><h2 className="mt-2 text-xl font-semibold">{courses.length} kelas</h2></div><button onClick={() => startCourse()} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-4 text-sm font-bold text-white cursor-pointer"><Plus className="h-4 w-4" />Tambah kelas</button></div><div className="mt-5 divide-y divide-[#e4eee7]">{courses.map((course) => <div key={course.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{course.title}</p><span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + (course.is_published ? 'bg-[#e8f5ed] text-[#006d77]' : 'bg-[#f3f5f3] text-[#819289]')}>{course.is_published ? 'Published' : 'Draft'}</span><span className="rounded-full bg-[#edf8f2] px-2 py-0.5 text-[10px] font-bold text-[#247d48]">{course.program_type || 'Dars'}</span><span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200 uppercase">{course.media_format || 'audio'}</span>{course.pj_name && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">PJ: {course.pj_name}</span>}</div><p className="mt-1 text-xs text-[#819289]">{course.slug} · {course.faculty} · {course.price === 0 ? 'Gratis' : `Rp${course.price.toLocaleString('id-ID')}`}{course.modul_url ? ' · 📚 Modul PDF siap' : ''}</p></div><div className="flex items-center gap-2"><button onClick={() => { setSelectedCourseId(course.id); setTab('materials'); }} className="min-h-9 rounded-full border border-[#cfe0d5] px-3 text-xs font-semibold hover:border-[#006d77] hover:text-[#006d77] cursor-pointer">Materi</button><button onClick={() => startCourse(course)} aria-label="Edit kelas" title="Edit kelas" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0d5] text-[#006d77] hover:bg-emerald-50 cursor-pointer"><Pencil className="h-4 w-4" /></button><button onClick={() => void removeRow('courses', course.id, course.title)} aria-label="Hapus kelas" title="Hapus kelas" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#efd2c8] text-[#b36d4c] hover:bg-red-50 cursor-pointer"><Trash2 className="h-4 w-4" /></button></div></div>)}</div></section></div>}{tab === 'materials' && <div className="space-y-5">{lessonDraft && <ProductionAdminForm title={lessonDraft.id ? 'Edit materi dars' : 'Tambah materi dars'} onClose={() => setLessonDraft(null)}><form onSubmit={saveLesson} className="grid gap-4 md:grid-cols-2"><ProductionAdminField label="Judul materi" value={lessonDraft.title} onChange={(value) => setLessonDraft({ ...lessonDraft, title: value })} placeholder="Contoh: Pertemuan 1 - Pengantar Ushul Fiqh" /><ProductionAdminField label="Durasi" value={lessonDraft.duration} onChange={(value) => setLessonDraft({ ...lessonDraft, duration: value })} placeholder="45:00" /><label className="block"><span className="mb-2 block text-sm font-semibold">Kelas</span><select value={lessonDraft.course_id} onChange={(event) => setLessonDraft({ ...lessonDraft, course_id: event.target.value })} className="min-h-11 w-full rounded-xl border border-[#cbded0] bg-white px-3 text-sm">{courses.map((course) => <option key={course.id} value={course.id}>{course.title} ({course.program_type || 'Dars'})</option>)}</select></label><label className="block"><span className="mb-2 block text-sm font-semibold">Tipe materi</span><select value={lessonDraft.content_type} onChange={(event) => setLessonDraft({ ...lessonDraft, content_type: event.target.value as Lesson['content_type'] })} className="min-h-11 w-full rounded-xl border border-[#cbded0] bg-white px-3 text-sm"><option value="audio">Audio (Bimbel Talaqqi)</option><option value="video">Video (Kajian Syarah)</option><option value="pdf">PDF (Diktat)</option><option value="text">Teks</option></select></label><ProductionAdminField label="Urutan" type="number" value={lessonDraft.sort_order} onChange={(value) => setLessonDraft({ ...lessonDraft, sort_order: value })} placeholder="1" /><div className="md:col-span-2"><ProductionAdminField label="URL konten (Google Drive Embed / YouTube / Audio URL)" value={lessonDraft.content_url} onChange={(value) => setLessonDraft({ ...lessonDraft, content_url: value })} placeholder="https://drive.google.com/file/d/.../view atau link YouTube" /><p className="mt-1 text-[11px] text-gray-500">Untuk materi audio dari Google Drive, tempelkan link share file Drive. Sistem otomatis mengubahnya menjadi preview embed yang dapat diputar.</p></div><label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Catatan Pengampu / Faedah Dars</span><textarea value={lessonDraft.teacher_notes || ''} onChange={(event) => setLessonDraft({ ...lessonDraft, teacher_notes: event.target.value })} rows={3} placeholder="Poin penting atau rujukan kitab..." className="w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#006d77]" /></label><label className="block md:col-span-2"><span className="mb-2 block text-sm font-semibold">Foto Papan Tulis (Saburah) - Masukkan URL per baris</span><textarea value={lessonDraft.board_photos || ''} onChange={(event) => setLessonDraft({ ...lessonDraft, board_photos: event.target.value })} rows={3} placeholder="https://drive.google.com/...\nhttps://..." className="w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2.5 text-xs font-mono outline-none focus:border-[#006d77]" /><p className="mt-1 text-[11px] text-gray-500">Anda juga dapat mengunggah foto langsung dari halaman belajar materi.</p></label><label className="flex items-center gap-2 text-sm font-semibold md:col-span-2 cursor-pointer"><input type="checkbox" checked={lessonDraft.is_published} onChange={(event) => setLessonDraft({ ...lessonDraft, is_published: event.target.checked })} /> Publish materi</label><div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setLessonDraft(null)} className="min-h-10 rounded-full border border-[#cfe0d5] px-4 text-sm font-semibold cursor-pointer">Batal</button><button disabled={saving} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white hover:bg-[#00565e] cursor-pointer"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan materi'}</button></div></form></ProductionAdminForm>}<section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Struktur materi</p><h2 className="mt-2 text-xl font-semibold">{selectedLessons.length} materi di {courses.find((course) => course.id === selectedCourseId)?.title || 'kelas'}</h2></div><div className="flex items-center gap-2"><select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} className="min-h-10 max-w-[240px] rounded-xl border border-[#cbded0] bg-white px-3 text-sm">{courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}</select><button onClick={() => startLesson()} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-3 text-sm font-bold text-white cursor-pointer"><Plus className="h-4 w-4" />Tambah</button></div></div><div className="mt-5 divide-y divide-[#e4eee7]">{selectedLessons.map((lesson) => <div key={lesson.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{lesson.title}</p><span className="text-xs uppercase text-[#819289]">{lesson.content_type} · {lesson.duration}</span><span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + (lesson.is_published ? 'bg-[#e8f5ed] text-[#006d77]' : 'bg-[#f3f5f3] text-[#819289]')}>{lesson.is_published ? 'Published' : 'Draft'}</span>{lesson.board_photos?.length ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">📸 {lesson.board_photos.length} foto</span> : null}{lesson.teacher_notes ? <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800 border border-blue-200">📝 Catatan</span> : null}</div><p className="mt-1 truncate text-xs text-[#819289]">{lesson.content_url || 'URL konten belum diisi'}</p></div><div className="flex items-center gap-2"><button onClick={() => startLesson(lesson)} aria-label="Edit materi" title="Edit materi" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0d5] text-[#006d77] hover:bg-emerald-50 cursor-pointer"><Pencil className="h-4 w-4" /></button><button onClick={() => void removeRow('lessons', lesson.id, lesson.title)} aria-label="Hapus materi" title="Hapus materi" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#efd2c8] text-[#b36d4c] hover:bg-red-50 cursor-pointer"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>{!selectedLessons.length && <p className="mt-5 rounded-xl bg-[#f7faf8] p-5 text-sm text-[#819289]">Belum ada materi untuk kelas ini.</p>}</section></div>}{tab === 'participants' && <section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Data peserta & pengelola</p><h2 className="mt-2 text-xl font-semibold">{profiles.length} akun terdaftar</h2></div><label className="flex min-h-10 items-center gap-2 rounded-xl border border-[#cbded0] px-3"><Search className="h-4 w-4 text-[#819289]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full min-w-0 text-sm outline-none sm:w-56" placeholder="Cari peserta" /></label></div><div className="mt-5 divide-y divide-[#e4eee7]">{filteredProfiles.map((itemProfile) => <div key={itemProfile.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2"><p className="font-semibold">{itemProfile.full_name || 'Tanpa nama'}</p><span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + (itemProfile.role === 'admin' ? 'bg-[#e5f4f2] text-[#006d77]' : 'bg-[#f3f5f3] text-[#819289]')}>{itemProfile.role === 'admin' ? 'Admin / PJ' : 'Mahasiswa'}</span></div><p className="mt-1 text-xs text-[#819289]">{itemProfile.whatsapp || 'WhatsApp belum diisi'}</p></div><div className="flex items-center gap-3"><span className="text-xs text-[#819289]">{enrollments.filter((item) => item.user_id === itemProfile.id && item.status === 'active').length} kelas aktif</span>{isMaster && itemProfile.id !== user?.id && <button type="button" onClick={() => void toggleRole(itemProfile)} className={'min-h-8 rounded-full border px-3 text-xs font-semibold ' + (itemProfile.role === 'admin' ? 'border-[#efd2c8] text-[#b36d4c] hover:bg-red-50' : 'border-[#cfe0d5] text-[#006d77] hover:bg-[#e5f4f2]')}>{itemProfile.role === 'admin' ? 'Ubah ke Mahasiswa' : 'Jadikan Admin / PJ'}</button>}</div></div>)}</div></section>}{tab === 'access' && <section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Kontrol akses</p><h2 className="mt-2 text-xl font-semibold">Enrollment peserta</h2></div><div className="mt-5 divide-y divide-[#e4eee7]">{enrollments.map((enrollment) => <div key={enrollment.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{enrollment.profiles?.full_name || enrollment.user_id}</p><p className="mt-1 text-xs text-[#819289]">{enrollment.courses?.title || enrollment.course_id} · {enrollment.status}</p></div><div className="flex gap-2">{enrollment.status !== 'active' && <button onClick={() => void updateAccess(enrollment, 'active')} className="min-h-9 rounded-full bg-[#006d77] px-3 text-xs font-bold text-white">Aktifkan</button>}{enrollment.status === 'active' && <button onClick={() => void updateAccess(enrollment, 'cancelled')} className="min-h-9 rounded-full border border-[#efd2c8] px-3 text-xs font-semibold text-[#b36d4c]">Cabut akses</button>}{enrollment.status === 'cancelled' && <button onClick={() => void updateAccess(enrollment, 'active')} className="min-h-9 rounded-full border border-[#cfe0d5] px-3 text-xs font-semibold text-[#006d77]">Pulihkan</button>}</div></div>)}</div>{!enrollments.length && <p className="mt-5 rounded-xl bg-[#f7faf8] p-5 text-sm text-[#819289]">Belum ada enrollment peserta.</p>}</section>}{tab === 'progress' && <section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Monitoring belajar</p><h2 className="mt-2 text-xl font-semibold">Progress per kelas</h2></div><div className="mt-5 divide-y divide-[#e4eee7]">{progressByCourse.map((item) => <div key={item.course.id} className="py-4"><div className="flex items-center justify-between gap-4"><div><p className="font-semibold">{item.course.title}</p><p className="mt-1 text-xs text-[#819289]">{item.enrolled} peserta aktif · {item.complete} materi selesai</p></div><span className="font-bold text-[#006d77]">{item.percent}%</span></div><div className="mt-3 h-2 rounded-full bg-[#e3eee6]"><div className="h-2 rounded-full bg-[#006d77]" style={{ width: item.percent + '%' }} /></div></div>)}</div></section>}{tab === 'transactions' && <section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Pembayaran</p><h2 className="mt-2 text-xl font-semibold">Riwayat transaksi</h2></div><div className="mt-5 divide-y divide-[#e4eee7]">{orders.map((order) => <div key={order.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{order.profiles?.full_name || 'Peserta'}</p><p className="mt-1 text-xs text-[#819289]">{order.courses?.title || '-'} · {order.provider}</p></div><div className="text-left sm:text-right"><p className="font-semibold text-[#006d77]">Rp{order.amount.toLocaleString('id-ID')}</p><p className="mt-1 text-xs uppercase text-[#819289]">{order.status}</p></div></div>)}</div>{!orders.length && <p className="mt-5 rounded-xl bg-[#f7faf8] p-5 text-sm text-[#819289]">Belum ada transaksi.</p>}</section>}</>}</div>;
};

const ProductionAdminForm = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => <section className="rounded-[18px] border border-[#bcd8c4] bg-[#f3faf5] p-5"><div className="mb-5 flex items-center justify-between gap-4"><div><h2 className="text-xl font-semibold">{title}</h2>{title.toLowerCase().includes('materi') && <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-[#607568]">Upload file materi<input type="file" accept="video/*,application/pdf,.txt,.md" onChange={(event) => window.dispatchEvent(new CustomEvent<File | null>('al-madraj-content-file', { detail: event.target.files?.[0] || null }))} className="max-w-[220px] text-xs" /></label>}</div><button onClick={onClose} aria-label="Tutup form" title="Tutup form" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568]"><X className="h-4 w-4" /></button></div>{children}</section>;
const ProductionAdminField = ({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; type?: string }) => <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-11 w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#006d77]" /></label>; const ProductionAdminSelect = ({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) => <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#006d77]">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
const ProductionAdminStat = ({ label, value, detail }: { label: string; value: string; detail: string }) => <section className="rounded-[18px] border border-[#d4e1d8] bg-white p-4"><p className="text-xs text-[#819289]">{label}</p><p className="mt-2 text-2xl font-semibold text-[#006d77]">{value}</p><p className="mt-1 text-xs text-[#9aa9a0]">{detail}</p></section>;

const SettingsProductionRoute = ({ user, profile, onSaved, onError }: { user: { id: string }; profile: Profile | null; onSaved: (profile: Profile) => void; onError: (message: string) => void }) => {
  const [name, setName] = useState(profile?.full_name || '');
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || '');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { setName(profile?.full_name || ''); setWhatsapp(profile?.whatsapp || ''); }, [profile]);
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const nextName = name.trim();
      const nextWhatsapp = whatsapp.trim();
      if (!nextName) throw new Error('Nama lengkap wajib diisi.');
      const result = await requireSupabase().from('profiles').update({ full_name: nextName, whatsapp: nextWhatsapp, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (result.error) throw new Error(result.error.message);
      onSaved({ id: user.id, full_name: nextName, whatsapp: nextWhatsapp, role: profile?.role || 'student', avatar_path: profile?.avatar_path, avatar_url: profile?.avatar_url });
      setMessage('Profil tersimpan.');
    } catch (saveError) {
      onError(saveError instanceof Error ? saveError.message : 'Profil gagal disimpan. Coba masuk ulang lalu ulangi.');
    } finally {
      setSaving(false);
    }
  };
  return <div className="max-w-2xl space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Akun</p><h1 className="mt-2 text-3xl font-semibold">Pengaturan profil</h1><p className="mt-2 text-sm text-[#607568]">Perbarui data yang digunakan untuk akun dan komunikasi kelas.</p></div>{message && <p className="rounded-xl bg-[#edf8f2] p-4 text-sm text-[#176148]">{message}</p>}<section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5"><h2 className="text-lg font-semibold">Informasi dasar</h2><form onSubmit={save} className="mt-5 space-y-4"><ProductionAdminField label="Nama lengkap" value={name} onChange={setName} placeholder="Nama peserta" /><ProductionAdminField label="Nomor WhatsApp" value={whatsapp} onChange={setWhatsapp} placeholder="08xxxxxxxxxx" /><button disabled={saving} className="flex min-h-10 items-center gap-2 rounded-full bg-[#006d77] px-4 text-sm font-bold text-white"><Save className="h-4 w-4" />{saving ? 'Menyimpan...' : 'Simpan profil'}</button></form></section><section className="rounded-[18px] border border-[#d4e1d8] bg-[#f5fbf7] p-5"><h2 className="text-lg font-semibold">Login terhubung Google</h2><p className="mt-2 text-sm leading-6 text-[#607568]">Akun Al Madraj menggunakan Google Auth sebagai satu-satunya metode masuk.</p></section></div>;
};

type PaymentOrder = { id: string; amount: number; status: string; checkout_url: string | null; expires_at: string | null; courses?: { title: string; slug: string } | Array<{ title: string; slug: string }> };

const PaymentStatusRoute = ({ path, user, onNavigate }: { path: string; user: { id: string }; onNavigate: (path: string) => void }) => {
  const orderId = path.split('/')[2]?.split('?')[0];
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = async () => {
    if (!orderId) { setMessage('Nomor order tidak valid.'); setLoading(false); return; }
    const sb = requireSupabase();
    await sb.rpc('refresh_lms_order_status', { p_order_id: orderId });
    const result = await sb.from('orders').select('id,amount,status,checkout_url,expires_at,courses(title,slug)').eq('id', orderId).eq('user_id', user.id).maybeSingle();
    if (result.error) setMessage(result.error.message);
    setOrder(result.data as PaymentOrder | null);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    if (order?.status === 'paid' || order?.status === 'expired' || order?.status === 'cancelled') return;
    const timer = window.setInterval(() => { void load(); }, 5000);
    return () => window.clearInterval(timer);
  }, [orderId, user.id, order?.status]);

  if (loading) return <div className="grid min-h-[45dvh] place-items-center text-sm text-[#607568]"><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />Memeriksa pembayaran...</div>;
  if (!order) return <Notice title="Order tidak ditemukan" text={message || 'Order ini tidak tersedia untuk akunmu.'} />;
  const course = Array.isArray(order.courses) ? order.courses[0] : order.courses;
  const paid = order.status === 'paid';
  const expired = order.status === 'expired' || order.status === 'cancelled';
  return <div className="mx-auto max-w-2xl"><section className="rounded-[20px] border border-[#d4e1d8] bg-white p-6 text-center shadow-[0_14px_35px_rgba(7,84,71,0.06)] sm:p-9"><span className={'mx-auto grid h-14 w-14 place-items-center rounded-full ' + (paid ? 'bg-[#e5f4f2] text-[#006d77]' : expired ? 'bg-[#fff1eb] text-[#b36d4c]' : 'bg-[#eef8f2] text-[#006d77]')}>{paid ? <CheckCircle2 className="h-7 w-7" /> : expired ? <X className="h-7 w-7" /> : <RefreshCw className="h-6 w-6 animate-spin" />}</span><p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Status pembayaran</p><h1 className="mt-3 text-3xl font-semibold">{paid ? 'Pembayaran berhasil' : expired ? 'Tautan pembayaran berakhir' : 'Menunggu konfirmasi pembayaran'}</h1><p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#607568]">{paid ? 'Akses kelas sudah aktif dan materi dapat langsung dibuka.' : expired ? 'Buat order baru dari halaman kelas untuk memperoleh tautan pembayaran baru.' : 'Halaman ini memeriksa status secara otomatis. Setelah pembayaran terkonfirmasi, akses kelas akan langsung aktif secara otomatis.'}</p><div className="mx-auto mt-7 max-w-md rounded-[16px] bg-[#f5fbf7] p-5 text-left"><Summary label="Program" value={course?.title || 'Program Al Madraj'} /><Summary label="Total" value={money(order.amount)} strong /><Summary label="Status" value={order.status.toUpperCase()} /></div><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">{paid && <button onClick={() => onNavigate('/belajar/' + (course?.slug || ''))} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white">Buka ruang belajar <ArrowRight className="h-4 w-4" /></button>}{!paid && !expired && order.checkout_url && <a href={order.checkout_url} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white">Kembali ke pembayaran <CreditCard className="h-4 w-4" /></a>}<button onClick={() => void load()} className="flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cfe0d5] px-5 text-sm font-bold text-[#315747]"><RefreshCw className="h-4 w-4" />Periksa lagi</button></div></section></div>;
};

const TransactionsProductionRoute = ({ user }: { user: { id: string } }) => {
  const [orders, setOrders] = useState<Array<{ id: string; amount: number; status: string; provider: string; created_at: string; checkout_url: string | null; courses?: { title: string }[] }>>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { requireSupabase().from('orders').select('id,amount,status,provider,created_at,checkout_url,courses(title)').eq('user_id', user.id).order('created_at', { ascending: false }).then(({ data, error }) => { if (!error) setOrders((data || []) as typeof orders); setLoading(false); }); }, [user.id]);
  if (loading) return <PublicLoading />;
  return <div className="space-y-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Akun peserta</p><h1 className="mt-2 text-3xl font-semibold">Riwayat transaksi</h1><p className="mt-2 text-sm text-[#607568]">Semua order dan status pembayaran yang terkait dengan akunmu.</p></div><section className="rounded-[18px] border border-[#d4e1d8] bg-white p-5">{orders.length ? <div className="divide-y divide-[#e4eee7]">{orders.map((order) => <div key={order.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{order.courses?.[0]?.title || 'Program Al Madroj'}</p><p className="mt-1 text-xs text-[#819289]">{new Date(order.created_at).toLocaleDateString('id-ID')} · {order.provider}</p></div><div className="flex items-center gap-4"><div className="text-left sm:text-right"><p className="font-semibold text-[#006d77]">{money(order.amount)}</p><p className="mt-1 text-xs uppercase text-[#819289]">{order.status}</p></div>{order.status === 'pending' && order.checkout_url && <a href={order.checkout_url} className="text-xs font-bold text-[#006d77] underline">Bayar</a>}</div></div>)}</div> : <p className="py-5 text-sm text-[#819289]">Belum ada transaksi.</p>}</section></div>;
};

const LearningHubRoute = ({ user, profile, onNavigate, onLogout }: { user: { id: string }; profile: Profile | null; onNavigate: (path: string) => void; onLogout: () => void }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Array<{ id: string; course_id: string }>>([]);
  const [progressRows, setProgressRows] = useState<Array<{ lesson_id: string; completed_at: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [programFilter, setProgramFilter] = useState<'Semua' | ProgramType>('Semua');
  const [facultyFilter, setFacultyFilter] = useState('Semua');

  useEffect(() => {
    const load = async () => {
      const sb = requireSupabase();
      const [{ data: enrollmentData, error: enrollmentError }, { data: lessonData, error: lessonError }, { data: progressData, error: progressError }] = await Promise.all([
        sb.from('enrollments').select('id,status,course:courses(*)').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }),
        sb.from('lessons').select('id,course_id').eq('is_published', true),
        sb.from('lesson_progress').select('lesson_id,completed_at').eq('user_id', user.id),
      ]);
      if (enrollmentError) throw new Error(enrollmentError.message);
      if (lessonError) throw new Error(lessonError.message);
      if (progressError) throw new Error(progressError.message);
      let nextCourses = (enrollmentData || [])
        .map((item: any) => Array.isArray(item.course) ? item.course[0] : item.course)
        .filter(Boolean)
        .map((c: Course) => ({ ...c, tutor: getCourseTutorName(c.slug, c.tutor) })) as Course[];
      if (!nextCourses.length) {
        const { data: freeCourses } = await sb.from('courses').select('*').eq('price', 0).eq('is_published', true);
        if (freeCourses?.length) {
          nextCourses = (freeCourses as Course[]).map((c) => ({
            ...c,
            tutor: getCourseTutorName(c.slug, c.tutor),
          }));
        }
      }
      setCourses(nextCourses);
      setLessons((lessonData || []) as Array<{ id: string; course_id: string }>);
      setProgressRows((progressData || []) as Array<{ lesson_id: string; completed_at: string | null }>);
      setLoading(false);
    };
    load().catch(() => setLoading(false));
  }, [user.id]);

  const facultyFilters = ['Semua', ...Array.from(new Set(courses.map((course) => course.faculty)))];
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = (course.title + ' ' + course.summary + ' ' + course.faculty).toLowerCase().includes(search.toLowerCase());
    const matchesProgram = programFilter === 'Semua' || (course.program_type || 'Dars') === programFilter;
    const matchesFaculty = facultyFilter === 'Semua' || course.faculty === facultyFilter;
    return matchesSearch && matchesProgram && matchesFaculty;
  });
  const progressFor = (courseId: string) => {
    const courseLessonIds = lessons.filter((lesson) => lesson.course_id === courseId).map((lesson) => lesson.id);
    const completed = progressRows.filter((row) => courseLessonIds.includes(row.lesson_id) && Boolean(row.completed_at)).length;
    return { total: courseLessonIds.length, completed, percent: courseLessonIds.length ? Math.round((completed / courseLessonIds.length) * 100) : 0 };
  };
  const totalCompleted = courses.reduce((sum, course) => sum + progressFor(course.id).completed, 0);

  return <BackendShell profile={profile} onNavigate={onNavigate} onLogout={onLogout}><div className="space-y-8"><header className="flex flex-col justify-between gap-6 border-b border-[#dce9df] pb-7 lg:flex-row lg:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#006d77]">Kelas saya</p><h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-[#17382c] sm:text-5xl">Program yang kamu ikuti.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[#607568]">Semua kelas aktifmu tersimpan di satu tempat. Lanjutkan materi terakhir tanpa kehilangan progress.</p></div><div className="grid grid-cols-2 gap-3 sm:w-[280px]"><div className="rounded-[16px] bg-[#e5f4f2] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#6e8775]">Kelas aktif</p><p className="mt-2 text-2xl font-semibold text-[#006d77]">{courses.length}</p></div><div className="rounded-[16px] bg-[#006d77] p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9fe7c9]">Materi selesai</p><p className="mt-2 text-2xl font-semibold">{totalCompleted}</p></div></div></header>{loading ? <div className="rounded-[18px] border border-[#dce9df] bg-white p-6 text-sm text-[#607568]">Memuat kelasmu...</div> : courses.length ? <><section className="space-y-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><label className="flex min-h-11 flex-1 items-center gap-3 rounded-xl border border-[#cfe0d5] bg-white px-4 text-sm text-[#799083] lg:max-w-md"><Search className="h-4 w-4 shrink-0 text-[#006d77]" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9aada1]" placeholder="Cari kelas yang kamu ikuti" /></label><div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter jenis program">{(['Semua', 'Dars', 'Bimbel'] as const).map((filter) => <button key={filter} type="button" onClick={() => setProgramFilter(filter)} className={'min-h-10 shrink-0 rounded-full border px-4 text-sm font-semibold ' + (programFilter === filter ? 'border-[#006d77] bg-[#006d77] text-white' : 'border-[#cfe0d5] bg-white text-[#607568]')}>{filter}</button>)}</div></div><div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter fakultas">{facultyFilters.map((faculty) => <button key={faculty} type="button" onClick={() => setFacultyFilter(faculty)} className={'min-h-9 shrink-0 rounded-full border px-3.5 text-xs font-semibold ' + (facultyFilter === faculty ? 'border-[#006d77] bg-[#e5f4f2] text-[#006d77]' : 'border-[#dce9df] bg-white text-[#799083]')}>{faculty}</button>)}</div></section>          {filteredCourses.length ? (
            <section className="grid grid-cols-2 gap-2.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredCourses.map((course, index) => {
                const progress = progressFor(course.id);
                return (
                  <article
                    key={course.id}
                    className="group flex h-full flex-col overflow-hidden rounded-[16px] sm:rounded-[20px] border border-[#dce9df] bg-white transition hover:-translate-y-0.5 hover:border-[#91c9a4] hover:shadow-[0_16px_35px_rgba(7,84,71,0.08)]"
                  >
                    <div
                      className={
                        'relative flex w-full flex-col justify-between p-3 sm:p-4 overflow-hidden ' +
                        (index % 3 === 1 ? 'bg-[#e8f2f8]' : index % 3 === 2 ? 'bg-[#f6efdf]' : 'bg-[#e5f4f2]')
                      }
                      style={{ aspectRatio: '116.501 / 65.024' }}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="flex flex-wrap gap-1">
                          <span className="rounded-full bg-[#006d77] px-2 py-0.5 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-white">
                            {course.program_type || 'Dars'}
                          </span>
                          <span className="rounded-full bg-white/85 px-2 py-0.5 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider text-[#006d77] truncate max-w-[80px] sm:max-w-none">
                            {course.faculty}
                          </span>
                        </div>
                        <span className="flex h-6 w-6 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/75 text-[#006d77]">
                          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        </span>
                      </div>
                      <p className="mt-2 sm:mt-10 text-[10px] sm:text-xs font-semibold text-[#47755f] truncate">
                        {course.duration}
                      </p>
                    </div>
                    <div className="flex flex-1 flex-col p-3 sm:p-5 text-left">
                      <h2 className="text-xs sm:text-xl font-semibold leading-tight sm:leading-snug text-[#17382c] line-clamp-2 min-h-[32px] sm:min-h-0">
                        {course.title}
                      </h2>
                      <p className="mt-1 sm:mt-3 line-clamp-2 sm:line-clamp-3 text-[11px] sm:text-sm leading-relaxed sm:leading-6 text-[#607568] hidden sm:block">
                        {course.summary}
                      </p>
                      <div className="mt-2 sm:mt-5 border-t border-[#e1eee4] pt-2 sm:pt-4 text-[10.5px] sm:text-xs text-[#799083]">
                        <p className="truncate">
                          <span className="font-semibold text-[#315747]">Tutor:</span> {course.tutor}
                        </p>
                        <p className="mt-1 sm:mt-2 truncate hidden sm:block">
                          <span className="font-semibold text-[#315747]">Jadwal:</span> {course.schedule}
                        </p>
                      </div>
                      <div className="mt-2 sm:mt-5">
                        <div className="flex items-center justify-between text-[10px] sm:text-xs">
                          <span className="font-semibold text-[#315747]">Progress</span>
                          <span className="font-bold text-[#006d77]">{progress.percent}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 sm:h-2 rounded-full bg-[#e6efe8]">
                          <div
                            className="h-1.5 sm:h-2 rounded-full bg-[#006d77] transition-all"
                            style={{ width: progress.percent + '%' }}
                          />
                        </div>
                        <p className="mt-1 text-[9.5px] sm:text-[11px] text-[#799083] truncate">
                          {progress.total
                            ? progress.completed + ' dari ' + progress.total + ' materi'
                            : 'Materi disiapkan'}
                        </p>
                      </div>
                      <button
                        onClick={() => onNavigate('/belajar/' + course.slug)}
                        className="mt-3 sm:mt-5 flex min-h-8 sm:min-h-10 w-full items-center justify-center gap-1 sm:gap-2 rounded-lg sm:rounded-full bg-[#006d77] px-2 sm:px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#016b72]"
                      >
                        <span>Lanjut belajar</span>
                        <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          ) : <section className="rounded-[20px] border border-[#cfe0d5] bg-[#f5fbf7] p-7 text-center sm:p-10"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f4f2] text-[#006d77]"><Search className="h-5 w-5" /></div><h2 className="mt-5 text-2xl font-semibold text-[#17382c]">Kelas tidak ditemukan.</h2><p className="mt-2 text-sm leading-6 text-[#607568]">Coba ubah kata kunci atau filter yang kamu pilih.</p><button onClick={() => { setSearch(''); setProgramFilter('Semua'); setFacultyFilter('Semua'); }} className="mt-5 text-sm font-bold text-[#006d77]">Reset filter</button></section>}</> : <section className="rounded-[22px] border border-[#cfe0d5] bg-[#f5fbf7] p-7 sm:p-9"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f4f2] text-[#006d77]"><BookOpen className="h-6 w-6" /></div><h2 className="mt-6 text-2xl font-semibold text-[#17382c]">Belum ada kelas aktif.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#607568]">Kamu belum memiliki kelas yang bisa dipelajari. Pilih program dari katalog terlebih dahulu untuk mulai belajar dan menyimpan progress.</p><button onClick={() => onNavigate('/kelas')} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#006d77] px-5 text-sm font-bold text-white">Lihat katalog <ArrowRight className="h-4 w-4" /></button></section>}</div></BackendShell>;
};

const LearningRouteWithTracking = ({ path, user, profile, onNavigate, onError, onLogout }: { path: string; user: { id: string; email?: string }; profile: Profile | null; onNavigate: (path: string) => void; onError: (message: string) => void; onLogout: () => void }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progressByLesson, setProgressByLesson] = useState<Record<string, LessonProgress>>({});
  const [youtubeMetadataByLesson, setYoutubeMetadataByLesson] = useState<Record<string, YouTubeMetadata>>({});
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [focusedLesson, setFocusedLesson] = useState<Lesson | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [activeTab, setActiveTab] = useState<'saburah' | 'notes' | 'modul' | 'certificate'>('saburah');
  const [lightboxPhotoIndex, setLightboxPhotoIndex] = useState<number | null>(null);
  const [whiteboardManagerOpen, setWhiteboardManagerOpen] = useState(false);
  const [teacherNotesEditorOpen, setTeacherNotesEditorOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const lastPersistedAt = useRef<Record<string, number>>({});
  const progressRef = useRef(progressByLesson);

  useEffect(() => { progressRef.current = progressByLesson; }, [progressByLesson]);
  useEffect(() => {
    if (!activeLesson && lessons.length) {
      try {
        const query = path.includes('?') ? path.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const targetLessonId = params.get('lesson');
        if (targetLessonId) {
          const match = lessons.find((l) => l.id === targetLessonId);
          if (match) {
            setActiveLesson(match);
            return;
          }
        }
      } catch {}
      setActiveLesson(lessons[0]);
    }
  }, [activeLesson, lessons, path]);

  useEffect(() => {
    if (lessons.length && path.includes('lesson=')) {
      try {
        const query = path.includes('?') ? path.split('?')[1] : '';
        const params = new URLSearchParams(query);
        const targetLessonId = params.get('lesson');
        if (targetLessonId) {
          const match = lessons.find((l) => l.id === targetLessonId);
          if (match && match.id !== activeLesson?.id) {
            setActiveLesson(match);
          }
        }
      } catch {}
    }
  }, [path, lessons, activeLesson?.id]);

  useEffect(() => {
    const controller = new AbortController();
    let disposed = false;
    const videoLessons = lessons.filter((lesson) => lesson.content_type === 'video' && youtubeVideoId(lesson.content_url || ''));
    if (!videoLessons.length) {
      setYoutubeMetadataByLesson({});
      return () => controller.abort();
    }

    const cache = readYouTubeMetadataCache();
    const cachedMetadata = videoLessons.reduce<Record<string, YouTubeMetadata>>((result, lesson) => {
      const videoId = youtubeVideoId(lesson.content_url || '');
      if (videoId && cache[videoId]) result[lesson.id] = cache[videoId];
      return result;
    }, {});
    setYoutubeMetadataByLesson(cachedMetadata);

    const missingLessons = videoLessons.filter((lesson) => {
      const videoId = youtubeVideoId(lesson.content_url || '');
      return Boolean(videoId && !cache[videoId]);
    });
    if (missingLessons.length) {
      void Promise.all(missingLessons.map(async (lesson) => {
        const metadata = await fetchYouTubeMetadata(lesson.content_url || '', controller.signal);
        return { lesson, metadata };
      })).then((results) => {
        if (disposed) return;
        const nextCache = { ...cache };
        const fetchedMetadata: Record<string, YouTubeMetadata> = {};
        results.forEach(({ lesson, metadata }) => {
          const videoId = youtubeVideoId(lesson.content_url || '');
          if (!videoId || !metadata) return;
          nextCache[videoId] = metadata;
          fetchedMetadata[lesson.id] = metadata;
        });
        writeYouTubeMetadataCache(nextCache);
        setYoutubeMetadataByLesson((current) => ({ ...current, ...fetchedMetadata }));
      });
    }

    return () => {
      disposed = true;
      controller.abort();
    };
  }, [lessons]);

  useEffect(() => {
    const load = async () => {
      const sb = requireSupabase();
      const slug = path.split('/')[2];
      const courseResult = await sb.from('courses').select('*').eq('slug', slug).single();
      if (!courseResult.data) return;
      const resolvedTutor = getCourseTutorName(courseResult.data.slug, courseResult.data.tutor);
      setCourse({
        ...courseResult.data,
        tutor: resolvedTutor,
        summary: [
          courseResult.data.summary,
          `Program ${courseResult.data.program_type || 'Dars'} untuk mahasiswa ${courseResult.data.faculty}.`,
          `Belajar bersama ${resolvedTutor} sesuai jadwal ${courseResult.data.schedule}.`,
          'Materi dapat dipelajari ulang dan progress tersimpan otomatis di ruang belajar.',
        ].filter(Boolean).join(' '),
      });
      const isFreeCourse = courseResult.data.price === 0 || !courseResult.data.price;
      let isEnrolled = false;

      const enrollmentResult = await sb.from('enrollments').select('id').eq('user_id', user.id).eq('course_id', courseResult.data.id).eq('status', 'active').maybeSingle();

      if (enrollmentResult.data) {
        isEnrolled = true;
      } else if (isFreeCourse) {
        // Free course: automatically enroll and activate access
        isEnrolled = true;
        try {
          await sb.rpc('enroll_lms_free_course', { p_course_slug: courseResult.data.slug });
        } catch {}
        try {
          await sb.from('enrollments').upsert({
            user_id: user.id,
            course_id: courseResult.data.id,
            status: 'active',
            activated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,course_id' });
        } catch {}
      }

      if (!isEnrolled) {
        setAccessDenied(true);
        return;
      }
      setAccessDenied(false);

      let loadedLessons: Lesson[] = [];
      const primaryRes = await sb.from('lessons').select('id,course_id,title,content_type,duration,content_url,sort_order,teacher_notes,board_photos').eq('course_id', courseResult.data.id).eq('is_published', true).order('sort_order');
      if (primaryRes.data && !primaryRes.error) {
        loadedLessons = primaryRes.data as Lesson[];
      } else {
        const fallbackRes = await sb.from('lessons').select('id,course_id,title,content_type,duration,content_url,sort_order').eq('course_id', courseResult.data.id).eq('is_published', true).order('sort_order');
        loadedLessons = (fallbackRes.data || []) as Lesson[];
      }
      if (!loadedLessons.length) {
        const detail = getCourseDetail(slug);
        if (detail?.lessons?.length) {
          loadedLessons = detail.lessons.map((item, idx) => ({
            id: `${courseResult.data.id}-lesson-${idx + 1}`,
            course_id: courseResult.data.id,
            title: item.title,
            content_type: 'video' as const,
            duration: item.duration || 'Video Kajian',
            content_url: item.youtubeUrl || `https://www.youtube.com/watch?v=${item.youtubeId}`,
            sort_order: item.sortOrder || idx + 1,
            teacher_notes: undefined,
            board_photos: []
          }));
        }
      }
      setLessons(loadedLessons);
      setCourse((current) => current ? {
        ...current,
        summary: `${current.summary} Kelas ini memiliki ${loadedLessons.length || 0} materi yang bisa kamu ikuti bertahap.`,
      } : current);

      const progressResult = await sb.from('lesson_progress').select('lesson_id,watched_seconds,duration_seconds,completed_at').eq('user_id', user.id);
      if (progressResult.error) {
        const legacyResult = await sb.from('lesson_progress').select('lesson_id,completed_at').eq('user_id', user.id);
        if (legacyResult.error) throw new Error(progressResult.error.message);
        const legacyProgress = (legacyResult.data || []).reduce<Record<string, LessonProgress>>((map, item: { lesson_id: string; completed_at: string | null }) => {
          map[item.lesson_id] = { lesson_id: item.lesson_id, watched_seconds: 0, duration_seconds: 0, completed_at: item.completed_at };
          return map;
        }, {});
        setProgressByLesson(legacyProgress);
      } else {
        const nextProgress = (progressResult.data || []).reduce<Record<string, LessonProgress>>((map, item: LessonProgress) => {
          map[item.lesson_id] = { lesson_id: item.lesson_id, watched_seconds: Number(item.watched_seconds) || 0, duration_seconds: Number(item.duration_seconds) || 0, completed_at: item.completed_at };
          return map;
        }, {});
        setProgressByLesson(nextProgress);
      }
    };
    load().catch((loadError) => onError(loadError instanceof Error ? loadError.message : 'Materi gagal dimuat.'));
  }, [path, user.id, onError]);

  const persistProgress = async (lesson: Lesson, watchedSeconds: number, durationSeconds: number, completed = false, force = false) => {
    const previous = progressRef.current[lesson.id];
    const next: LessonProgress = {
      lesson_id: lesson.id,
      watched_seconds: Math.max(0, Math.floor(watchedSeconds)),
      duration_seconds: Math.max(0, Math.floor(durationSeconds || previous?.duration_seconds || durationToSeconds(lesson.duration))),
      completed_at: completed ? new Date().toISOString() : previous?.completed_at || null,
    };
    progressRef.current = { ...progressRef.current, [lesson.id]: next };
    setProgressByLesson(progressRef.current);
    const now = Date.now();
    if (!force && now - (lastPersistedAt.current[lesson.id] || 0) < 4000) return;
    lastPersistedAt.current[lesson.id] = now;
    const result = await requireSupabase().from('lesson_progress').upsert({
      user_id: user.id,
      lesson_id: lesson.id,
      watched_seconds: next.watched_seconds,
      duration_seconds: next.duration_seconds,
      completed_at: next.completed_at,
      last_watched_at: new Date().toISOString(),
    });
    if (result.error) onError('Progress video gagal disimpan. Jalankan migration progress terbaru di Supabase.');
  };

  const toggleDocument = async (lesson: Lesson) => {
    const current = progressRef.current[lesson.id];
    if (current?.completed_at) {
      const result = await requireSupabase().from('lesson_progress').delete().eq('user_id', user.id).eq('lesson_id', lesson.id);
      if (result.error) return onError(result.error.message);
      const next = { ...progressRef.current };
      delete next[lesson.id];
      progressRef.current = next;
      setProgressByLesson(next);
      return;
    }
    await persistProgress(lesson, 0, 0, true, true);
  };

  const completedCount = lessons.filter((lesson) => Boolean(progressByLesson[lesson.id]?.completed_at)).length;
  const overallProgress = lessons.length ? Math.round(lessons.reduce((total, lesson) => total + progressPercent(progressByLesson[lesson.id], lesson), 0) / lessons.length) : 0;
  if (!course) return <PublicLoading />;
  if (accessDenied) {
    return (
      <BackendShell profile={profile} onNavigate={onNavigate} onLogout={onLogout}>
        <div className="mx-auto max-w-xl py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf6ee] text-[#006d77]">
            <LockKeyhole className="h-8 w-8 text-[#006d77]" />
          </div>
          <h1 className="mt-6 text-2xl font-bold text-[#143428]">Akses Kelas Belum Aktif</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5c7768]">
            {course?.title
              ? `Materi untuk "${course.title}" memerlukan status pendaftaran aktif di akunmu.`
              : 'Kelas ini hanya dapat dibuka setelah pendaftaran akunmu aktif.'}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {course?.price === 0 ? (
              <button
                onClick={async () => {
                  try {
                    const sb = requireSupabase();
                    await sb.rpc('enroll_lms_free_course', { p_course_slug: course.slug });
                    await sb.from('enrollments').upsert({
                      user_id: user.id,
                      course_id: course.id,
                      status: 'active',
                      activated_at: new Date().toISOString(),
                    }, { onConflict: 'user_id,course_id' });
                    setAccessDenied(false);
                  } catch {
                    onNavigate('/kelas/' + course.slug);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#064238] cursor-pointer"
              >
                <span>Aktifkan Akses Sekarang</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('/kelas/' + (course?.slug || ''))}
                className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#064238] cursor-pointer"
              >
                <span>Lihat &amp; Daftar Kelas</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onNavigate('/kelas')}
              className="inline-flex items-center gap-2 rounded-full border border-[#c4dcce] bg-white px-5 py-3 text-sm font-semibold text-[#547363] hover:border-[#006d77] hover:text-[#006d77] cursor-pointer"
            >
              Kembali ke Katalog
            </button>
          </div>
        </div>
      </BackendShell>
    );
  }
  const activeProgress = activeLesson ? progressPercent(progressByLesson[activeLesson.id], activeLesson) : 0;
  const activeCompleted = Boolean(activeLesson && progressByLesson[activeLesson.id]?.completed_at);
  const activeYoutubeId = activeLesson?.content_type === 'video' && activeLesson.content_url ? youtubeVideoId(activeLesson.content_url) : '';
  const activeYoutubeMetadata = activeLesson ? youtubeMetadataByLesson[activeLesson.id] : undefined;
  const activeLessonTitle = activeLesson?.title || (activeYoutubeMetadata?.title ? activeYoutubeMetadata.title.replace(/\s*\|\s*Al[\s-]?Madraj.*$/i, '').trim() : 'Belum ada materi dipilih');
  const markActiveComplete = () => { if (activeLesson) void toggleDocument(activeLesson); };
  const currentIndex = lessons.findIndex((l) => l.id === activeLesson?.id);
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
  const courseDetail = course ? getCourseDetail(course.slug) : undefined;
  const activeLessonDetail = courseDetail?.lessons?.find((item, idx) => item.sortOrder === activeLesson?.sort_order || idx === currentIndex);

  const userEmail = (user.email || profile?.full_name || '').toLowerCase().trim();
  const isMaster = isMasterAdmin(user.email);
  const isCoursePj = Boolean(
    course?.pj_email && course.pj_email.toLowerCase().trim() === userEmail
  ) || Boolean(
    course?.pj_name && profile?.full_name && course.pj_name.toLowerCase().trim() === profile.full_name.toLowerCase().trim()
  );
  const canManageCourse = isMaster || profile?.role === 'admin' || isCoursePj;

  const handleSaveBoardPhotos = async (updatedPhotos: string[]) => {
    if (!activeLesson) return;
    const sb = requireSupabase();
    const { error: saveErr } = await sb.from('lessons').update({
      board_photos: updatedPhotos,
    }).eq('id', activeLesson.id);
    if (saveErr) throw new Error(saveErr.message);

    const updatedLesson: Lesson = { ...activeLesson, board_photos: updatedPhotos };
    setActiveLesson(updatedLesson);
    setLessons((prev) => prev.map((l) => (l.id === activeLesson.id ? updatedLesson : l)));
  };

  const handleSaveTeacherNotes = async (notes: string) => {
    if (!activeLesson) return;
    const sb = requireSupabase();
    const { error: saveErr } = await sb.from('lessons').update({
      teacher_notes: notes,
    }).eq('id', activeLesson.id);
    if (saveErr) throw new Error(saveErr.message);

    const updatedLesson: Lesson = { ...activeLesson, teacher_notes: notes };
    setActiveLesson(updatedLesson);
    setLessons((prev) => prev.map((l) => (l.id === activeLesson.id ? updatedLesson : l)));
  };

  return (
    <BackendShell profile={profile} onNavigate={onNavigate} onLogout={onLogout}>
      <div className="space-y-5">
        <button
          onClick={() => onNavigate('/belajar')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#607568] hover:text-[#006d77] transition"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke kelas saya
        </button>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
          <main className="min-w-0 space-y-6">
            {/* Course Summary Banner */}
            <section className="rounded-[22px] border border-[#dce9df] bg-white p-5 sm:p-7 shadow-xs">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#799083]">
                <span>Ruang Belajar</span>
                <span className="text-[#b4c5ba]">/</span>
                <span className="text-[#006d77]">{course.faculty}</span>
                <span className="text-[#b4c5ba]">/</span>
                <span className="rounded-md bg-[#eef8f2] px-2 py-0.5 text-[11px] font-bold text-[#006d77]">
                  {course.program_type || 'Dars'}
                </span>
              </div>
              <h1 className="mt-3 max-w-4xl text-2xl font-bold leading-tight tracking-tight text-[#17382c] sm:text-3xl">
                {course.title}
              </h1>
              <div className="mt-5 grid grid-cols-2 gap-3 border-t border-[#edf4ef] pt-4 sm:grid-cols-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa18f]">Progres Belajar</p>
                  <p className="mt-1 text-base font-bold text-[#006d77]">{overallProgress}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa18f]">Materi Selesai</p>
                  <p className="mt-1 text-base font-bold text-[#17382c]">{completedCount}/{lessons.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa18f]">Durasi Kelas</p>
                  <p className="mt-1 text-base font-bold text-[#17382c]">{course.duration}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aa18f]">Pengampu</p>
                  <p className="mt-1 truncate text-xs font-bold text-[#17382c]" title={getCourseTutorName(course.slug, course.tutor)}>
                    {getCourseTutorName(course.slug, course.tutor)}
                  </p>
                </div>
              </div>
            </section>

            {/* Video Stage & Lesson Details Card */}
            <section className="overflow-hidden rounded-[24px] border border-[#d8e6dc] bg-white shadow-sm">
              {/* Cinema Player Container - Zero Ugly Margin */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                {activeLesson?.content_type === 'audio' ? (
                  activeLesson.content_url && getGoogleDriveEmbedUrl(activeLesson.content_url) ? (
                    <div className="relative h-full w-full bg-[#081f18] flex flex-col items-center justify-center p-4 sm:p-6">
                      <div className="w-full max-w-2xl rounded-2xl overflow-hidden border border-[#2b6d58] shadow-2xl bg-black">
                        <div className="bg-gradient-to-r from-[#006d77] to-[#102c22] px-4 py-3 flex items-center justify-between text-white">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Headphones className="h-4 w-4 text-[#83c5be] shrink-0" />
                            <span className="text-xs sm:text-sm font-bold truncate">{activeLessonTitle}</span>
                          </div>
                          <span className="text-[10px] uppercase font-mono tracking-wider bg-white/10 px-2 py-0.5 rounded-full shrink-0 ml-2">
                            Google Drive Audio
                          </span>
                        </div>
                        <iframe
                          src={getGoogleDriveEmbedUrl(activeLesson.content_url)!}
                          className="w-full h-32 sm:h-40 border-0"
                          allow="autoplay"
                          title={activeLessonTitle}
                        />
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs text-[#a4ebd0]/90 text-center">
                        <Headphones className="h-3.5 w-3.5 text-[#83c5be]" />
                        <span>Dengarkan audio sambil membuka tab <strong>Foto Papan Tulis</strong> di bawah</span>
                      </div>
                    </div>
                  ) : activeLesson?.content_url ? (
                    <div className="h-full w-full flex items-center justify-center p-4 sm:p-6 bg-[#07241c]">
                      <div className="w-full max-w-2xl">
                        <AudioLessonPlayer
                          audioUrl={activeLesson.content_url}
                          title={activeLessonTitle}
                          tutor={getCourseTutorName(course.slug, course.tutor)}
                          startSeconds={progressByLesson[activeLesson.id]?.watched_seconds || 0}
                          onProgress={(watched, duration, force) => {
                            void persistProgress(activeLesson, watched, duration, false, force);
                          }}
                          onComplete={(watched, duration) => {
                            void persistProgress(activeLesson, watched, duration, true, true);
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#607568] bg-[#0c1f18]">
                      <Headphones className="h-14 w-14 text-[#83c5be] mb-2" />
                      <p className="text-base font-bold text-white">Audio Talaqqi Belum Tersedia</p>
                      <p className="mt-1 max-w-md text-xs leading-5 text-[#a4ebd0]/70">
                        {course.pj_name ? `PJ Maddah (${course.pj_name})` : 'Pengelola'} sedang menyiapkan rekaman audio untuk materi ini.
                      </p>
                    </div>
                  )
                ) : activeLesson?.content_type === 'video' && activeLesson.content_url && getGoogleDriveEmbedUrl(activeLesson.content_url) ? (
                  <iframe
                    src={getGoogleDriveEmbedUrl(activeLesson.content_url)!}
                    className="h-full w-full border-0"
                    allow="autoplay; fullscreen"
                    title={activeLessonTitle}
                  />
                ) : activeYoutubeId && activeLesson ? (
                  <YouTubeRestrictedPlayer
                    videoId={activeYoutubeId}
                    title={activeLessonTitle}
                    startSeconds={progressByLesson[activeLesson.id]?.watched_seconds || 0}
                    onProgress={(watched, duration, force) => {
                      void persistProgress(activeLesson, watched, duration, false, force);
                    }}
                    onComplete={(watched, duration) => {
                      void persistProgress(activeLesson, watched, duration, true, true);
                    }}
                  />
                ) : activeLesson?.content_type === 'pdf' && activeLesson.content_url ? (
                  <div className="flex h-full flex-col items-center justify-center bg-[#f5fbf7] px-6 text-center text-[#006d77]">
                    <FileText className="h-14 w-14 text-[#006d77]" />
                    <p className="mt-3 text-base font-bold text-[#17382c]">Materi PDF Siap Dipelajari</p>
                    <button
                      onClick={() => setFocusedLesson(activeLesson)}
                      className="mt-4 rounded-full bg-[#006d77] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#064238] cursor-pointer"
                    >
                      Buka Dokumen PDF
                    </button>
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-[#607568] bg-[#0c1f18]">
                    <CirclePlay className="h-14 w-14 text-[#83c5be]" />
                    <p className="mt-3 text-base font-bold text-white">
                      {activeLesson ? 'Materi video/audio belum tersedia' : 'Pilih materi untuk mulai belajar'}
                    </p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-[#a4ebd0]/70">
                      {activeLesson
                        ? 'Link konten Google Drive atau video belum diisi untuk materi ini.'
                        : 'Pilih salah satu bab dari daftar isi kelas di samping kanan.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Lesson Control & Meta Bar - Precision & Elegant Layout */}
              <div className="p-5 sm:p-7">
                {/* 1. Header: Pill Badges & Breadcrumb */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-800 border border-emerald-200/70">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Sedang Dipelajari
                    </span>
                    {activeCompleted && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 border border-emerald-200">
                        <Check className="h-3 w-3 text-emerald-700" /> Selesai
                      </span>
                    )}
                    <span className="text-xs font-semibold text-gray-500">
                      Pertemuan {currentIndex >= 0 ? currentIndex + 1 : 1} dari {lessons.length}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-gray-400 hidden sm:block">
                    {course.faculty}
                  </div>
                </div>

                {/* 2. Full Width Title & Description (No cramping, elegant typography) */}
                <div className="pt-4 space-y-2">
                  <h2 className="text-xl sm:text-2xl lg:text-[1.65rem] font-bold leading-snug tracking-tight text-gray-900 max-w-4xl">
                    {activeLessonTitle}
                  </h2>
                  {activeLessonDetail?.description && (
                    <p className="text-xs sm:text-sm leading-relaxed text-gray-600 max-w-3xl">
                      {activeLessonDetail.description}
                    </p>
                  )}
                </div>

                {/* 3. Action Toolbar & Metadata Bar */}
                <div className="mt-5 flex flex-col gap-4 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
                    {getCourseTutorName(course.slug, course.tutor) && (
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        <span className="text-gray-400 font-normal">Pengampu:</span>
                        {getCourseTutorName(course.slug, course.tutor)}
                      </span>
                    )}
                    <span className="text-gray-300">•</span>
                    <span>Durasi: {activeLesson?.duration || 'Video Kajian'}</span>
                    <span className="text-gray-300">•</span>
                    <span className="text-emerald-700 font-medium">Progres: {activeProgress}% tersimpan</span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => activeLesson && setFocusedLesson(activeLesson)}
                      disabled={!activeLesson}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 cursor-pointer shadow-2xs"
                    >
                      <Eye className="h-3.5 w-3.5 text-gray-500" />
                      <span>Mode Fokus</span>
                    </button>
                    <button
                      onClick={markActiveComplete}
                      disabled={!activeLesson}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-40 cursor-pointer shadow-2xs ${
                        activeCompleted
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                          : 'bg-gray-900 text-white hover:bg-black'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{activeCompleted ? 'Selesai' : 'Tandai Selesai'}</span>
                    </button>
                    {nextLesson && (
                      <button
                        onClick={() => setActiveLesson(nextLesson)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs font-semibold text-gray-800 transition hover:bg-gray-100 hover:border-gray-300 cursor-pointer shadow-2xs"
                        title={`Lanjut ke ${nextLesson.title}`}
                      >
                        <span>Materi Berikutnya</span>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Interactive Tabbed Section: Foto Papan Tulis (Saburah), Catatan Guru, Modul PDF, Syahadah */}
            <section className="overflow-hidden rounded-[24px] border border-[#d8e6dc] bg-white shadow-sm">
              {/* Tab Headers */}
              <div className="flex border-b border-gray-100 bg-[#fbfdfc] overflow-x-auto px-4 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('saburah')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'saburah'
                      ? 'border-[#006d77] text-[#006d77]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Camera className="h-4 w-4" />
                  <span>Foto Papan Tulis</span>
                  {activeLesson?.board_photos?.length ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {activeLesson.board_photos.length}
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-[#006d77] text-[#006d77]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Catatan Guru</span>
                  {activeLesson?.teacher_notes ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('modul')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'modul'
                      ? 'border-[#006d77] text-[#006d77]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Modul &amp; Diktat PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('certificate')}
                  className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-bold transition whitespace-nowrap cursor-pointer ${
                    activeTab === 'certificate'
                      ? 'border-[#006d77] text-[#006d77]'
                      : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Award className="h-4 w-4 text-amber-600" />
                  <span>Syahadah Khatam</span>
                  {overallProgress === 100 && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 animate-bounce">
                      Siap
                    </span>
                  )}
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-5 sm:p-7">
                {/* TAB 1: Foto Papan Tulis (Saburah) */}
                {activeTab === 'saburah' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          Dokumentasi Papan Tulis (Saburah)
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Simak audio bimbel sambil memperbesar tulisan, bagan, dan catatan yang ditulis pengampu di papan tulis.
                        </p>
                      </div>
                      {canManageCourse && activeLesson && (
                        <button
                          type="button"
                          onClick={() => setWhiteboardManagerOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] cursor-pointer self-start"
                        >
                          <Camera className="h-3.5 w-3.5" />
                          <span>Kelola / Upload Foto Saburah</span>
                        </button>
                      )}
                    </div>

                    {activeLesson?.board_photos && activeLesson.board_photos.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                        {activeLesson.board_photos.map((url, idx) => (
                          <div
                            key={idx}
                            onClick={() => setLightboxPhotoIndex(idx)}
                            className="group relative aspect-4/3 rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer shadow-2xs hover:shadow-md transition hover:border-[#006d77]"
                          >
                            <img
                              src={url}
                              alt={`Papan Tulis ${idx + 1}`}
                              className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2.5">
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white">
                                <Maximize className="h-3 w-3" /> Perbesar Foto #{idx + 1}
                              </span>
                            </div>
                            <span className="absolute top-2 left-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                        <Camera className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">Belum Ada Foto Papan Tulis untuk Pertemuan Ini</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                          Foto catatan dan bagan papan tulis akan muncul di sini saat diunggah oleh PJ Maddah ({course.pj_name || 'Penanggung Jawab'}).
                        </p>
                        {canManageCourse && activeLesson && (
                          <button
                            type="button"
                            onClick={() => setWhiteboardManagerOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white hover:bg-[#00565e] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Upload Foto Papan Tulis Sekarang</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: Catatan Guru */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          Catatan Pengampu &amp; Faedah Dars
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Poin penting, rujukan kitab, ikhtisar kaidah, atau catatan resmi dari pengampu.
                        </p>
                      </div>
                      {canManageCourse && activeLesson && (
                        <button
                          type="button"
                          onClick={() => setTeacherNotesEditorOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00565e] cursor-pointer self-start"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>{activeLesson.teacher_notes ? 'Edit Catatan Guru' : '+ Tulis Catatan Guru'}</span>
                        </button>
                      )}
                    </div>

                    {activeLesson?.teacher_notes ? (
                      <div className="rounded-2xl border border-[#d8e6dc] bg-[#f9fcfb] p-5 sm:p-6 text-gray-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                        {activeLesson.teacher_notes}
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                        <FileText className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">Belum Ada Catatan Guru untuk Materi Ini</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                          Catatan faedah penting dars akan dicantumkan di sini oleh PJ Maddah.
                        </p>
                        {canManageCourse && activeLesson && (
                          <button
                            type="button"
                            onClick={() => setTeacherNotesEditorOpen(true)}
                            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white hover:bg-[#00565e] cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Tulis Catatan Guru Sekarang</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 3: Modul & Diktat PDF */}
                {activeTab === 'modul' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Diktat &amp; Modul Pembelajaran PDF
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Unduh materi resmi, muqarrar dars, atau kitab pegangan untuk mata kuliah ini.
                      </p>
                    </div>

                    {course.modul_url ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 sm:p-6">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#006d77] text-white shadow-sm">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-gray-900">
                              Diktat Lengkap: {course.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">
                              Format PDF resmi • Markaz Al Madraj Al-Azhar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={course.modul_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#00565e] transition cursor-pointer"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download / Buka PDF</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center bg-gray-50/50">
                        <BookOpen className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm font-semibold text-gray-700">Modul / Diktat PDF Belum Diunggah</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                          File diktat PDF sedang disiapkan oleh PJ Maddah ({course.pj_name || 'Admin Markaz'}). Silakan cek kembali secara berkala.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: Syahadah Khatam */}
                {activeTab === 'certificate' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-gray-900">
                        Syahadah Khatam Dirasah (Sertifikat)
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Bukti resmi penyelesaian seluruh muqarrar dars dan talaqqi di Markaz Dirasat Al Madraj.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-[#d8e6dc] bg-gradient-to-br from-[#f8fcf9] via-white to-[#edf7f2] p-6 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006d77]/10 text-[#006d77] mb-3">
                        <Award className="h-8 w-8 text-[#006d77]" />
                      </div>

                      <h4 className="text-lg sm:text-xl font-bold text-[#17382c]">
                        {course.title}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">
                        Progres Pembelajaran Anda: <strong className="text-[#006d77]">{overallProgress}%</strong> ({completedCount} dari {lessons.length} materi selesai)
                      </p>

                      <div className="my-5 mx-auto max-w-md">
                        <div className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#006d77] transition-all duration-500"
                            style={{ width: `${overallProgress}%` }}
                          />
                        </div>
                      </div>

                      {overallProgress >= 100 || completedCount >= lessons.length ? (
                        <div className="space-y-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
                            <Check className="h-3.5 w-3.5" /> Syahadah Siap Dicetak
                          </span>
                          <div>
                            <button
                              type="button"
                              onClick={() => setCertificateModalOpen(true)}
                              className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-6 py-3 text-sm font-bold text-white shadow-lg hover:bg-[#00565e] hover:scale-105 transition cursor-pointer"
                            >
                              <Award className="h-4 w-4" />
                              <span>Klaim &amp; Cetak Syahadah Sekarang</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-600 mb-3">
                            Selesaikan semua materi di daftar isi kelas untuk membuka Syahadah Khatam resmi Anda.
                          </p>
                          <button
                            type="button"
                            onClick={() => setCertificateModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Pratinjau Format Syahadah</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Course Summary & Details */}
            <section className="rounded-[22px] border border-[#dce9df] bg-white p-5 sm:p-6 shadow-xs">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006d77]">Tentang Kelas</p>
              <h2 className="mt-2 text-xl font-bold text-[#17382c]">{course.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#607568]">{course.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-[#607568]">
                <span className="rounded-full bg-[#f1f7f3] px-3 py-1.5 text-[#006d77]">{course.faculty}</span>
                <span className="rounded-full bg-[#f1f7f3] px-3 py-1.5">{course.schedule}</span>
                <span className="rounded-full bg-[#f1f7f3] px-3 py-1.5">Progress tersimpan otomatis</span>
              </div>
            </section>
          </main>

          {/* Playlist Sidebar - Text Underneath Thumbnail */}
          <aside className="overflow-hidden rounded-[22px] border border-[#dce9df] bg-white shadow-xs xl:sticky xl:top-[84px]">
            {/* Header */}
            <div className="border-b border-[#edf4ef] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#006d77]">
                    Isi Kelas
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#17382c]">
                    Materi Pembelajaran
                  </h2>
                </div>
                <span className="rounded-full bg-[#eef8f2] px-2.5 py-1 text-xs font-bold text-[#006d77]">
                  {completedCount}/{lessons.length}
                </span>
              </div>
              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-[#edf4ef] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#006d77] transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lesson Cards with Text Under Thumbnail */}
            <div className="max-h-[calc(100dvh-240px)] overflow-y-auto divide-y divide-[#edf4ef]">
              {lessons.map((lesson, index) => {
                const isActive = activeLesson?.id === lesson.id;
                const isCompleted = Boolean(progressByLesson[lesson.id]?.completed_at);
                const progress = progressPercent(progressByLesson[lesson.id], lesson);
                const youtubeMetadata = youtubeMetadataByLesson[lesson.id];
                const lessonTitle = youtubeMetadata?.title || lesson.title;
                const thumbnailUrl = youtubeMetadata?.thumbnailUrl || youtubeThumbnailUrl(lesson.content_url || '');

                return (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLesson(lesson)}
                    className={`group flex w-full flex-col p-4 text-left transition cursor-pointer ${
                      isActive
                        ? 'bg-[#f0faf5] border-l-4 border-l-[#006d77]'
                        : 'border-l-4 border-l-transparent hover:bg-[#f7fbf8]'
                    }`}
                  >
                    {/* 1. Thumbnail Container on Top */}
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0c1f18] shadow-xs">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#006d77]/15 text-[#006d77]">
                          <CirclePlay className="h-10 w-10" />
                        </div>
                      )}

                      {/* Top-left: Bab Number Badge */}
                      <span className="absolute left-2 top-2 rounded-md bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                        Materi {index + 1}
                      </span>

                      {/* Top-right: Status Badge */}
                      {isCompleted ? (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#006d77]/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                          <Check className="h-3 w-3" /> Selesai
                        </span>
                      ) : isActive ? (
                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#34d399]/90 px-2 py-0.5 text-[10px] font-bold text-[#063328] backdrop-blur-xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#063328] animate-pulse" /> Sedang Diputar
                        </span>
                      ) : null}

                      {/* Bottom-right: Duration */}
                      <span className="absolute bottom-2 right-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-xs">
                        {lesson.duration}
                      </span>

                      {/* Bottom edge progress bar */}
                      {lesson.content_type === 'video' && progress > 0 && (
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-black/40">
                          <div
                            className="h-full bg-[#34d399] transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 2. Text / Tulisan di Bawah Thumbnail */}
                    <div className="mt-3 w-full space-y-1.5">
                      <h3
                        className={`text-sm font-bold leading-snug line-clamp-2 transition ${
                          isActive ? 'text-[#006d77]' : 'text-[#17382c] group-hover:text-[#006d77]'
                        }`}
                      >
                        {lessonTitle}
                      </h3>

                      <div className="flex items-center justify-between text-xs text-[#799083]">
                        <span className="truncate max-w-[190px] text-[11px] font-medium text-[#5c7768]">
                          {youtubeMetadata?.authorName || 'Al-Madraj Edu'}
                        </span>
                        <span className="text-[11px] font-semibold">
                          {isCompleted ? (
                            <span className="text-[#006d77]">Tuntas</span>
                          ) : progress > 0 ? (
                            `${progress}%`
                          ) : (
                            'Belum mulai'
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </div>

        {focusedLesson && (
          <TrackedContentModal
            lesson={focusedLesson}
            metadata={youtubeMetadataByLesson[focusedLesson.id]}
            progress={progressByLesson[focusedLesson.id]}
            viewerLabel={profile?.full_name || 'Mahasiswa Al Madraj'}
            onProgress={(watched, duration, force) => {
              void persistProgress(focusedLesson, watched, duration, false, force);
            }}
            onComplete={(watched, duration) => {
              void persistProgress(focusedLesson, watched, duration, true, true);
            }}
            onClose={() => setFocusedLesson(null)}
          />
        )}

        {/* Whiteboard Lightbox Modal */}
        {lightboxPhotoIndex !== null && activeLesson?.board_photos && (
          <WhiteboardLightboxModal
            photos={activeLesson.board_photos}
            initialIndex={lightboxPhotoIndex}
            onClose={() => setLightboxPhotoIndex(null)}
          />
        )}

        {/* Whiteboard Manager Modal for PJ/Admin */}
        {whiteboardManagerOpen && activeLesson && (
          <WhiteboardManagerModal
            lesson={activeLesson}
            onSave={handleSaveBoardPhotos}
            onClose={() => setWhiteboardManagerOpen(false)}
          />
        )}

        {/* Teacher Notes Editor Modal for PJ/Admin */}
        {teacherNotesEditorOpen && activeLesson && (
          <TeacherNotesEditorModal
            lesson={activeLesson}
            onSave={handleSaveTeacherNotes}
            onClose={() => setTeacherNotesEditorOpen(false)}
          />
        )}

        {/* Official Certificate Modal */}
        {certificateModalOpen && (
          <CertificateModal
            studentName={profile?.full_name || 'Mahasiswa Al Madraj'}
            courseTitle={course.title}
            faculty={course.faculty}
            tutor={getCourseTutorName(course.slug, course.tutor)}
            onClose={() => setCertificateModalOpen(false)}
          />
        )}
      </div>
    </BackendShell>
  );
};

const youtubeVideoId = (url: string) => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([^?&/]+)/i);
  return match?.[1] || '';
};

const youtubeThumbnailUrl = (url: string) => {
  const videoId = youtubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '';
};

const YOUTUBE_METADATA_CACHE_KEY = 'al-madraj:youtube-metadata:v1';

const readYouTubeMetadataCache = (): Record<string, YouTubeMetadata> => {
  try {
    return JSON.parse(window.sessionStorage.getItem(YOUTUBE_METADATA_CACHE_KEY) || '{}') as Record<string, YouTubeMetadata>;
  } catch {
    return {};
  }
};

const writeYouTubeMetadataCache = (cache: Record<string, YouTubeMetadata>) => {
  try {
    window.sessionStorage.setItem(YOUTUBE_METADATA_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Metadata tetap tampil meskipun penyimpanan browser tidak tersedia.
  }
};

const fetchYouTubeMetadata = async (url: string, signal: AbortSignal): Promise<YouTubeMetadata | null> => {
  const videoId = youtubeVideoId(url);
  if (!videoId) return null;
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`, { signal });
    if (!response.ok) return null;
    const data = await response.json() as { title?: string; author_name?: string; thumbnail_url?: string };
    if (!data.title) return null;
    return {
      title: data.title,
      authorName: data.author_name || 'YouTube',
      thumbnailUrl: data.thumbnail_url || youtubeThumbnailUrl(url),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return null;
    return null;
  }
};

type YouTubePlayerInstance = {
  destroy: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  isMuted: () => boolean;
  mute: () => void;
  pauseVideo: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  unMute: () => void;
  setPlaybackRate?: (rate: number) => void;
  getPlaybackRate?: () => number;
};

let youtubeApiPromise: Promise<void> | null = null;
const loadYouTubePlayerApi = () => {
  const currentWindow = window as typeof window & { YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayerInstance }; onYouTubeIframeAPIReady?: () => void };
  if (currentWindow.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise<void>((resolve) => {
    const previousReady = currentWindow.onYouTubeIframeAPIReady;
    currentWindow.onYouTubeIframeAPIReady = () => { previousReady?.(); resolve(); };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return youtubeApiPromise;
};

const formatPlaybackTime = (value: number) => {
  if (!Number.isFinite(value) || value < 0) return '0:00';
  const totalSeconds = Math.floor(value);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const AudioLessonPlayer = ({
  audioUrl,
  title,
  tutor,
  coverUrl,
  startSeconds = 0,
  onProgress,
  onComplete,
}: {
  audioUrl: string;
  title: string;
  tutor?: string;
  coverUrl?: string;
  startSeconds?: number;
  onProgress: (watched: number, duration: number, force?: boolean) => void;
  onComplete: (watched: number, duration: number) => void;
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const lastReported = useRef(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = startSeconds;
    audio.playbackRate = playbackRate;
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    const dur = audioRef.current.duration || 0;
    setCurrentTime(cur);
    setDuration(dur);

    if (Math.abs(cur - lastReported.current) >= 4) {
      lastReported.current = cur;
      onProgress(Math.floor(cur), Math.floor(dur), false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (!audioRef.current) return;
    const dur = audioRef.current.duration || 0;
    onProgress(Math.floor(dur), Math.floor(dur), true);
    onComplete(Math.floor(dur), Math.floor(dur));
  };

  const seek = (seconds: number) => {
    if (!audioRef.current) return;
    const next = Math.max(0, Math.min(duration || 1000, seconds));
    audioRef.current.currentTime = next;
    setCurrentTime(next);
  };

  const skip = (delta: number) => {
    seek(currentTime + delta);
  };

  const changeRate = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const percent = duration ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#07241c] via-[#0d3429] to-[#041c15] p-6 text-white sm:p-8 shadow-xl border border-[#1b4e3f]">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        preload="metadata"
      />
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
        <div className="relative shrink-0">
          <div className={`h-28 w-28 sm:h-36 sm:w-36 rounded-2xl overflow-hidden border-2 border-[#2b6d58] shadow-lg ${isPlaying ? 'ring-4 ring-[#83c5be]/30' : ''}`}>
            {coverUrl ? (
              <img src={coverUrl} alt="Cover Talaqqi" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#006d77] to-[#043328] flex flex-col items-center justify-center p-3 text-center">
                <Headphones className="h-10 w-10 text-[#83c5be] mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">Dars Audio</span>
              </div>
            )}
          </div>
          {isPlaying && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#006d77] text-white shadow">
              <Music className="h-3 w-3 animate-spin" style={{ animationDuration: '3s' }} />
            </span>
          )}
        </div>

        <div className="flex-1 w-full min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
              <Headphones className="h-3 w-3" /> Audio Talaqqi Bimbel
            </span>
            {tutor && <span className="text-xs text-[#8ba99b]">Pengampu: {tutor}</span>}
          </div>
          <h3 className="mt-2 text-lg sm:text-xl font-bold leading-snug tracking-tight text-white line-clamp-2">
            {title}
          </h3>

          <div className="mt-5">
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const ratio = Math.max(0, Math.min(1, clickX / rect.width));
                seek(ratio * duration);
              }}
              className="relative h-2 w-full cursor-pointer rounded-full bg-white/20 hover:h-2.5 transition-all"
            >
              <div
                className="absolute top-0 bottom-0 left-0 rounded-full bg-[#83c5be] transition-all"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-[#a3c2b5]">
              <span>{formatPlaybackTime(currentTime)}</span>
              <span>{formatPlaybackTime(duration)}</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => skip(-10)}
                title="Mundur 10 detik"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#006d77] text-white shadow-lg hover:bg-[#00565e] hover:scale-105 transition cursor-pointer"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
              </button>
              <button
                type="button"
                onClick={() => skip(10)}
                title="Maju 10 detik"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center rounded-xl bg-white/10 p-0.5 text-[11px] font-bold">
                {[1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changeRate(rate)}
                    className={`rounded-lg px-2 py-1 transition cursor-pointer ${playbackRate === rate ? 'bg-[#006d77] text-white' : 'text-gray-300 hover:text-white'}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-gray-300 hover:text-white transition cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CertificateModal = ({
  studentName,
  courseTitle,
  faculty,
  tutor,
  completedDate,
  onClose,
}: {
  studentName: string;
  courseTitle: string;
  faculty?: string;
  tutor?: string;
  completedDate?: string;
  onClose: () => void;
}) => {
  const serialNo = useMemo(() => {
    const hash = Math.abs(courseTitle.split('').reduce((acc, c) => acc + c.charCodeAt(0), 1234));
    return `ALM-${new Date().getFullYear()}-${String(hash).slice(0, 5).padStart(5, '7')}`;
  }, [courseTitle]);

  const dateFormatted = completedDate
    ? new Date(completedDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const printCert = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-10 shadow-2xl border-4 border-[#006d77]/20 my-auto text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer print:hidden"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative rounded-2xl border-2 border-dashed border-[#006d77]/40 bg-gradient-to-b from-[#f9fcfb] via-white to-[#f4f9f6] p-6 sm:p-10">
          <div className="flex flex-col items-center">
            <img src="/al-madroj-brand.png" alt="Logo Al Madraj" className="h-14 w-auto object-contain" />
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-[#006d77]">
              Markaz Dirasat &amp; Riset Turats Al-Azhar
            </p>
            <h2 className="mt-1 font-serif text-3xl sm:text-4xl font-normal tracking-tight text-[#17382c]">
              SYAHADAH KHATAM DIRASAH
            </h2>
            <p className="text-xs italic text-gray-500 font-serif">Certificate of Course Completion</p>
          </div>

          <div className="my-6 border-t border-[#006d77]/20" />

          <p className="text-xs sm:text-sm text-gray-600">Diberikan secara resmi kepada:</p>
          <h3 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#006d77] underline decoration-[#006d77]/30 decoration-2 underline-offset-8">
            {studentName || 'Mahasiswa Al Madraj'}
          </h3>

          <p className="mt-6 max-w-xl mx-auto text-xs sm:text-sm leading-relaxed text-gray-700">
            Telah menyelesaikan seluruh rangkaian pembahasan, kajian talaqqi, dan muqarrar dars pada mata kuliah:
          </p>
          <h4 className="mt-3 text-xl sm:text-2xl font-bold text-[#17382c]">
            {courseTitle}
          </h4>
          {faculty && (
            <p className="mt-1 text-xs font-semibold text-[#557064]">
              Fakultas {faculty} • Jamiah Al-Azhar Kairo
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-gray-100 text-xs text-gray-600">
            <div className="text-left">
              <p className="font-semibold text-gray-800">Nomor Registrasi:</p>
              <p className="font-mono text-[#006d77]">{serialNo}</p>
              <p className="mt-1 text-[11px] text-gray-400">Tanggal: {dateFormatted}</p>
            </div>

            <div className="text-center sm:text-right">
              <div className="inline-block border-b border-gray-400 pb-1 px-6">
                <p className="font-bold text-gray-900">{tutor || 'Syaikh / Pengampu Dars'}</p>
              </div>
              <p className="mt-1 text-[11px] text-gray-500">Khadim Al-Ilm Markaz Al Madraj</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 print:hidden">
          <button
            onClick={printCert}
            className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#00565e] cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export const getGoogleDriveEmbedUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed.includes('drive.google.com')) return null;
  const fileMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }
  return null;
};

const WhiteboardLightboxModal = ({
  photos,
  initialIndex = 0,
  onClose,
}: {
  photos: string[];
  initialIndex?: number;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const prev = () => {
    setZoom(1);
    setIndex((curr) => (curr > 0 ? curr - 1 : photos.length - 1));
  };
  const next = () => {
    setZoom(1);
    setIndex((curr) => (curr < photos.length - 1 ? curr + 1 : 0));
  };
  const zoomIn = () => setZoom((z) => Math.min(3, z + 0.5));
  const zoomOut = () => setZoom((z) => Math.max(1, z - 0.5));

  const currentPhoto = photos[index];

  return (
    <div className="fixed inset-0 z-[95] flex flex-col items-center justify-between bg-black/90 p-4 backdrop-blur-md">
      <div className="flex w-full max-w-5xl items-center justify-between py-2 text-white">
        <div className="flex items-center gap-3">
          <Camera className="h-5 w-5 text-[#83c5be]" />
          <div>
            <h3 className="text-sm font-bold sm:text-base">Foto Papan Tulis (Saburah)</h3>
            <p className="text-xs text-gray-400">
              Foto {index + 1} dari {photos.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 1}
            title="Perkecil"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition cursor-pointer text-sm font-bold"
          >
            -
          </button>
          <span className="text-xs font-mono px-1">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 3}
            title="Perbesar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 transition cursor-pointer text-sm font-bold"
          >
            +
          </button>
          <a
            href={currentPhoto}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/20 transition ml-2"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Download</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer ml-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 w-full max-w-5xl items-center justify-center overflow-hidden my-2">
        {photos.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition cursor-pointer"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
        )}

        <div className="max-h-[75vh] max-w-full overflow-auto flex items-center justify-center p-2">
          <img
            src={currentPhoto}
            alt={`Foto Papan Tulis ${index + 1}`}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-h-[72vh] max-w-full rounded-lg object-contain transition-transform duration-200"
          />
        </div>

        {photos.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-xs transition cursor-pointer"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex max-w-xl gap-2 overflow-x-auto py-2">
          {photos.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setZoom(1);
                setIndex(i);
              }}
              className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${i === index ? 'border-[#83c5be] ring-2 ring-[#83c5be]/50' : 'border-transparent opacity-60 hover:opacity-100'}`}
            >
              <img src={p} alt={`Thumb ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const WhiteboardManagerModal = ({
  lesson,
  onSave,
  onClose,
}: {
  lesson: Lesson;
  onSave: (updatedPhotos: string[]) => Promise<void>;
  onClose: () => void;
}) => {
  const [photos, setPhotos] = useState<string[]>(lesson.board_photos || []);
  const [newUrl, setNewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const addUrl = () => {
    if (!newUrl.trim()) return;
    setPhotos([...photos, newUrl.trim()]);
    setNewUrl('');
  };

  const removePhoto = (idx: number) => {
    setPhotos(photos.filter((_, i) => i !== idx));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const sb = requireSupabase();
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `board-photos/${lesson.id}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const res = await sb.storage.from('lms-materials').upload(path, file, { upsert: true });
      if (res.error) throw new Error(res.error.message);
      const { data: pubData } = sb.storage.from('lms-materials').getPublicUrl(path);
      const uploadedUrl = pubData.publicUrl;
      setPhotos([...photos, uploadedUrl]);
    } catch (_uploadError: any) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setPhotos((cur) => [...cur, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setErr('');
    try {
      await onSave(photos);
      onClose();
    } catch (saveErr: any) {
      setErr(saveErr.message || 'Gagal menyimpan foto papan tulis.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-200 my-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#006d77]">
              <Camera className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Kelola Foto Papan Tulis (Saburah)</h3>
              <p className="text-xs text-gray-500">{lesson.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {err}
          </div>
        )}

        <div className="mt-4 max-h-[40vh] overflow-y-auto">
          {photos.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
              <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-xs font-semibold text-gray-600">Belum ada foto papan tulis</p>
              <p className="text-[11px] text-gray-400 mt-1">
                Upload foto catatan papan tulis dari pertemuan talaqqi ini agar mahasiswa bisa menyimak audio sambil melihat tulisan ustadz/syaikh.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((url, idx) => (
                <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                  <img src={url} alt={`Foto ${idx + 1}`} className="h-full w-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90 text-white opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition cursor-pointer hover:bg-red-700"
                    title="Hapus foto ini"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <label className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-[#006d77] bg-emerald-50/50 px-4 py-2.5 text-xs font-semibold text-[#006d77] hover:bg-emerald-50 cursor-pointer">
              <Camera className="h-4 w-4" />
              <span>{uploading ? 'Mengunggah foto...' : 'Upload Foto dari Perangkat'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="Atau tempel URL gambar / Google Drive direct link..."
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-[#006d77] focus:outline-none"
            />
            <button
              type="button"
              onClick={addUrl}
              className="rounded-xl bg-gray-800 px-4 py-2 text-xs font-semibold text-white hover:bg-black cursor-pointer"
            >
              Tambah
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={saveAll}
            disabled={saving || uploading}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-5 py-2 text-xs font-bold text-white hover:bg-[#00565e] disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Foto Papan Tulis'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const TeacherNotesEditorModal = ({
  lesson,
  onSave,
  onClose,
}: {
  lesson: Lesson;
  onSave: (notes: string) => Promise<void>;
  onClose: () => void;
}) => {
  const [notes, setNotes] = useState(lesson.teacher_notes || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      await onSave(notes);
      onClose();
    } catch (saveErr: any) {
      setErr(saveErr.message || 'Gagal menyimpan catatan guru.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[88] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-gray-200 my-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-[#006d77]">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Catatan Pengampu / Faedah Dars</h3>
              <p className="text-xs text-gray-500">{lesson.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">
            {err}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Tulis faedah, poin penting, rujukan kitab, atau ikhtisar dars:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={7}
            placeholder="Contoh: Pada pertemuan ini Syaikh menjelaskan perbedaan makna antara muthlaq dan muqayyad menurut madzhab Syafi'i..."
            className="w-full rounded-2xl border border-gray-200 p-3.5 text-xs sm:text-sm leading-relaxed focus:border-[#006d77] focus:outline-none"
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#006d77] px-5 py-2 text-xs font-bold text-white hover:bg-[#00565e] disabled:opacity-50 cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Catatan'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const YouTubeRestrictedPlayer = ({
  videoId,
  title,
  viewerLabel: _viewerLabel,
  startSeconds,
  onProgress,
  onComplete,
}: {
  videoId: string;
  title: string;
  viewerLabel?: string;
  startSeconds: number;
  onProgress: (watched: number, duration: number, force?: boolean) => void;
  onComplete: (watched: number, duration: number) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const progressHandler = useRef(onProgress);
  const completeHandler = useRef(onComplete);
  const hideControlsTimerRef = useRef<number | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(startSeconds);
  const [duration, setDuration] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  progressHandler.current = onProgress;
  completeHandler.current = onComplete;

  // Fullscreen toggle on container
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
        const el = containerRef.current as any;
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        } else if (el.webkitRequestFullscreen) {
          await el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          await el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          await el.msRequestFullscreen();
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(Boolean(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Auto-hide controls
  const triggerShowControls = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setShowControls(false);
      }, 3500);
    }
  };

  const handleMouseLeave = () => {
    if (isPlaying) {
      setShowControls(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        void toggleFullscreen();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        seek(Math.max(0, currentTime - 10));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        seek(Math.min(duration, currentTime + 10));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, isReady]);

  useEffect(() => {
    let disposed = false;
    let player: YouTubePlayerInstance | null = null;
    let uiTimer = 0;
    let progressTimer = 0;
    setIsReady(false);
    setIsPlaying(false);
    setPlayerError(false);
    setCurrentTime(startSeconds);
    setDuration(0);

    void loadYouTubePlayerApi().then(() => {
      if (disposed || !hostRef.current) return;
      const currentWindow = window as typeof window & {
        YT?: { Player: new (element: HTMLElement, options: Record<string, unknown>) => YouTubePlayerInstance };
      };
      if (!currentWindow.YT?.Player) return;

      player = new currentWindow.YT.Player(hostRef.current, {
        videoId,
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            if (startSeconds > 0) player?.seekTo(startSeconds, true);
            playerRef.current = player;
            setDuration(player?.getDuration() || 0);
            setIsMuted(Boolean(player?.isMuted()));
            setIsReady(true);
            uiTimer = window.setInterval(() => {
              if (!player) return;
              setCurrentTime(player.getCurrentTime());
              setDuration(player.getDuration());
            }, 500);
            progressTimer = window.setInterval(() => {
              if (player?.getPlayerState() === 1) {
                progressHandler.current(player.getCurrentTime(), player.getDuration());
              }
            }, 4000);
          },
          onStateChange: (event: { data: number }) => {
            if (!player) return;
            const playing = event.data === 1;
            setIsPlaying(playing);
            if (playing) {
              triggerShowControls();
            } else {
              setShowControls(true);
            }
            if (event.data === 0) {
              setCurrentTime(player.getDuration());
              completeHandler.current(player.getDuration(), player.getDuration());
            }
            if (event.data === 2) {
              progressHandler.current(player.getCurrentTime(), player.getDuration(), true);
            }
          },
          onError: () => setPlayerError(true),
        },
      });
    });

    return () => {
      disposed = true;
      window.clearInterval(uiTimer);
      window.clearInterval(progressTimer);
      if (hideControlsTimerRef.current) window.clearTimeout(hideControlsTimerRef.current);
      if (player) {
        progressHandler.current(player.getCurrentTime(), player.getDuration(), true);
        player.destroy();
      }
      playerRef.current = null;
    };
  }, [videoId]);

  const togglePlayback = () => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    if (player.getPlayerState() === 1) player.pauseVideo();
    else player.playVideo();
  };

  const toggleMute = () => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    if (player.isMuted()) player.unMute();
    else player.mute();
    setIsMuted(player.isMuted());
  };

  const seek = (seconds: number) => {
    const player = playerRef.current;
    if (!player || !isReady) return;
    player.seekTo(seconds, true);
    setCurrentTime(seconds);
    progressHandler.current(seconds, player.getDuration(), true);
    triggerShowControls();
  };

  const cyclePlaybackRate = () => {
    const player = playerRef.current;
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIdx];
    setPlaybackRate(nextRate);
    if (player?.setPlaybackRate) {
      player.setPlaybackRate(nextRate);
    }
    triggerShowControls();
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={triggerShowControls}
      onMouseEnter={triggerShowControls}
      onMouseLeave={handleMouseLeave}
      className={`group relative h-full w-full overflow-hidden bg-black text-white select-none ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen w-screen' : ''
      }`}
      data-restricted-youtube-player
    >
      {/* Underlying YouTube iframe */}
      <div className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        <div ref={hostRef} title={title} className="h-full w-full object-cover" />
      </div>

      {/* Click-to-play backdrop */}
      <div
        onClick={togglePlayback}
        className="absolute inset-0 cursor-pointer z-10"
        title={isPlaying ? 'Klik untuk jeda' : 'Klik untuk putar'}
      />

      {/* Top Header Bar: Clean & Minimal - NO AIGYPT WATERMARK */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent px-4 pb-12 pt-4 transition-opacity duration-300 sm:px-6 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="min-w-0 pr-4">
          <p className="line-clamp-1 text-xs font-semibold text-white/90 sm:text-sm drop-shadow-md">
            {title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-[#83c5be] backdrop-blur-md border border-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#83c5be] animate-pulse" />
            1080p HD
          </span>
        </div>
      </div>

      {/* Big Center Play Indicator */}
      {!isPlaying && !playerError && (
        <button
          type="button"
          onClick={togglePlayback}
          disabled={!isReady}
          aria-label={isReady ? 'Putar materi' : 'Menyiapkan video...'}
          className="absolute left-1/2 top-1/2 z-20 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white/40 bg-[#006d77]/90 text-white shadow-2xl backdrop-blur-sm transition hover:scale-110 hover:bg-[#006d77] active:scale-95 disabled:cursor-wait disabled:opacity-60 sm:h-20 sm:w-20 cursor-pointer"
        >
          <Play className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9 text-white" />
        </button>
      )}

      {/* Error state */}
      {playerError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/90 px-6 text-center">
          <CirclePlay className="h-12 w-12 text-[#83c5be]" />
          <p className="mt-3 text-base font-semibold text-white">Video tidak dapat diputar saat ini.</p>
          <p className="mt-1 text-xs text-white/70">Silakan muat ulang halaman atau pilih materi lainnya.</p>
        </div>
      )}

      {/* Bottom Control Bar */}
      {!playerError && (
        <div
          className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 sm:px-6 sm:pb-5 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Timeline Range Scrubber */}
          <div className="relative mb-2 flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(duration, 1)}
              step={1}
              value={Math.min(currentTime, Math.max(duration, 1))}
              onChange={(event) => seek(Number(event.target.value))}
              disabled={!isReady || !duration}
              aria-label="Posisi video"
              className="restricted-player-range block w-full cursor-pointer"
            />
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between gap-2">
            {/* Left controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Play/Pause */}
              <button
                type="button"
                onClick={togglePlayback}
                disabled={!isReady}
                aria-label={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
                title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              </button>

              {/* Rewind 10s */}
              <button
                type="button"
                onClick={() => seek(Math.max(0, currentTime - 10))}
                disabled={!isReady}
                aria-label="Mundur 10 detik (←)"
                title="Mundur 10 detik (←)"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="h-4 w-4" />
              </button>

              {/* Forward 10s */}
              <button
                type="button"
                onClick={() => seek(Math.min(duration, currentTime + 10))}
                disabled={!isReady}
                aria-label="Maju 10 detik (→)"
                title="Maju 10 detik (→)"
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RotateCw className="h-4 w-4" />
              </button>

              {/* Mute/Unmute */}
              <button
                type="button"
                onClick={toggleMute}
                disabled={!isReady}
                aria-label={isMuted ? 'Nyalakan suara (M)' : 'Matikan suara (M)'}
                title={isMuted ? 'Nyalakan suara (M)' : 'Matikan suara (M)'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {isMuted ? <VolumeX className="h-4 w-4 text-red-400" /> : <Volume2 className="h-4 w-4" />}
              </button>

              {/* Time display */}
              <span className="ml-1 text-xs font-semibold tabular-nums text-white/90">
                {formatPlaybackTime(currentTime)} <span className="text-white/40">/</span> {formatPlaybackTime(duration)}
              </span>
            </div>

            {/* Right controls: Speed & Fullscreen - NO OVERLAPPING TEXT */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Playback rate */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                disabled={!isReady}
                title="Kecepatan pemutaran"
                className="flex h-8 items-center justify-center rounded-lg px-2 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {playbackRate}x
              </button>

              {/* Fullscreen button */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? 'Keluar layar penuh (F)' : 'Layar penuh (F)'}
                title={isFullscreen ? 'Keluar layar penuh (F)' : 'Layar penuh (F)'}
                className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/20 active:scale-95 cursor-pointer"
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TrackedContentModal = ({ lesson, metadata, progress, viewerLabel, onProgress, onComplete, onClose }: { lesson: Lesson; metadata?: YouTubeMetadata; progress?: LessonProgress; viewerLabel: string; onProgress: (watchedSeconds: number, durationSeconds: number, force?: boolean) => void; onComplete: (watchedSeconds: number, durationSeconds: number) => void; onClose: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const restored = useRef(false);
  const percent = progressPercent(progress, lesson);
  const [contentSource, setContentSource] = useState('');

  useEffect(() => { restored.current = false; }, [lesson.id]);
  useEffect(() => {
    let mounted = true;
    const resolveSource = async () => {
      if (!lesson.content_url) { setContentSource(''); return; }
      if (/^https?:\/\//i.test(lesson.content_url)) { setContentSource(lesson.content_url); return; }
      const result = await requireSupabase().storage.from('lms-materials').createSignedUrl(lesson.content_url, 3600);
      if (mounted) setContentSource(result.data?.signedUrl || '');
    };
    void resolveSource();
    return () => { mounted = false; };
  }, [lesson.content_url]);
  const restorePosition = () => {
    const video = videoRef.current;
    if (!video || restored.current || !progress?.watched_seconds) return;
    const safePosition = Math.min(progress.watched_seconds, Math.max(0, video.duration - 0.5));
    if (safePosition > 0) video.currentTime = safePosition;
    restored.current = true;
  };
  const snapshot = (force = false) => {
    const video = videoRef.current;
    if (video) onProgress(video.currentTime, video.duration, force);
  };

  const youtubeId = lesson.content_type === 'video' ? youtubeVideoId(contentSource) : '';
  const displayTitle = metadata?.title || lesson.title;

  return <div className="fixed inset-0 z-[80] grid place-items-center bg-[#102c22]/45 px-4 py-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby="tracked-content-modal-title" className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-[18px] border border-[#d4e1d8] bg-white p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006d77]">{lesson.content_type} · {lesson.duration}</p><h2 id="tracked-content-modal-title" className="mt-2 text-2xl font-semibold">{displayTitle}</h2>{metadata && <p className="mt-2 text-sm text-[#607568]">Video oleh <span className="font-semibold text-[#315747]">{metadata.authorName}</span></p>}</div><button onClick={onClose} aria-label="Tutup materi" title="Tutup" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#cfe0d5] text-[#607568]"><X className="h-4 w-4" /></button></div>
      {lesson.content_type === 'video' ? <div className="mt-5 overflow-hidden rounded-2xl bg-[#102c22] p-3 text-white"><div className="aspect-video overflow-hidden rounded-xl bg-[#0d2f2b]">{youtubeId ? <YouTubeRestrictedPlayer videoId={youtubeId} title={displayTitle} viewerLabel={viewerLabel} startSeconds={progress?.watched_seconds || 0} onProgress={onProgress} onComplete={onComplete} /> : contentSource ? <video ref={videoRef} className="h-full w-full" controls preload="metadata" src={contentSource} onLoadedMetadata={restorePosition} onTimeUpdate={() => snapshot()} onPause={() => snapshot(true)} onEnded={() => { const video = videoRef.current; if (video) onComplete(video.duration, video.duration); }} /> : <div className="flex h-full flex-col items-center justify-center px-6 text-center"><CirclePlay className="h-12 w-12 text-[#83c5be]" /><p className="mt-4 text-sm font-semibold">Video belum tersedia</p><p className="mt-2 max-w-md text-xs leading-5 text-[#b7d0c3]">Isi URL video atau upload file pada materi di panel admin agar pemutaran dan tracker aktif.</p></div>}</div><div className="mt-4 flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">{progress?.completed_at ? 'Selesai ditonton' : percent ? 'Sedang dipelajari' : 'Belum mulai'}</p><p className="mt-1 text-xs text-[#b7d0c3]">{percent}% tersimpan pada akunmu</p></div><div className="h-1.5 w-32 rounded-full bg-white/15"><div className="h-1.5 rounded-full bg-[#83c5be] transition-all" style={{ width: percent + '%' }} /></div></div></div> : <div className="mt-5 rounded-2xl bg-[#f4faf6] p-8 text-center text-[#006d77]"><FileText className="mx-auto h-12 w-12" /><p className="mt-4 text-sm font-semibold">Materi {lesson.content_type.toUpperCase()} siap dibuka</p>{contentSource ? <a href={contentSource} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-bold text-[#006d77] underline">Buka materi</a> : <p className="mt-2 text-xs text-[#607568]">Materi belum memiliki URL atau file.</p>}</div>}
      <button onClick={onClose} className="mt-5 flex min-h-10 w-full items-center justify-center rounded-full bg-[#006d77] text-sm font-bold text-white">Tutup materi</button>
    </section>
  </div>;
};
