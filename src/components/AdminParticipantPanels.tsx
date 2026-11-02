import React, { useEffect, useMemo, useState } from 'react';
import { Copy, MessageCircle, Search, UserPlus } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';
import { ProofLinks, RegistrationProof } from './RegistrationProofs';

type PanelProfile = { id: string; full_name: string; whatsapp: string; email?: string };
type PanelCourse = { id: string; title: string; faculty: string; is_published: boolean; is_bundle?: boolean };
type PanelStatus = 'pending' | 'active' | 'cancelled';
type PanelEnrollment = { id: string; user_id: string; course_id: string; status: PanelStatus; source?: string; payment_note?: string; activated_at?: string | null; created_at?: string; profiles?: { full_name?: string; whatsapp?: string } | null; courses?: { title?: string } | null };

type Common = {
  profiles: PanelProfile[];
  courses: PanelCourse[];
  enrollments: PanelEnrollment[];
  onChanged: () => Promise<void> | void;
  onError: (message: string) => void;
  recordAudit: (action: string, entityType: string, entityId?: string, metadata?: Record<string, unknown>) => Promise<void>;
};

const inputClass = 'min-h-10 w-full rounded-xl border border-[#cbded0] bg-white px-3 py-2 text-sm text-[#163528] outline-none focus:border-[#006d77]';

const waLink = (raw: string) => {
  let phone = (raw || '').replace(/\D/g, '');
  if (!phone) return '';
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  return 'https://wa.me/' + phone;
};

