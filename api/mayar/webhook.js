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

// Mayar tidak menandatangani webhook, jadi kuncinya adalah ?secret= di URL webhook.
// Mengembalikan alasan penolakan (tanpa membocorkan nilai secret) untuk log Vercel.
const authorizationFailure = (req) => {
  const secret = process.env.MAYAR_WEBHOOK_SECRET;
  if (!secret) return 'MAYAR_WEBHOOK_SECRET belum diset';
  const directSecret = req.headers['x-webhook-secret'] || req.query?.secret;
  if (directSecret) {
    if (safeEqual(directSecret, secret)) return null;
    return /^YOUR_|^\[|placeholder/i.test(String(directSecret))
      ? 'URL webhook masih memakai teks placeholder, bukan secret asli'
      : 'Nilai ?secret= di URL webhook tidak sama dengan MAYAR_WEBHOOK_SECRET';
  }
  const supplied = String(req.headers['x-mayar-signature'] || req.headers['x-webhook-signature'] || '').replace(/^sha256=/i, '');
  if (!supplied) return 'URL webhook tidak memuat ?secret=';
  const rawBody = req.rawBody ? Buffer.from(req.rawBody) : Buffer.from(JSON.stringify(req.body || {}));
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return safeEqual(supplied, expected) ? null : 'Signature webhook tidak valid';
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
  // Beberapa pengecekan URL memakai GET/HEAD; jawab OK tanpa memproses apa pun.
  if (req.method === 'GET' || req.method === 'HEAD') return res.status(200).json({ ok: true, endpoint: 'mayar-webhook' });
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!rateLimit('mayar-webhook:' + (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'))) return res.status(429).json({ message: 'Too many requests' });
  if (!process.env.SUPABASE_URL || !supabaseServerKey() || !process.env.MAYAR_WEBHOOK_SECRET) return res.status(500).json({ message: 'Webhook backend belum dikonfigurasi lengkap' });
  const authFailure = authorizationFailure(req);
  if (authFailure) {
    console.warn('[mayar-webhook] Ditolak (401):', authFailure);
    return res.status(401).json({ message: 'Invalid webhook secret' });
  }

  const payload = req.body || {};
  const event = String(payload.event || payload.type || '').toLowerCase();
  const isPaidEvent = ['payment.received', 'payment.successful', 'invoice.paid', 'payment.success'].includes(event);
  const isReminderEvent = ['payment.reminder', 'invoice.reminder'].includes(event);
  if (!isPaidEvent && !isReminderEvent) {
    console.info('[mayar-webhook] Event diterima tanpa diproses:', event || '(kosong)');
    return res.status(200).json({ received: true, processed: false, note: 'Unhandled event: ' + event });
  }
  const data = payload.data || payload;
  const providerCheckoutId = data.id || data.paymentId || data.payment_id;
  const providerProductId = data.productId || data.product_id || data.invoiceId || data.invoice_id;
  const providerPaymentId = data.transactionId || data.transaction_id || data.id;
  const extraData = data.extraData || data.extra_data || {};
  const orderId = extraData.orderId || extraData.order_id;
  if (!orderId && !providerCheckoutId && !providerPaymentId) {
    console.warn('[mayar-webhook] Event', event, 'tanpa ID pembayaran (kemungkinan tes dari Mayar)');
    return res.status(200).json({ received: true, processed: false, note: 'Payment identifiers missing' });
  }

  try {
    const selectOrder = async (field, value) => value ? (await supabaseFetch('orders?' + field + '=eq.' + encodeURIComponent(value) + '&select=id,user_id,course_id,amount,status,provider_checkout_id,provider_payment_id,courses(title)'))[0] : null;
    const order = await selectOrder('id', orderId) || await selectOrder('provider_checkout_id', providerCheckoutId) || await selectOrder('provider_checkout_id', providerProductId) || await selectOrder('provider_payment_id', providerPaymentId);
    if (!order) {
      console.warn('[mayar-webhook] Order tidak ditemukan', { event, orderId: orderId || null, providerCheckoutId: providerCheckoutId || null, providerProductId: providerProductId || null });
      return res.status(200).json({ received: true, processed: false, note: 'Order not found' });
    }

    const paidAmount = Number(data.amount ?? data.totalAmount ?? data.total_amount);
    if (isPaidEvent && Number.isFinite(paidAmount) && paidAmount !== Number(order.amount)) {
      console.warn('[mayar-webhook] Nominal tidak cocok', { orderId: order.id, paidAmount, expected: Number(order.amount) });
      return res.status(422).json({ message: 'Payment amount does not match the order' });
    }

    if (isReminderEvent) {
      await supabaseFetch('notifications', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ user_id: order.user_id, type: 'payment_reminder', title: 'Pembayaran belum selesai', body: 'Selesaikan pembayaran kelas ' + (order.courses?.title || 'Al Madraj') + ' sebelum tautan berakhir.', order_id: order.id }) });
      return res.status(200).json({ received: true, processed: true });
    }

    if (order.status === 'paid') return res.status(200).json({ received: true, processed: true, duplicate: true });
    const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/rpc/mark_lms_order_paid', { method: 'POST', headers: supabaseKeyHeaders(), body: JSON.stringify({ p_provider_checkout_id: order.provider_checkout_id || providerCheckoutId || '', p_provider_payment_id: order.provider_payment_id || providerPaymentId || '' }) });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[mayar-webhook] Gagal mengaktifkan order', order.id, response.status, detail.slice(0, 300));
      // 500 supaya Mayar mengirim ulang dan kelas tidak diam-diam tetap terkunci.
      return res.status(500).json({ received: true, processed: false, message: 'Order activation failed' });
    }
    if (order) {
      await supabaseFetch('notifications', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ user_id: order.user_id, type: 'payment_received', title: 'Pembayaran berhasil', body: 'Akses kelas ' + (order.courses?.title || 'Al Madroj') + ' sudah aktif.', order_id: order.id }) });
      await supabaseFetch('admin_audit_logs', { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify({ action: 'payment.received', entity_type: 'order', entity_id: order.id, metadata: { provider_checkout_id: providerCheckoutId || null, provider_payment_id: providerPaymentId || null } }) });
      await sendPaymentEmail(order);
    }
    return res.status(200).json({ received: true, processed: true });
  } catch (error) {
    console.error('[mayar-webhook] Error:', error);
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Webhook processing failed' });
  }
}
