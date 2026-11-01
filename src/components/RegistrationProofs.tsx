import React, { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, ImagePlus, Loader2 } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';

export const INSTAGRAM_HANDLE = '@almadraj.academia';
export const INSTAGRAM_URL = 'https://instagram.com/almadraj.academia';
const BUCKET = 'registration-proofs';
const MAX_BYTES = 5 * 1024 * 1024;

type ProofKind = 'share_story' | 'follow_ig';
export type RegistrationProof = { user_id: string; share_story_path: string; follow_ig_path: string };

const KINDS: { kind: ProofKind; column: 'share_story_path' | 'follow_ig_path'; title: string; hint: string }[] = [
  {
    kind: 'share_story',
    column: 'share_story_path',
    title: `Bukti share pamflet pendaftaran ${INSTAGRAM_HANDLE}`,
    hint: 'Screenshot story Instagram / WhatsApp Anda yang membagikan pamflet pendaftaran.',
  },
  {
    kind: 'follow_ig',
    column: 'follow_ig_path',
    title: `Bukti follow Instagram ${INSTAGRAM_HANDLE}`,
    hint: 'Screenshot profil Instagram yang menampilkan tombol "Following".',
  },
];

export const proofsComplete = (proof?: Pick<RegistrationProof, 'share_story_path' | 'follow_ig_path'> | null) =>
  Boolean(proof?.share_story_path && proof?.follow_ig_path);

/** Upload dua bukti syarat pendaftaran milik peserta. `onCompleteChange` memberi tahu halaman checkout. */
export const RegistrationRequirements = ({ userId, onCompleteChange }: { userId: string; onCompleteChange: (complete: boolean) => void }) => {
  const [proof, setProof] = useState<RegistrationProof | null>(null);
  const [busy, setBusy] = useState<ProofKind | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    requireSupabase().from('registration_proofs').select('user_id,share_story_path,follow_ig_path').eq('user_id', userId).maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setProof((data as RegistrationProof | null) || null);
        onCompleteChange(proofsComplete(data as RegistrationProof | null));
      });
    return () => { active = false; };
  }, [userId]);

  const upload = async (item: typeof KINDS[number], file: File | undefined) => {
    if (!file) return;
    setError('');
    if (!file.type.startsWith('image/')) { setError('File harus berupa gambar (screenshot).'); return; }
    if (file.size > MAX_BYTES) { setError('Ukuran gambar maksimal 5 MB.'); return; }
    setBusy(item.kind);
    try {
      const sb = requireSupabase();
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${userId}/${item.kind}-${Date.now()}.${ext}`;
      const up = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true });
      if (up.error) throw new Error(up.error.message);
      const next = { user_id: userId, share_story_path: proof?.share_story_path || '', follow_ig_path: proof?.follow_ig_path || '', [item.column]: path };
      const saved = await sb.from('registration_proofs').upsert({ ...next, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (saved.error) throw new Error(saved.error.message);
      setProof(next);
      onCompleteChange(proofsComplete(next));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah bukti.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-xl border border-[#83c5be]/30 bg-white/5 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#83c5be]">Syarat Pendaftaran</p>
      <p className="mt-1.5 text-xs leading-relaxed text-[#c5d9cf]">
        Unggah kedua bukti berikut sebelum melanjutkan pendaftaran.{' '}
        <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-white underline">
          {INSTAGRAM_HANDLE} <ExternalLink className="h-3 w-3" />
        </a>
      </p>
      <div className="mt-3 space-y-3">
        {KINDS.map((item) => {
          const done = Boolean(proof?.[item.column]);
          return (
            <label key={item.kind} className="block cursor-pointer rounded-lg bg-black/20 p-3 hover:bg-black/30">
              <span className="flex items-start gap-2 text-xs font-semibold text-white">
                {done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-[#83c5be]" />}
                <span>{item.title}</span>
              </span>
              <span className="mt-1 block pl-6 text-[11px] text-[#a0baae]">{item.hint}</span>
              <span className="mt-2 flex items-center gap-2 pl-6 text-[11px] text-[#83c5be]">
                {busy === item.kind ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Mengunggah...</> : done ? 'Terunggah — ketuk untuk mengganti' : 'Ketuk untuk memilih gambar'}
              </span>
              <input type="file" accept="image/*" className="sr-only" disabled={busy !== null} onChange={(event) => { void upload(item, event.target.files?.[0]); event.target.value = ''; }} />
            </label>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-amber-300">{error}</p>}
    </div>
  );
};

/** Tautan bukti (signed URL) untuk admin. */
export const ProofLinks = ({ proof }: { proof?: RegistrationProof | null }) => {
  const [urls, setUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const paths = [proof?.share_story_path, proof?.follow_ig_path].filter(Boolean) as string[];
    if (!paths.length) { setUrls({}); return; }
    requireSupabase().storage.from(BUCKET).createSignedUrls(paths, 3600).then(({ data }) => {
      if (!active) return;
      const next: Record<string, string> = {};
      (data || []).forEach((row) => { if (row.path && row.signedUrl) next[row.path] = row.signedUrl; });
      setUrls(next);
    });
    return () => { active = false; };
  }, [proof?.share_story_path, proof?.follow_ig_path]);

  const link = (label: string, path?: string) => {
    if (!path) return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">{label}: belum</span>;
    return urls[path]
      ? <a href={urls[path]} target="_blank" rel="noopener noreferrer" className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 hover:underline">{label}: lihat</a>
      : <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{label}: ada</span>;
  };

  return <span className="flex flex-wrap gap-1.5">{link('Share story', proof?.share_story_path)}{link('Follow IG', proof?.follow_ig_path)}</span>;
};
