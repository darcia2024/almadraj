import { requireSupabase } from './supabase';

// Endpoint ikut lokasi create-checkout (bisa absolut lewat VITE_MAYAR_CHECKOUT_ENDPOINT).
const verifyEndpoint = () =>
  (import.meta.env.VITE_MAYAR_CHECKOUT_ENDPOINT || '/api/mayar/create-checkout').replace(/create-checkout\/?$/, 'verify');

/**
 * Minta server mengecek status invoice langsung ke Mayar (cadangan bila webhook terlambat/gagal).
 * Mengembalikan status order terbaru, atau null bila pengecekan tidak bisa dilakukan.
 */
export type PaymentCheckResult = {
  status?: string;
  checked?: boolean;
  mayar?: string;
  mayarHttp?: number;
  note?: string;
  skipped?: string;
  message?: string;
  httpStatus: number;
};

/** Versi lengkap: dipakai admin untuk melihat jawaban Mayar per order. */
export const checkPaymentWithMayar = async (orderId: string): Promise<PaymentCheckResult> => {
  try {
    const { data } = await requireSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { httpStatus: 401, message: 'Belum login.' };
    const response = await fetch(verifyEndpoint(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ orderId }),
    });
    const result = await response.json().catch(() => ({}));
    return { ...result, httpStatus: response.status };
  } catch (error) {
    return { httpStatus: 0, message: error instanceof Error ? error.message : 'Gagal menghubungi server.' };
  }
};

export const verifyPaymentWithMayar = async (orderId: string): Promise<string | null> => {
  const result = await checkPaymentWithMayar(orderId);
  return result.httpStatus === 200 && typeof result.status === 'string' ? result.status : null;
};
