import { useEffect, useId, useState } from 'react';

export function CourseCoverField({ src, file, disabled, onChange, onReset }: {
  src: string;
  file: File | null;
  disabled: boolean;
  onChange: (file: File) => void;
  onReset: () => void;
}) {
  const id = useId();
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return <section className="space-y-3 rounded-xl border border-[#dce9df] bg-white p-4">
    <label htmlFor={id} className="block text-sm font-semibold text-[#143428]">Cover kelas</label>
    <img src={preview || src} alt="Preview cover kelas" className="aspect-video w-full max-w-sm rounded-lg object-cover" />
    <p id={`${id}-help`} className="text-xs leading-5 text-[#476253]">JPG, PNG, atau WebP, maksimal 5 MB. Disarankan rasio 16:9. Gambar baru diunggah saat kelas disimpan.</p>
    <input id={id} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled}
      aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} aria-invalid={Boolean(error)}
      className="block w-full min-w-0 text-sm text-[#143428] file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f5ed] file:px-3 file:py-2 file:font-semibold file:text-[#006d77] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d77] disabled:opacity-50"
      onChange={async (event) => {
        const selected = event.target.files?.[0];
        event.target.value = '';
        if (!selected) return;
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) { setError('Pilih gambar JPG, PNG, atau WebP.'); return; }
        if (selected.size > 5 * 1024 * 1024) { setError('Ukuran gambar maksimal 5 MB.'); return; }
        try {
          const bitmap = await createImageBitmap(selected);
          bitmap.close();
          setError('');
          onChange(selected);
        } catch { setError('Gambar tidak bisa dibaca. Pilih file gambar lain.'); }
      }} />
    {error && <p id={`${id}-error`} role="alert" className="text-sm text-[#a12626]">{error}</p>}
    <button type="button" disabled={disabled} onClick={() => { setError(''); onReset(); }} className="min-h-10 rounded-lg border border-[#cbded0] px-3 text-sm font-semibold text-[#476253] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#006d77] disabled:opacity-50">Gunakan cover bawaan</button>
  </section>;
}
