import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, MessageCircle } from 'lucide-react';
import { requireSupabase } from '../lib/supabase';

type GroupLink = { courseId: string; label: string; url: string };

const JOINED_KEY = (courseId: string) => 'almadraj-wa-joined:' + courseId;

export const hasOpenedWhatsAppGroup = (courseId: string) => {
  try { return window.localStorage.getItem(JOINED_KEY(courseId)) === '1'; } catch { return false; }
};

export const markWhatsAppGroupOpened = (courseId: string) => {
  try { window.localStorage.setItem(JOINED_KEY(courseId), '1'); } catch {}
};

// "Nahwu Sharaf · Syari'ah Tingkat 1" -> "Nahwu Sharaf"
const shortTitle = (title: string) => String(title || '').split(' · ')[0];

/**
 * Tombol "Gabung grup WhatsApp" untuk kelas yang baru dibeli. Satu grup per maddah: pembeli
 * Paket Lengkap mendapat satu tombol untuk tiap maddah di fakultas + tingkat yang sama.
 * Link hanya terbaca setelah akses aktif (RLS course_access_links), jadi dicoba ulang sebentar
 * kalau webhook pembayaran baru saja masuk.
 */
export const WhatsAppGroupLinks = ({ courseSlug, className = '' }: { courseSlug: string; className?: string }) => {
  const [links, setLinks] = useState<GroupLink[] | null>(null);
  const [opened, setOpened] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;
    const load = async () => {
      const sb = requireSupabase();
      const { data: course } = await sb.from('courses').select('id,title,is_bundle,faculty,tingkat,program_type').eq('slug', courseSlug).maybeSingle();
      if (!course) return [];
      let targets: Array<{ id: string; title: string }> = [course];
      if (course.is_bundle) {
        const { data: members } = await sb
          .from('courses')
          .select('id,title')
          .eq('program_type', 'Bimbel')
          .eq('is_bundle', false)
          .eq('faculty', course.faculty)
          .eq('tingkat', course.tingkat)
          .eq('is_published', true)
          .order('title');
        targets = [course, ...(members || [])];
      }
      const { data: rows } = await sb
        .from('course_access_links')
        .select('course_id,whatsapp_group_url')
        .in('course_id', targets.map((t) => t.id));
      const byId = new Map((rows || []).map((row: { course_id: string; whatsapp_group_url: string }) => [row.course_id, row.whatsapp_group_url]));
      return targets
        .map((t) => ({ courseId: t.id, label: shortTitle(t.title), url: String(byId.get(t.id) || '').trim() }))
        .filter((t) => t.url);
    };
    const run = async () => {
      try {
        const result = await load();
        if (cancelled) return;
        if (!result.length && attempt < 3) { attempt += 1; window.setTimeout(run, 2500); return; }
        setLinks(result);
        setOpened(Object.fromEntries(result.map((l) => [l.courseId, hasOpenedWhatsAppGroup(l.courseId)])));
      } catch {
        if (!cancelled) setLinks([]);
      }
    };
    void run();
    return () => { cancelled = true; };
  }, [courseSlug]);

  if (!links?.length) return null;

  return (
    <div className={'w-full text-left ' + className}>
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1f7a46]">Langkah selanjutnya</p>
      <p className="mt-1 text-sm leading-6 text-[#4f6d5e]">
        Gabung grup WhatsApp {links.length > 1 ? 'tiap maddah' : 'maddah ini'}. Info pertemuan dan rekaman juga dibagikan di sana.
      </p>
      <div className="mt-3 grid gap-2">
        {links.map((link) => (
          <a
            key={link.courseId}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { markWhatsAppGroupOpened(link.courseId); setOpened((o) => ({ ...o, [link.courseId]: true })); }}
            className={'flex min-h-12 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition active:scale-[0.99] ' + (opened[link.courseId]
              ? 'border border-[#cfe6d8] bg-[#f3faf6] text-[#1f7a46]'
              : 'bg-[#1f9d55] text-white shadow-[0_8px_18px_rgba(31,157,85,0.25)] hover:bg-[#17803f]')}
          >
            {opened[link.courseId] ? <Check className="h-4 w-4 shrink-0" /> : <MessageCircle className="h-4 w-4 shrink-0" />}
            <span className="min-w-0 flex-1 truncate">{links.length > 1 ? 'Grup ' + link.label : 'Gabung grup WhatsApp'}</span>
            <ArrowUpRight className="h-4 w-4 shrink-0 opacity-80" />
          </a>
        ))}
      </div>
    </div>
  );
};
