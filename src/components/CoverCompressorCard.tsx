import React, { useState } from 'react';
import { ImageDown, Loader2 } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';
import { COVER_CACHE_CONTROL, compressCoverImage } from '../lib/coverImage';

type CoverCourse = { id: string; slug: string; title: string; thumbnail_url?: string | null };

// Cover yang sudah kecil tidak perlu diproses ulang.
const SMALL_ENOUGH_BYTES = 160 * 1024;
const BUCKET = 'course-covers';

/**
 * Mengecilkan ulang semua cover kelas yang tersimpan di Supabase Storage (sekali klik oleh admin).
 * File lama dibiarkan di storage sebagai cadangan; yang diganti hanya courses.thumbnail_url.
 */
export const CoverCompressorCard = ({ courses, onDone }: { courses: CoverCourse[]; onDone: () => void }) => {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState('');

  const targets = courses.filter((c) => (c.thumbnail_url || '').includes('/' + BUCKET + '/'));

  const run = async () => {
    if (!targets.length) return;
    if (!window.confirm(`Kecilkan ulang ${targets.length} cover kelas? Tampilan cover tetap sama, hanya ukurannya yang dikecilkan.`)) return;
    setRunning(true);
    setLog([]);
    setSummary('');
    const sb = requireSupabase();
    let before = 0;
    let after = 0;
    let changed = 0;
    let failed = 0;
    for (const course of targets) {
      const label = course.title.split(' · ')[0];
      try {
        const response = await fetch(course.thumbnail_url as string, { cache: 'no-store' });
        if (!response.ok) throw new Error('unduh gagal (' + response.status + ')');
        const original = await response.blob();
        if (original.size <= SMALL_ENOUGH_BYTES) {
          setLog((l) => [...l, `${label}: sudah kecil (${Math.round(original.size / 1024)} KB), dilewati`]);
          continue;
        }
        const cover = await compressCoverImage(original);
        if (cover.blob.size >= original.size) {
          setLog((l) => [...l, `${label}: tidak bisa lebih kecil, dilewati`]);
          continue;
        }
        const path = `${course.id}/${crypto.randomUUID()}.${cover.extension}`;
        const upload = await sb.storage.from(BUCKET).upload(path, cover.blob, { contentType: cover.contentType, upsert: false, cacheControl: COVER_CACHE_CONTROL });
        if (upload.error) throw new Error(upload.error.message);
        const publicUrl = sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
        const saved = await sb.from('courses').update({ thumbnail_url: publicUrl }).eq('id', course.id);
        if (saved.error) throw new Error(saved.error.message);
        before += original.size;
        after += cover.blob.size;
        changed += 1;
        setLog((l) => [...l, `${label}: ${Math.round(original.size / 1024)} KB → ${Math.round(cover.blob.size / 1024)} KB`]);
      } catch (error) {
        failed += 1;
        setLog((l) => [...l, `${label}: GAGAL — ${error instanceof Error ? error.message : 'error'}`]);
      }
    }
    setSummary(changed
      ? `${changed} cover dikecilkan: ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB${failed ? `, ${failed} gagal` : ''}.`
      : failed ? `${failed} cover gagal diproses.` : 'Semua cover sudah kecil, tidak ada yang perlu diubah.');
    setRunning(false);
    if (changed) onDone();
  };

  return (
    <section className="rounded-2xl border border-[#dce9df] bg-white p-5 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#112d22]">Hemat Kuota Gambar Cover</h2>
          <p className="text-xs text-[#6c8577]">
            Kecilkan ulang cover kelas yang besar supaya katalog tidak menghabiskan kuota Supabase. Cover baru otomatis dikecilkan saat diunggah.
          </p>
        </div>
        <button type="button" onClick={() => void run()} disabled={running || !targets.length} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
          {running ? 'Memproses...' : `Kompres ulang ${targets.length} cover`}
        </button>
      </div>
      {summary && <p className="mt-3 text-xs font-bold text-[#0f6b45]">{summary}</p>}
      {log.length > 0 && (
        <ul className="mt-2 max-h-48 space-y-0.5 overflow-y-auto rounded-lg bg-[#f6faf7] p-3 text-[11px] text-[#46604f]">
          {log.map((line, i) => <li key={i}>{line}</li>)}
        </ul>
      )}
    </section>
  );
};
