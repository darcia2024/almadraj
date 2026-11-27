// Sinkronisasi rekaman Bimbel dari folder Google Drive per maddah.
//
// PJ cukup mengunggah rekaman tiap pertemuan ke folder Drive maddah-nya. Endpoint ini mengubah
// file baru menjadi materi audio yang langsung terbit, menonaktifkan materi yang file-nya sudah
// dihapus dari folder, dan memberi notifikasi ke santri yang aksesnya aktif.
//
//   POST /api/drive/sync  { slug }  — dipanggil ruang belajar / panel admin (butuh token login)
//   GET  /api/drive/sync            — Vercel cron harian, menyinkronkan semua maddah

const MEDIA_EXT = {
  mp3: 'audio', m4a: 'audio', aac: 'audio', ogg: 'audio', oga: 'audio', opus: 'audio', wav: 'audio', amr: 'audio', flac: 'audio', weba: 'audio',
  mp4: 'video', mov: 'video', mkv: 'video', webm: 'video', m4v: 'video', '3gp': 'video',
};

const supabaseServerKey = () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseKeyHeaders = (json = true) => {
  const key = supabaseServerKey();
  const headers = { apikey: key };
  if (json) headers['Content-Type'] = 'application/json';
  if (key?.startsWith('eyJ')) headers.Authorization = 'Bearer ' + key;
  return headers;
};

const supabaseFetch = async (path, options = {}) => {
  const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/' + path, {
    ...options,
    headers: { ...supabaseKeyHeaders(), ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.hint || 'Supabase request failed');
  return data;
};

// Satu maddah paling sering disinkronkan sekali per 45 detik per instance server.
const lastSyncedAt = new Map();
const SYNC_COOLDOWN_MS = 45_000;

const mediaTypeOf = (name, mimeType = '') => {
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  const ext = String(name).split('.').pop()?.toLowerCase() || '';
  return MEDIA_EXT[ext] || null;
};

// "03 - Bab Fa'il.mp3" -> { order: 3, title: "Bab Fa'il" }; "Pertemuan 5.m4a" -> { order: 5, title: "Pertemuan 5" }
const parseName = (name) => {
  const base = String(name).replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const leading = base.match(/^(\d{1,3})(?:\s*[-.)_:]\s*|\s+)(.*)$/);
  const meeting = base.match(/(?:pertemuan|pert\.?|pt\.?|sesi|part|bagian|ke)\s*-?\s*(\d{1,3})/i);
  const order = leading ? Number(leading[1]) : meeting ? Number(meeting[1]) : null;
  let title = leading ? leading[2].trim() : base;
  if (!title || /^\d+$/.test(title)) title = 'Pertemuan ' + (order ?? title);
  return { order, title };
};

const listViaDriveApi = async (folderId, apiKey) => {
  const files = [];
  let pageToken = '';
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      // Subfolder ikut terdaftar (mimeType folder) supaya bisa dibaca isinya.
      fields: 'nextPageToken, files(id, name, mimeType, createdTime)',
      orderBy: 'createdTime',
      pageSize: '1000',
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
      key: apiKey,
    });
    if (pageToken) params.set('pageToken', pageToken);
    const response = await fetch('https://www.googleapis.com/drive/v3/files?' + params);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('Drive API: ' + (data?.error?.message || response.status));
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || '';
  } while (pageToken);
  return files;
};

// Cadangan tanpa API key: tampilan folder tersemat milik Google (folder harus "siapa saja yang memiliki link").
const listViaEmbeddedView = async (folderId) => {
  const response = await fetch('https://drive.google.com/embeddedfolderview?id=' + encodeURIComponent(folderId), {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AlMadrajSync/1.0)' },
  });
  if (!response.ok) throw new Error('Folder Drive tidak bisa dibuka (' + response.status + '). Pastikan aksesnya "Siapa saja yang memiliki link".');
  const html = await response.text();
  const files = [];
  // Satu blok per entri. Jenis file dibaca dari ikon Drive (".../type/audio/mpeg"), karena nama file
  // dari HP sering tanpa ekstensi ("Nahwu Sharaf (pert 1)").
  for (const block of html.split('class="flip-entry"').slice(1)) {
    const id = block.match(/^\s*id="entry-([\w-]{10,})"/)?.[1];
    const title = block.match(/class="flip-entry-title">([^<]*)</)?.[1];
    if (!id || title === undefined) continue;
    const name = title.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    const isFolder = /href="[^"]*\/drive\/folders\//.test(block);
    const mimeType = isFolder ? FOLDER_MIME : (block.match(/\/type\/([\w.+-]+\/[\w.+-]+)/)?.[1] || '');
    files.push({ id, name, mimeType });
  }
  return files;
};

