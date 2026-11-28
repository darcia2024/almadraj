import { requireSupabase } from './supabase';

// Endpoint ikut lokasi create-checkout (bisa absolut lewat VITE_MAYAR_CHECKOUT_ENDPOINT).
const verifyEndpoint = () =>
  (import.meta.env.VITE_MAYAR_CHECKOUT_ENDPOINT || '/api/mayar/create-checkout').replace(/create-checkout\/?$/, 'verify');

/**
 * Minta server mengecek status invoice langsung ke Mayar (cadangan bila webhook terlambat/gagal).
 * Mengembalikan status order terbaru, atau null bila pengecekan tidak bisa dilakukan.
 */
export const verifyPaymentWithMayar = async (orderId: string): Promise<string | null> => {
  try {
    const { data } = await requireSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const response = await fetch(verifyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ orderId }),
    });
    if (!response.ok) return null;
    const result = await response.json().catch(() => null);
    return typeof result?.status === 'string' ? result.status : null;
  } catch {
    return null;
  }
};
