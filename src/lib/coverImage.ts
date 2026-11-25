// Cover kelas dimuat setiap kali katalog dibuka, jadi ukurannya langsung menentukan kuota egress
// Supabase. Cover dikecilkan ke lebar maksimal 900 px dalam format WebP (cadangan JPEG).

export const COVER_MAX_WIDTH = 900;
// Path cover selalu unik (UUID), jadi aman di-cache browser selama setahun.
export const COVER_CACHE_CONTROL = '31536000';

const loadBitmap = async (blob: Blob): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(blob); } catch { /* lanjut ke <img> */ }
  }
  const url = URL.createObjectURL(blob);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('Format gambar cover tidak didukung.'));
      image.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
};

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Kecilkan gambar cover. Mengembalikan blob baru beserta ekstensi & content type-nya. */
export const compressCoverImage = async (source: Blob): Promise<{ blob: Blob; extension: 'webp' | 'jpg'; contentType: string }> => {
  const image = await loadBitmap(source);
  const scale = Math.min(1, COVER_MAX_WIDTH / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Browser tidak bisa memproses gambar cover.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if ('close' in image) image.close();

  const webp = await toBlob(canvas, 'image/webp', 0.78);
  if (webp && webp.type === 'image/webp') return { blob: webp, extension: 'webp', contentType: 'image/webp' };
  const jpeg = await toBlob(canvas, 'image/jpeg', 0.8);
  if (!jpeg) throw new Error('Gambar cover gagal diproses.');
  return { blob: jpeg, extension: 'jpg', contentType: 'image/jpeg' };
};