const FOLDER_MIME = 'application/vnd.google-apps.folder';
const MAX_DEPTH = 3;

const listOneFolder = async (folderId) => {
  const apiKey = process.env.GOOGLE_DRIVE_API_KEY;
  return apiKey ? listViaDriveApi(folderId, apiKey) : listViaEmbeddedView(folderId);
};

// PJ sering membuat subfolder per pertemuan ("Pertemuan 3", "Rekaman bimbel", ...). Ikut baca isinya;
// nama subfolder dipakai sebagai nomor/judul pertemuan bila nama file-nya tidak bernomor.
const listFolder = async (folderId, depth = 0, parents = []) => {
  const entries = await listOneFolder(folderId);
  const files = entries.filter((e) => e.mimeType !== FOLDER_MIME).map((e) => ({ ...e, parents }));
  if (depth >= MAX_DEPTH) return files;
  const subfolders = entries.filter((e) => e.mimeType === FOLDER_MIME);
  const nested = await Promise.all(subfolders.map((f) => listFolder(f.id, depth + 1, [...parents, f.name]).catch(() => [])));
  return files.concat(...nested);
};

// Nomor & judul pertemuan: dari nama file, atau dari subfolder terdekat yang bernomor.
const describeFile = (file, siblingsInFolder) => {
  const own = parseName(file.name);
  const ownHasNumber = /\d/.test(file.name.replace(/\.[a-z0-9]{2,5}$/i, '')) && own.order !== null;
  if (ownHasNumber || !file.parents.length) return own;
  for (let i = file.parents.length - 1; i >= 0; i -= 1) {
    const folder = parseName(file.parents[i]);
    if (folder.order !== null) {
      const title = siblingsInFolder > 1 ? `${file.parents[i]} — ${own.title}` : file.parents[i];
      return { order: folder.order, title };
    }
  }
  return own;
};

const syncCourse = async (course, folderId) => {
  const media = (await listFolder(folderId))
    .map((file) => ({ ...file, type: mediaTypeOf(file.name, file.mimeType) }))
    .filter((file) => file.type);
  const perFolder = new Map();
  for (const file of media) {
    const key = file.parents.join('/');
    perFolder.set(key, (perFolder.get(key) || 0) + 1);
  }
  const files = media.map((file) => ({ ...file, ...describeFile(file, perFolder.get(file.parents.join('/')) || 1) }));

  const existing = await supabaseFetch(
    'lessons?course_id=eq.' + course.id + '&select=id,drive_file_id,is_published,sort_order&order=sort_order.desc',
  );
  const known = new Map(existing.filter((l) => l.drive_file_id).map((l) => [l.drive_file_id, l]));
  const fresh = files.filter((file) => !known.has(file.id));
  // File tanpa nomor ditaruh setelah nomor tertinggi, supaya tidak bentrok dengan "Pertemuan N".
  let nextOrder = Math.max(0, ...existing.map((l) => Number(l.sort_order) || 0), ...fresh.map((f) => f.order || 0)) + 1;
  const rows = fresh.map((file) => {
    const { order, title } = file;
    return {
      course_id: course.id,
      title,
      content_type: file.type,
      duration: '',
      content_url: 'https://drive.google.com/file/d/' + file.id + '/view',
      sort_order: order ?? nextOrder++,
      is_published: true,
      drive_file_id: file.id,
    };
  });

  let inserted = [];
  if (rows.length) {
    inserted = (await supabaseFetch('lessons?on_conflict=course_id,drive_file_id&select=id,title,sort_order', {
      method: 'POST',
      headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
      body: JSON.stringify(rows),
    })) || [];
    inserted.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  // File yang dihapus dari folder: sembunyikan materinya; file yang kembali: terbitkan lagi.
  // Hanya bila folder terbaca berisi, supaya gangguan sementara tidak menyembunyikan semua materi.
  let hidden = 0;
  let restored = 0;
  if (files.length) {
    const present = new Set(files.map((file) => file.id));
    const toHide = existing.filter((l) => l.drive_file_id && l.is_published && !present.has(l.drive_file_id)).map((l) => l.id);
    const toRestore = existing.filter((l) => l.drive_file_id && !l.is_published && present.has(l.drive_file_id)).map((l) => l.id);
    if (toHide.length) {
      await supabaseFetch('lessons?id=in.(' + toHide.join(',') + ')', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_published: false }) });
      hidden = toHide.length;
    }
    if (toRestore.length) {
      await supabaseFetch('lessons?id=in.(' + toRestore.join(',') + ')', { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ is_published: true }) });
      restored = toRestore.length;
    }
  }

  if (rows.length) await notifyStudents(course, rows);
  // Daftar rekaman baru dikembalikan supaya admin bisa menyalin pesan berisi link untuk grup WhatsApp.
  return { added: rows.length, hidden, restored, files: files.length, lessons: inserted.map((l) => ({ id: l.id, title: l.title })) };
};

