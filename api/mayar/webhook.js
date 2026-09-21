import crypto from 'node:crypto';

const requestWindows = new Map();
const rateLimit = (key, limit = 30, windowMs = 60_000) => {
  const now = Date.now();
  const current = requestWindows.get(key);
  if (!current || now - current.startedAt > windowMs) {
    requestWindows.set(key, { startedAt: now, count: 1 });
    return true;
  }
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

const safeEqual = (supplied, expected) => {
  const a = Buffer.from(String(supplied || ''), 'utf8');
  const b = Buffer.from(String(expected || ''), 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const requestIsAuthorized = (req) => {
  const secret = process.env.MAYAR_WEBHOOK_SECRET;
  if (!secret) return false;
  const directSecret = req.headers['x-webhook-secret'] || req.query?.secret;
  if (directSecret && safeEqual(directSecret, secret)) return true;
  const supplied = String(req.headers['x-mayar-signature'] || req.headers['x-webhook-signature'] || '').replace(/^sha256=/i, '');
  if (!supplied) return false;
  const rawBody = req.rawBody ? Buffer.from(req.rawBody) : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(supplied, expected);
};

const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
})[character]);

const sendPaymentEmail = async (order) => {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFICATION_FROM_EMAIL) return;
  const userResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/admin/users/' + encodeURIComponent(order.user_id), { headers: supabaseKeyHeaders(false) });
  const user = await userResponse.json().catch(() => null);
  if (!userResponse.ok || !user?.email) return;
  await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.NOTIFICATION_FROM_EMAIL, to: user.email, subject: 'Pembayaran Al Madraj berhasil', html: '<p>Pembayaran kamu berhasil dikonfirmasi.</p><p>Akses kelas ' + escapeHtml(order.courses?.title || 'Al Madraj') + ' sudah aktif.</p>' }) });
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!rateLimit('mayar-webhook:' + (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'))) return res.status(429).json({ message: 'Too many requests' });
  if (!process.env.SUPABASE_URL || !supabaseServerKey() || !process.env.MAYAR_WEBHOOK_SECRET) return res.status(500).json({ message: 'Webhook backend belum dikonfigurasi lengkap' });
  if (!requestIsAuthorized(req)) return res.status(401).json({ message: 'Invalid webhook secret' });

  const payload = req.body || {};
  if (!['payment.received', 'payment.reminder'].includes(payload.event)) return res.status(200).json({ received: true, processed: false });
  const data = payload.data || {};
  const providerCheckoutId = data.id;
  const providerPaymentId = data.transactionId || data.transaction_id;
  if (!providerCheckoutId && !providerPaymentId) return res.status(400).json({ message: 'Payment identifiers missing' });

  try {
    const selectOrder = async (field, value) => value ? (await supabaseFetch('orders?' + field + '=eq.' + encodeURIComponent(value) + '&select=id,user_id,course_id,amount,status,courses(title)'))[0] : null;
    const order = await selectOrder('provider_checkout_id', providerCheckoutId) || await selectOrder('provider_payment_id', providerPaymentId);
    if (!order) return res.status(202).json({ received: true, processed: false });

    const paidAmount = Number(data.amount ?? data.totalAmount ?? data.total_amount);
    if (payload.event === 'payment.received' && Number.isFinite(paidAmount) && paidAmount !== Number(order.amount)) {
      return res.status(422).json({ message: 'Payment amount does not match the order' });
    }

    if (payload.event === 'payment.reminder') {
      await supabaseFetch('notifications', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ user_id: order.user_id, type: 'payment_reminder', title: 'Pembayaran belum selesai', body: 'Selesaikan pembayaran kelas ' + (order.courses?.title || 'Al Madraj') + ' sebelum tautan berakhir.', order_id: order.id }) });
      return res.status(200).json({ received: true, processed: true });
    }

    if (order.status === 'paid') return res.status(200).json({ received: true, processed: true, duplicate: true });
    const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/rpc/mark_lms_order_paid', { method: 'POST', headers: supabaseKeyHeaders(), body: JSON.stringify({ p_provider_checkout_id: providerCheckoutId || '', p_provider_payment_id: providerPaymentId || '' }) });
    if (!response.ok) return res.status(202).json({ received: true, processed: false });
    if (order) {
      await supabaseFetch('notifications', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ user_id: order.user_id, type: 'payment_received', title: 'Pembayaran berhasil', body: 'Akses kelas ' + (order.courses?.title || 'Al Madroj') + ' sudah aktif.', order_id: order.id }) });
      await supabaseFetch('admin_audit_logs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ action: 'payment.received', entity_type: 'order', entity_id: order.id, metadata: { provider_checkout_id: providerCheckoutId || null, provider_payment_id: providerPaymentId || null } }) });
      await sendPaymentEmail(order);
    }
    return res.status(200).json({ received: true, processed: true });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Webhook processing failed' });
  }
}
