const json = (body, status = 200) => ({ status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const requestWindows = new Map();
const rateLimit = (key, limit = 12, windowMs = 60_000) => {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt > windowMs) { requestWindows.set(key, { startedAt: now, count: 1 }); return true; }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
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
    headers: {
      ...supabaseKeyHeaders(),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.hint || 'Supabase request failed');
  return data;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!rateLimit('mayar-checkout:' + (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'))) return res.status(429).json({ message: 'Too many checkout requests' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  if (!process.env.MAYAR_API_KEY || !supabaseServerKey() || !process.env.SUPABASE_URL) return res.status(500).json({ message: 'Payment backend belum dikonfigurasi' });

  try {
    const userResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', { headers: { ...supabaseKeyHeaders(false), Authorization: 'Bearer ' + token } });
    const user = await userResponse.json();
    if (!userResponse.ok || !user.id) return res.status(401).json({ message: 'Session tidak valid' });
    const orderId = req.body?.orderId;
    if (!orderId) return res.status(400).json({ message: 'orderId wajib diisi' });
    const orders = await supabaseFetch('orders?id=eq.' + encodeURIComponent(orderId) + '&user_id=eq.' + encodeURIComponent(user.id) + '&select=id,amount,status,course_id,checkout_url,expires_at,courses(title)');
    const order = orders[0];
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });
    if (order.status !== 'pending') return res.status(409).json({ message: 'Order sudah diproses' });
    if (order.checkout_url && (!order.expires_at || new Date(order.expires_at).getTime() > Date.now())) {
      return res.status(200).json({ checkoutUrl: order.checkout_url, reused: true });
    }
    const profiles = await supabaseFetch('profiles?id=eq.' + encodeURIComponent(user.id) + '&select=full_name,whatsapp');
    const profile = profiles[0] || {};
    if (!profile.whatsapp) return res.status(422).json({ message: 'Lengkapi nomor WhatsApp di pengaturan profil sebelum membayar.' });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const appUrl = (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
    const mayarResponse = await fetch('https://api.mayar.id/hl/v1/payment/create', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.MAYAR_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: profile.full_name || user.email, email: user.email, amount: order.amount, mobile: profile.whatsapp, redirectURL: appUrl + '/pembayaran/' + order.id, description: 'Al Madraj - ' + (order.courses?.title || 'Program belajar') + ' - Order ' + order.id, expiredAt }) });
    const mayar = await mayarResponse.json();
    const payment = mayar.data;
    if (!mayarResponse.ok || !payment?.link || !payment?.id) return res.status(502).json({ message: mayar.messages || 'Mayar gagal membuat invoice' });
    await supabaseFetch('orders?id=eq.' + encodeURIComponent(order.id), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ provider_checkout_id: payment.id, provider_payment_id: payment.transactionId || payment.transaction_id, checkout_url: payment.link, expires_at: expiresAt, updated_at: new Date().toISOString() }) });
    return res.status(200).json({ checkoutUrl: payment.link });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Checkout gagal' });
  }
}
