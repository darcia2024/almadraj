// Cek cadangan status pembayaran langsung ke Mayar, tanpa menunggu webhook.
//
//   POST /api/mayar/verify  { orderId }   (Authorization: Bearer <token login peserta/admin>)
//
// Dipanggil popup pembayaran dan halaman /pembayaran/:id selama order masih "pending". Kalau invoice
// di Mayar sudah "paid" dan nominalnya tidak kurang dari harga order, order ditandai lunas lewat
// mark_lms_order_paid (fungsi yang sama dengan webhook), jadi kelas langsung terbuka.

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

// Satu order paling sering dicek ke Mayar sekali per 8 detik per instance server.
const lastCheckedAt = new Map();
const CHECK_COOLDOWN_MS = 8_000;

// Base API Mayar mengikuti MAYAR_API_URL (produksi api.mayar.id atau sandbox api.mayar.io).
const mayarBase = () => (process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v2/invoices/create').replace(/\/hl\/.*$/, '');

const fetchInvoice = async (invoiceId) => {
  const headers = { Authorization: 'Bearer ' + process.env.MAYAR_API_KEY.trim() };
  // V2 dulu (V1 dihentikan Mayar per 1 Okt 2026); V1 hanya cadangan untuk invoice lama.
  for (const path of ['/hl/v2/invoices/', '/hl/v1/invoice/']) {
    const response = await fetch(mayarBase() + path + encodeURIComponent(invoiceId), { headers });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      const data = Array.isArray(body?.data) ? body.data[0] : body?.data;
      if (data) return { ok: true, version: path.includes('v2') ? 'v2' : 'v1', data };
    }
    if (response.status === 401 || response.status === 403) return { ok: false, httpStatus: response.status };
  }
  return { ok: false, httpStatus: 404 };
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!process.env.SUPABASE_URL || !supabaseServerKey() || !process.env.MAYAR_API_KEY) {
    return res.status(500).json({ message: 'Server belum dikonfigurasi lengkap.' });
  }
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  const orderId = String(req.body?.orderId || '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) return res.status(400).json({ message: 'orderId tidak valid.' });

  try {
    const userResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', { headers: { ...supabaseKeyHeaders(false), Authorization: 'Bearer ' + token } });
    const user = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !user.id) return res.status(401).json({ message: 'Session login tidak valid.' });

    const [order] = await supabaseFetch('orders?id=eq.' + orderId + '&select=id,user_id,amount,status,provider_checkout_id,provider_payment_id,courses(title)');
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan.' });
    if (order.user_id !== user.id) {
      const [profile] = await supabaseFetch('profiles?id=eq.' + user.id + '&select=role');
      if (profile?.role !== 'admin') return res.status(404).json({ message: 'Order tidak ditemukan.' });
    }
    if (order.status === 'paid') return res.status(200).json({ status: 'paid' });
    if (!order.provider_checkout_id) return res.status(200).json({ status: order.status, checked: false });

    const last = lastCheckedAt.get(order.id) || 0;
    if (Date.now() - last < CHECK_COOLDOWN_MS) return res.status(200).json({ status: order.status, checked: false, skipped: 'cooldown' });
    lastCheckedAt.set(order.id, Date.now());

    const invoice = await fetchInvoice(order.provider_checkout_id);
    if (!invoice.ok) {
      console.warn('[mayar-verify] Invoice tidak bisa dicek', { orderId: order.id, httpStatus: invoice.httpStatus });
      return res.status(200).json({ status: order.status, checked: false, mayar: 'unavailable' });
    }
    const mayarStatus = String(invoice.data.status || '').toLowerCase();
    const paidAmount = Number(invoice.data.amount);
    if (mayarStatus !== 'paid') return res.status(200).json({ status: order.status, checked: true, mayar: mayarStatus || 'unknown' });
    if (Number.isFinite(paidAmount) && paidAmount > 0 && paidAmount < Number(order.amount)) {
      console.warn('[mayar-verify] Nominal invoice kurang dari harga order', { orderId: order.id, paidAmount, expected: Number(order.amount) });
      return res.status(200).json({ status: order.status, checked: true, mayar: 'paid', note: 'amount-too-low' });
    }

    const rpc = await fetch(process.env.SUPABASE_URL + '/rest/v1/rpc/mark_lms_order_paid', {
      method: 'POST',
      headers: supabaseKeyHeaders(),
      body: JSON.stringify({ p_provider_checkout_id: order.provider_checkout_id, p_provider_payment_id: order.provider_payment_id || '' }),
    });
    if (!rpc.ok) {
      const detail = await rpc.text().catch(() => '');
      console.error('[mayar-verify] Gagal mengaktifkan order', order.id, rpc.status, detail.slice(0, 300));
      return res.status(500).json({ message: 'Aktivasi order gagal.' });
    }
    console.info('[mayar-verify] Order ditandai lunas dari cek langsung Mayar', { orderId: order.id, version: invoice.version });
    await supabaseFetch('notifications', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ user_id: order.user_id, type: 'payment_received', title: 'Pembayaran berhasil', body: 'Akses kelas ' + (order.courses?.title || 'Al Madraj') + ' sudah aktif.', order_id: order.id }) }).catch(() => null);
    await supabaseFetch('admin_audit_logs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ action: 'payment.verified_via_api', entity_type: 'order', entity_id: order.id, metadata: { provider_checkout_id: order.provider_checkout_id, mayar_version: invoice.version } }) }).catch(() => null);
    return res.status(200).json({ status: 'paid', checked: true, mayar: 'paid' });
  } catch (error) {
    console.error('[mayar-verify] Error:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Cek pembayaran gagal.' });
  }
}