const STATUS_META: Record<PanelStatus, { label: string; badge: string }> = {
  active: { label: 'Aktif', badge: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Menunggu', badge: 'bg-amber-50 text-amber-700' },
  cancelled: { label: 'Dicabut', badge: 'bg-gray-100 text-gray-600' },
};
const ENROLLMENT_PAGE_SIZE = 50;

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

/** Daftar enrollment yang terbaca: nama peserta + judul kelas, dengan pencarian dan filter. */
export const EnrollmentListPanel = ({ profiles, courses, enrollments, onUpdateAccess }: Pick<Common, 'profiles' | 'courses' | 'enrollments'> & { onUpdateAccess: (id: string, status: PanelStatus) => void }) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PanelStatus>('all');
  const [courseId, setCourseId] = useState('');
  const [visible, setVisible] = useState(ENROLLMENT_PAGE_SIZE);

  const rows = useMemo(() => {
    const profileById = new Map(profiles.map((p) => [p.id, p]));
    const courseById = new Map(courses.map((c) => [c.id, c]));
    return enrollments.map((e) => {
      const p = profileById.get(e.user_id);
      return {
        e,
        name: p?.full_name || e.profiles?.full_name || '',
        email: p?.email || '',
        whatsapp: p?.whatsapp || e.profiles?.whatsapp || '',
        title: e.courses?.title || courseById.get(e.course_id)?.title || '',
      };
    });
  }, [enrollments, profiles, courses]);

  const scoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ e, name, email, whatsapp, title }) =>
      (!courseId || e.course_id === courseId) &&
      (!q || `${name} ${email} ${whatsapp} ${title}`.toLowerCase().includes(q)));
  }, [rows, search, courseId]);

  const filtered = statusFilter === 'all' ? scoped : scoped.filter(({ e }) => e.status === statusFilter);
  const countOf = (status: PanelStatus) => scoped.filter(({ e }) => e.status === status).length;

  useEffect(() => { setVisible(ENROLLMENT_PAGE_SIZE); }, [search, statusFilter, courseId]);

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-[#dce9df] bg-white p-4 shadow-xs sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa192]" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, WhatsApp, atau kelas..." className={inputClass + ' pl-8'} />
          </div>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} aria-label="Filter kelas" className={inputClass}>
            <option value="">Semua maddah / kelas</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            { id: 'all' as const, label: `Semua (${scoped.length})` },
            { id: 'active' as const, label: `Aktif (${countOf('active')})` },
            { id: 'pending' as const, label: `Menunggu (${countOf('pending')})` },
            { id: 'cancelled' as const, label: `Dicabut (${countOf('cancelled')})` },
          ].map((item) => (
            <button key={item.id} type="button" onClick={() => setStatusFilter(item.id)} className={'rounded-full px-3 py-1 font-semibold transition cursor-pointer ' + (statusFilter === item.id ? 'bg-[#006d77] text-white' : 'bg-[#f1f6f3] text-[#556e61] hover:bg-[#e4eee8]')}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dce9df] bg-white shadow-xs">
        <div className="divide-y divide-[#edf4ef]">
          {filtered.slice(0, visible).map(({ e, name, email, whatsapp, title }) => {
            const date = formatDate(e.status === 'active' ? e.activated_at || e.created_at : e.created_at);
            return (
              <div key={e.id} className="flex flex-col gap-3 p-4 transition hover:bg-[#f9fbfa] sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e5f4f2] text-sm font-bold text-[#006d77]">
                    {(name || email || '?').slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="truncate text-sm font-bold text-[#112d22]">{name || email || 'Akun tanpa nama'}</p>
                      <span className={'rounded-full px-2 py-0.5 text-[10px] font-bold ' + STATUS_META[e.status].badge}>{STATUS_META[e.status].label}</span>
                      {e.source === 'manual' && <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">Manual</span>}
                    </div>
                    <p className="mt-0.5 text-xs font-semibold text-[#2f5243]">{title || 'Kelas tidak ditemukan'}</p>
                    <p className="mt-0.5 text-[11px] text-[#71877b]">
                      {[email, whatsapp ? `WA ${whatsapp}` : '', date].filter(Boolean).join(' · ')}
                    </p>
                    {e.payment_note && <p className="mt-0.5 text-[11px] italic text-[#71877b]">Catatan: {e.payment_note}</p>}
                  </div>
                </div>
                <div className="shrink-0 self-end sm:self-auto">
                  {e.status === 'pending' && (
                    <button type="button" onClick={() => onUpdateAccess(e.id, 'active')} className="rounded-full bg-[#006d77] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#00545c] cursor-pointer">Aktifkan</button>
                  )}
                  {e.status === 'active' && (
                    <button type="button" onClick={() => onUpdateAccess(e.id, 'cancelled')} className="rounded-full border border-[#efd2c8] px-3 py-1.5 text-xs font-semibold text-[#b36d4c] hover:bg-red-50 cursor-pointer">Cabut Akses</button>
                  )}
                  {e.status === 'cancelled' && (
                    <button type="button" onClick={() => onUpdateAccess(e.id, 'active')} className="rounded-full border border-[#cfe0d5] px-3 py-1.5 text-xs font-semibold text-[#006d77] hover:bg-emerald-50 cursor-pointer">Pulihkan</button>
                  )}
                </div>
              </div>
            );
          })}
          {!filtered.length && (
            <p className="p-8 text-center text-xs text-[#71877b]">{enrollments.length ? 'Tidak ada enrollment yang sesuai dengan filter.' : 'Belum ada enrollment peserta.'}</p>
          )}
        </div>
        {filtered.length > visible && (
          <button type="button" onClick={() => setVisible((v) => v + ENROLLMENT_PAGE_SIZE)} className="w-full border-t border-[#edf4ef] py-3 text-xs font-bold text-[#006d77] hover:bg-[#f4f9f6] cursor-pointer">
            Tampilkan lebih banyak ({filtered.length - visible} lagi)
          </button>
        )}
      </div>
    </div>
  );
};

/** Fitur 1: tambah peserta yang membayar di luar web/Mayar (mis. dari Malaysia). */
export const ManualEnrollPanel = ({ profiles, courses, enrollments, onChanged, onError, recordAudit }: Common) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState('');

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles.slice(0, 8);
    return profiles.filter((p) => ((p.full_name || '') + ' ' + (p.email || '') + ' ' + (p.whatsapp || '')).toLowerCase().includes(q)).slice(0, 8);
  }, [profiles, search]);

  const selectedUser = profiles.find((p) => p.id === userId);
  const existing = enrollments.find((e) => e.user_id === userId && e.course_id === courseId);

  const submit = async () => {
    if (!userId || !courseId) { onError('Pilih akun peserta dan maddah/kelas terlebih dahulu.'); return; }
    const course = courses.find((c) => c.id === courseId);
    if (!window.confirm(`Aktifkan "${course?.title}" untuk ${selectedUser?.full_name || selectedUser?.email} tanpa pembayaran via web?`)) return;
    setSaving(true);
    setDone('');
    try {
      const sb = requireSupabase();
      const base = { user_id: userId, course_id: courseId, status: 'active', activated_at: new Date().toISOString() };
      let result = await sb.from('enrollments').upsert({ ...base, source: 'manual', payment_note: note.trim() }, { onConflict: 'user_id,course_id' });
      if (result.error && /source|payment_note/i.test(result.error.message)) {
        // Migrasi 20261101000100 belum dijalankan: tetap aktifkan akses tanpa catatan.
        result = await sb.from('enrollments').upsert(base, { onConflict: 'user_id,course_id' });
      }
      if (result.error) throw new Error(result.error.message);
      await recordAudit('enrollment.manual_added', 'enrollment', `${userId}:${courseId}`, { user_id: userId, course_id: courseId, note: note.trim() });
      setDone(`Berhasil: ${selectedUser?.full_name || selectedUser?.email} kini aktif di "${course?.title}".`);
      setNote('');
      setUserId('');
      setSearch('');
      await onChanged();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Gagal menambahkan peserta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#dce9df] bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#112d22]">Tambah Peserta Manual (di luar web/Mayar)</h3>
          <p className="text-xs text-[#6c8577]">Untuk peserta yang membayar langsung, mis. dari Malaysia. Peserta harus sudah pernah login Google di web ini.</p>
        </div>
        <button type="button" onClick={() => setOpen((v) => !v)} className="inline-flex items-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white hover:bg-[#00545c] cursor-pointer">
          <UserPlus className="h-3.5 w-3.5" /> {open ? 'Tutup' : 'Tambah Peserta'}
        </button>
      </div>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-[#edf4ef] pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-[#112d22]">1. Pilih akun peserta</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa192]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama, email, atau WhatsApp..." className={inputClass + ' pl-8'} />
            </div>
            <div className="max-h-48 divide-y divide-[#edf4ef] overflow-y-auto rounded-xl border border-[#dce9df]">
              {matches.map((p) => (
                <button key={p.id} type="button" onClick={() => setUserId(p.id)} className={'block w-full px-3 py-2 text-left text-xs cursor-pointer ' + (userId === p.id ? 'bg-[#e5f4f2]' : 'hover:bg-[#f4f9f6]')}>
                  <span className="font-bold text-[#112d22]">{p.full_name || 'Tanpa Nama'}</span>
                  <span className="block text-[11px] text-[#71877b]">{p.email || '-'} · {p.whatsapp || 'WA belum diisi'}</span>
                </button>
              ))}
              {!matches.length && <p className="p-3 text-center text-xs text-[#71877b]">Akun tidak ditemukan. Minta peserta login dengan Google dulu.</p>}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#112d22]">2. Pilih maddah / kelas</span>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                <option value="">— Pilih —</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.title}{c.is_bundle ? ' (paket)' : ''}{c.is_published ? '' : ' [draft]'}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-[#112d22]">3. Catatan pembayaran (opsional)</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="mis. Transfer Maybank 1 Nov, MYR 50" className={inputClass} />
            </label>
            {selectedUser && <p className="text-xs text-[#4b6356]">Peserta: <strong>{selectedUser.full_name || selectedUser.email}</strong></p>}
            {existing && <p className="text-xs font-semibold text-amber-700">Sudah ada enrollment ({existing.status}); akan diaktifkan/diperbarui.</p>}
            <button type="button" disabled={saving || !userId || !courseId} onClick={() => void submit()} className="min-h-10 w-full rounded-full bg-[#006d77] px-4 text-sm font-bold text-white hover:bg-[#00545c] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
              {saving ? 'Menyimpan...' : 'Aktifkan Akses Peserta'}
            </button>
            {done && <p className="text-xs font-semibold text-emerald-700">{done}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

/** Fitur 2 (+3): daftar peserta terdaftar per maddah, lengkap dengan bukti syarat pendaftaran. */
export const MaddahParticipantsPanel = ({ profiles, courses, enrollments }: Pick<Common, 'profiles' | 'courses' | 'enrollments'>) => {
  const [courseId, setCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState<'active' | 'all'>('active');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [proofs, setProofs] = useState<Record<string, RegistrationProof>>({});

  useEffect(() => {
    requireSupabase().from('registration_proofs').select('user_id,share_story_path,follow_ig_path').then(({ data, error }) => {
      if (error || !data) return;
      setProofs(Object.fromEntries((data as RegistrationProof[]).map((row) => [row.user_id, row])));
    });
  }, []);

  const countFor = (id: string) => enrollments.filter((e) => e.course_id === id && e.status === 'active').length;
  const selected = courses.find((c) => c.id === courseId);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrollments
      .filter((e) => e.course_id === courseId && (statusFilter === 'all' || e.status === 'active'))
      .map((e) => ({ e, p: profiles.find((x) => x.id === e.user_id) }))
      .filter(({ p }) => !q || ((p?.full_name || '') + ' ' + (p?.email || '') + ' ' + (p?.whatsapp || '')).toLowerCase().includes(q))
      .sort((a, b) => (a.p?.full_name || '').localeCompare(b.p?.full_name || ''));
  }, [enrollments, profiles, courseId, statusFilter, search]);

  const copyList = async () => {
    const text = `Peserta ${selected?.title} (${rows.length})\n` + rows.map(({ p }, i) => `${i + 1}. ${p?.full_name || '-'} | ${p?.email || '-'} | ${p?.whatsapp || '-'}`).join('\n');
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#dce9df] bg-white p-4 shadow-xs sm:p-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#112d22]">Pilih maddah / kelas</span>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
            <option value="">— Pilih maddah —</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({countFor(c.id)} peserta aktif)</option>)}
          </select>
        </label>
        {selected && (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8aa192]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari peserta..." className={inputClass + ' pl-8'} />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              {(['active', 'all'] as const).map((s) => (
                <button key={s} type="button" onClick={() => setStatusFilter(s)} className={'rounded-full px-3 py-1 font-semibold cursor-pointer ' + (statusFilter === s ? 'bg-[#006d77] text-white' : 'bg-[#f1f6f3] text-[#556e61]')}>
                  {s === 'active' ? 'Aktif saja' : 'Semua status'}
                </button>
              ))}
              <button type="button" onClick={() => void copyList()} disabled={!rows.length} className="inline-flex items-center gap-1 rounded-full border border-[#cfe0d5] px-3 py-1 font-semibold text-[#006d77] disabled:opacity-40 cursor-pointer">
                <Copy className="h-3 w-3" /> {copied ? 'Tersalin' : 'Salin daftar'}
              </button>
            </div>
          </div>
        )}
      </div>

      {selected ? (
        <div className="overflow-hidden rounded-2xl border border-[#dce9df] bg-white shadow-xs">
          <p className="border-b border-[#edf4ef] px-4 py-3 text-xs font-bold text-[#112d22]">{selected.title} — {rows.length} peserta</p>
          <div className="divide-y divide-[#edf4ef]">
            {rows.map(({ e, p }, i) => (
              <div key={e.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#112d22]">{i + 1}. {p?.full_name || e.user_id}</p>
                  <p className="text-[11px] text-[#71877b]">
                    {p?.email || '-'} · {p?.whatsapp || 'WA belum diisi'}
                    {e.source === 'manual' && <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700">Manual{e.payment_note ? `: ${e.payment_note}` : ''}</span>}
                    {e.status !== 'active' && <span className="ml-2 font-bold uppercase text-amber-700">{e.status}</span>}
                  </p>
                  <div className="mt-1.5"><ProofLinks proof={proofs[e.user_id]} /></div>
                </div>
                {p?.whatsapp && waLink(p.whatsapp) && (
                  <a href={waLink(p.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-[#cfe0d5] px-3 py-1.5 text-xs font-semibold text-[#128c4a] hover:bg-emerald-50 sm:self-auto">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
              </div>
            ))}
            {!rows.length && <p className="p-8 text-center text-xs text-[#71877b]">Belum ada peserta terdaftar di maddah ini.</p>}
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-[#cfe0d5] p-8 text-center text-xs text-[#71877b]">Pilih maddah untuk melihat peserta yang terdaftar.</p>
      )}
    </div>
  );
};
