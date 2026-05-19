"use client";

import { useState } from "react";
import { ALL_CURRENCIES } from "@/lib/currencies";
import { ArrowRightLeft } from "lucide-react";

type Props = {
  onConvert: (amount: number, from: string, to: string) => Promise<number>;
  balanceCurrency: string;
  onChangeBalanceCurrency: (currency: string) => void;
};

export default function CurrencyConverterCard({
  onConvert,
  balanceCurrency,
  onChangeBalanceCurrency,
}: Props) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("EUR");
  const [to, setTo] = useState("USD");
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleConvert() {
    setError(null);
    setLoading(true);
    try {
      const numeric = Number(amount);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        throw new Error("El importe no es válido.");
      }
      const converted = await onConvert(numeric, from, to);
      setResult(converted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo convertir.");
    } finally {
      setLoading(false);
    }
  }

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
    setResult(null);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-[#1E293B]">
        <span className="text-lg">💱</span>
        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Conversión de moneda</span>
      </div>

      <div className="p-5 space-y-4">
        {/* Importe */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            Importe
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setResult(null); }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-base font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            placeholder="100"
            min="0"
          />
        </div>

        {/* Desde / Intercambiar / A */}
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Desde
            </label>
            <select
              value={from}
              onChange={(e) => { setFrom(e.target.value); setResult(null); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            >
              {ALL_CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>{item.code} · {item.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={swapCurrencies}
            title="Intercambiar monedas"
            className="mb-0.5 shrink-0 rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 dark:border-[#334155] dark:bg-[#0F1623]"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              A
            </label>
            <select
              value={to}
              onChange={(e) => { setTo(e.target.value); setResult(null); }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
            >
              {ALL_CURRENCIES.map((item) => (
                <option key={item.code} value={item.code}>{item.code} · {item.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Botón convertir */}
        <button
          type="button"
          onClick={handleConvert}
          disabled={loading}
          className={`w-full rounded-xl py-3 text-sm font-bold transition ${
            loading
              ? "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-[#1E293B] dark:text-slate-500"
              : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-violet-600 dark:hover:bg-violet-500"
          }`}
        >
          {loading ? "Convirtiendo..." : `Convertir ${amount || "0"} ${from} → ${to}`}
        </button>

        {/* Resultado */}
        {result != null && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 dark:border-emerald-900 dark:bg-emerald-950/30">
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Resultado</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
              {result.toFixed(2)} <span className="text-lg">{to}</span>
            </p>
            <p className="mt-0.5 text-xs text-emerald-600/70 dark:text-emerald-500">
              Tipo de cambio aproximado al momento de la consulta
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Moneda del balance */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-[#1E293B] dark:bg-[#080C14]">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Moneda del balance</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Los totales y deudas del grupo se mostrarán en esta divisa.
          </p>
          <select
            value={balanceCurrency}
            onChange={(e) => onChangeBalanceCurrency(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-[#334155] dark:bg-[#0F1623] dark:text-white"
          >
            {ALL_CURRENCIES.map((item) => (
              <option key={item.code} value={item.code}>{item.code} · {item.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
