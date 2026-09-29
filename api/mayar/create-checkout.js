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

// Ref project Supabase dari URL (https://<ref>.supabase.co) atau dari klaim `iss` token login.
const projectRefFromUrl = (value) => {
  try { return new URL(value).hostname.split('.')[0]; } catch { return ''; }
};
const projectRefFromToken = (token) => {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return projectRefFromUrl(payload.iss || '');
  } catch { return ''; }
};

// Jelaskan kenapa Supabase menolak token, tanpa membocorkan key apa pun.
const explainAuthFailure = (token, status, body) => {
  const serverRef = projectRefFromUrl(process.env.SUPABASE_URL);
  const tokenRef = projectRefFromToken(token);
  if (tokenRef && serverRef && tokenRef !== serverRef) {
    return `SUPABASE_URL di Vercel mengarah ke project "${serverRef}", sedangkan website login ke project "${tokenRef}". Samakan SUPABASE_URL dan SUPABASE_SECRET_KEY dengan project "${tokenRef}", lalu Redeploy.`;
  }
  const detail = String(body?.message || body?.msg || body?.error_description || body?.error || '');
  if (/invalid api key|no api key/i.test(detail)) {
    return `SUPABASE_SECRET_KEY di Vercel bukan key milik project "${serverRef}". Ambil Secret/Service Role key dari project tersebut, lalu Redeploy.`;
  }
  if (status === 401 || status === 403) return 'Session login tidak valid atau telah berakhir. Silakan keluar lalu masuk lagi.';
  return 'Verifikasi login ke Supabase gagal (' + status + (detail ? ': ' + detail : '') + ').';
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  if (!rateLimit('mayar-checkout:' + (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'))) return res.status(429).json({ message: 'Too many checkout requests' });
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  if (!process.env.MAYAR_API_KEY) return res.status(500).json({ message: 'MAYAR_API_KEY belum dikonfigurasi di Environment Variable server (Vercel).' });
  if (!supabaseServerKey() || !process.env.SUPABASE_URL) return res.status(500).json({ message: 'SUPABASE_URL atau SUPABASE_SECRET_KEY belum dikonfigurasi.' });

  try {
    const userResponse = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', { headers: { ...supabaseKeyHeaders(false), Authorization: 'Bearer ' + token } });
    const user = await userResponse.json().catch(() => ({}));
    if (!userResponse.ok || !user.id) {
      const message = explainAuthFailure(token, userResponse.status, user);
      console.warn('[mayar-checkout] Verifikasi login gagal:', userResponse.status, message);
      return res.status(401).json({ message });
    }
    const orderId = req.body?.orderId;
    if (!orderId) return res.status(400).json({ message: 'orderId wajib diisi.' });
    const orders = await supabaseFetch('orders?id=eq.' + encodeURIComponent(orderId) + '&user_id=eq.' + encodeURIComponent(user.id) + '&select=id,amount,status,course_id,checkout_url,expires_at,courses(title)');
    const order = orders[0];
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan.' });
    if (order.status === 'paid') return res.status(409).json({ message: 'Order ini sudah berstatus lunas.' });
    if (order.checkout_url && (!order.expires_at || new Date(order.expires_at).getTime() > Date.now())) {
      return res.status(200).json({ checkoutUrl: order.checkout_url, reused: true });
    }
    const profiles = await supabaseFetch('profiles?id=eq.' + encodeURIComponent(user.id) + '&select=full_name,whatsapp');
    const profile = profiles[0] || {};
    const customerMobile = req.body?.mobile || req.body?.whatsapp || profile.whatsapp || '081282218903';
    const customerName = profile.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Santri Al Madraj';
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const appUrl = (process.env.APP_URL || req.headers.origin || 'http://localhost:5173').replace(/\/$/, '');
    const apiUrl = process.env.MAYAR_API_URL || 'https://api.mayar.id/hl/v2/invoices/create';

    const mayarResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.MAYAR_API_KEY.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: customerName,
        email: user.email,
        mobile: customerMobile,
        redirectUrl: appUrl + '/pembayaran/' + order.id,
        description: 'Al Madraj - ' + (order.courses?.title || 'Program Belajar') + ' (Order #' + order.id.slice(0, 8) + ')',
        expiredAt: expiresAt,
        items: [
          {
            quantity: 1,
            rate: Number(order.amount),
            description: order.courses?.title || 'Program Belajar Al Madraj',
          },
        ],
        extraData: {
          orderId: order.id,
          courseId: order.course_id,
        },
      }),
    });

    const mayar = await mayarResponse.json().catch(() => ({}));
    const payment = mayar.data || mayar;
    if (!mayarResponse.ok || (!payment?.link && !payment?.url && !payment?.paymentUrl)) {
      const errorDetail = mayar.messages || mayar.message || JSON.stringify(mayar);
      return res.status(502).json({ message: 'Mayar gagal membuat invoice: ' + errorDetail });
    }

    const checkoutUrl = payment.link || payment.url || payment.paymentUrl;
    const checkoutId = payment.id || payment.paymentId || payment.transactionId || String(order.id);
    const paymentId = payment.transactionId || payment.transaction_id || payment.id;

    await supabaseFetch('orders?id=eq.' + encodeURIComponent(order.id), {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        provider_checkout_id: checkoutId,
        provider_payment_id: paymentId,
        checkout_url: checkoutUrl,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }),
    });

    return res.status(200).json({ checkoutUrl });
  } catch (error) {
    return res.status(500).json({ message: error instanceof Error ? error.message : 'Checkout gagal diproses' });
  }
}