const notifyStudents = async (course, rows) => {
  try {
    const enrolled = await supabaseFetch('enrollments?course_id=eq.' + course.id + '&status=eq.active&select=user_id');
    if (!enrolled.length) return;
    const shortTitle = String(course.title || 'maddah').split(' · ')[0];
    const title = rows.length === 1 ? 'Rekaman baru: ' + shortTitle : rows.length + ' rekaman baru: ' + shortTitle;
    const body = rows.length === 1 ? rows[0].title + ' sudah bisa didengarkan.' : rows.map((r) => r.title).slice(0, 3).join(', ') + (rows.length > 3 ? ', dan lainnya' : '') + ' sudah bisa didengarkan.';
    await supabaseFetch('notifications', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(enrolled.map((e) => ({ user_id: e.user_id, type: 'new_recording', title, body }))),
    });
  } catch (error) {
    console.warn('[drive-sync] Notifikasi gagal dikirim:', error instanceof Error ? error.message : error);
  }
};

const loadDriveCourses = async (slug) => {
  const filter = slug ? '&slug=eq.' + encodeURIComponent(slug) : '';
  const courses = await supabaseFetch(
    'courses?program_type=eq.Bimbel&is_bundle=eq.false' + filter + '&select=id,slug,title,pj_email,course_access_links(drive_folder_id)',
  );
  return courses
    .map((course) => {
      const links = Array.isArray(course.course_access_links) ? course.course_access_links[0] : course.course_access_links;
      return { course, folderId: String(links?.drive_folder_id || '').trim() };
    })
    .filter((entry) => entry.folderId);
};

const canSyncCourse = async (user, course) => {
  if (course.pj_email && String(course.pj_email).toLowerCase() === String(user.email || '').toLowerCase()) return true;
  const profiles = await supabaseFetch('profiles?id=eq.' + user.id + '&select=role');
  if (profiles[0]?.role === 'admin') return true;
  const enrollments = await supabaseFetch('enrollments?user_id=eq.' + user.id + '&course_id=eq.' + course.id + '&status=eq.active&select=id');
  return enrollments.length > 0;
};

export default async function handler(req, res) {
  if (!process.env.SUPABASE_URL || !supabaseServerKey()) return res.status(500).json({ message: 'SUPABASE_URL atau SUPABASE_SECRET_KEY belum dikonfigurasi.' });

  // Vercel cron: sinkronkan semua maddah.
  if (req.method === 'GET') {
    const cronSecret = process.env.CRON_SECRET;
    const authorized = cronSecret
      ? req.headers.authorization === 'Bearer ' + cronSecret
      : String(req.headers['user-agent'] || '').startsWith('vercel-cron/');
    if (!authorized) return res.status(401).json({ message: 'Unauthorized' });
    const results = [];
    for (const { course, folderId } of await loadDriveCourses()) {
      try {
        results.push({ slug: course.slug, ...(await syncCourse(course, folderId)) });
      } catch (error) {
        console.warn('[drive-sync]', course.slug, error instanceof Error ? error.message : error);
        results.push({ slug: course.slug, error: error instanceof Error ? error.message : 'Sync gagal' });
      }
    }
    return res.status(200).json({ synced: results.length, added: results.reduce((sum, r) => sum + (r.added || 0), 0), results });
  }

  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  const slug = String(req.body?.slug || '').trim();
  if (!slug) return res.status(400).json({ message: 'slug wajib diisi.' });

  try {
    const userResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', { headers: { ...supabaseKeyHeaders(false), Authorization: 'Bearer ' + token } });
    const user = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !user.id) return res.status(401).json({ message: 'Session login tidak valid.' });

    const [entry] = await loadDriveCourses(slug);
    if (!entry) return res.status(200).json({ added: 0, skipped: 'no-folder' });
    if (!(await canSyncCourse(user, entry.course))) return res.status(403).json({ message: 'Tidak punya akses ke maddah ini.' });

    const force = Boolean(req.body?.force);
    const last = lastSyncedAt.get(entry.course.id) || 0;
    if (!force && Date.now() - last < SYNC_COOLDOWN_MS) return res.status(200).json({ added: 0, skipped: 'cooldown' });
    lastSyncedAt.set(entry.course.id, Date.now());

    const result = await syncCourse(entry.course, entry.folderId);
    return res.status(200).json(result);
  } catch (error) {
    console.error('[drive-sync] Error:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Sinkronisasi gagal.' });
  }
}
