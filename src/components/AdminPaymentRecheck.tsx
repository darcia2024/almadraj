import React, { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { checkPaymentWithMayar, PaymentCheckResult } from '../lib/verifyPayment';

type RecheckOrder = { id: string; status: string; amount?: number; profiles?: { full_name?: string } | null; courses?: { title?: string } | null };

const describe = (r: PaymentCheckResult): { text: string; tone: 'ok' | 'wait' | 'bad' } => {
  if (r.status === 'paid') return { text: 'LUNAS di Mayar — akses sudah dibuka', tone: 'ok' };
  if (r.httpStatus !== 200) return { text: `Server error ${r.httpStatus}${r.message ? ': ' + r.message : ''}`, tone: 'bad' };
  if (r.checked === false && r.mayar === 'unavailable') {
    return { text: r.mayarHttp === 401 || r.mayarHttp === 403 ? `Mayar menolak (HTTP ${r.mayarHttp}) — cek MAYAR_API_KEY di Vercel` : `Tagihan tidak ditemukan di Mayar (HTTP ${r.mayarHttp ?? '?'})`, tone: 'bad' };
  }
  if (r.checked === false && !r.mayar) return { text: r.skipped === 'cooldown' ? 'Baru dicek, coba lagi sebentar' : 'Belum pernah dibuatkan tagihan Mayar', tone: 'wait' };
  if (r.note === 'amount-too-low') return { text: 'Lunas di Mayar tapi nominal kurang dari harga', tone: 'bad' };
  return { text: `Belum dibayar di Mayar (status: ${r.mayar || '?'})`, tone: 'wait' };
};

const TONE = { ok: 'text-emerald-700', wait: 'text-amber-700', bad: 'text-red-700' };

/** Admin: cek semua order "pending" langsung ke Mayar; yang sudah lunas otomatis dibuka aksesnya. */
export const AdminPaymentRecheck = ({ orders, onDone }: { orders: RecheckOrder[]; onDone: () => void }) => {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Array<{ order: RecheckOrder; result: PaymentCheckResult }>>([]);
  const pending = orders.filter((o) => o.status === 'pending');

  const run = async () => {
    setRunning(true);
    setResults([]);
    let opened = 0;
    for (const order of pending) {
      const result = await checkPaymentWithMayar(order.id);
      if (result.status === 'paid') opened += 1;
      setResults((list) => [...list, { order, result }]);
    }
    setRunning(false);
    if (opened) onDone();
  };

  const paidCount = results.filter((r) => r.result.status === 'paid').length;

  return (
    <div className="rounded-2xl border border-[#dce9df] bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#112d22]">Cek Ulang Pembayaran ke Mayar</h2>
          <p className="text-xs text-[#6c8577]">Tanya status tiap order "pending" langsung ke Mayar. Yang sudah lunas otomatis dibuka aksesnya.</p>
        </div>
        <button type="button" onClick={() => void run()} disabled={running || !pending.length} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#006d77] px-4 py-2 text-xs font-bold text-white disabled:opacity-50 cursor-pointer">
          {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          {running ? `Mengecek ${results.length}/${pending.length}...` : `Cek ${pending.length} order pending`}
        </button>
      </div>
      {results.length > 0 && (
        <>
          {!running && <p className="mt-3 text-xs font-bold text-[#112d22]">{paidCount} dari {results.length} order ternyata sudah lunas dan kini aktif.</p>}
          <ul className="mt-2 max-h-72 divide-y divide-[#edf4ef] overflow-y-auto rounded-lg border border-[#edf4ef] text-[11px]">
            {results.map(({ order, result }) => {
              const d = describe(result);
              return (
                <li key={order.id} className="flex flex-col gap-0.5 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="min-w-0 truncate text-[#46604f]"><strong className="text-[#112d22]">{order.profiles?.full_name || 'Peserta'}</strong> · {order.courses?.title || '-'}</span>
                  <span className={'shrink-0 font-bold ' + TONE[d.tone]}>{d.text}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};
