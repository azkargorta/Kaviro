"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2 } from "lucide-react";

type PayInfo = {
  phase: string;
  phaseLabel: string;
  amountLabel: string;
  paid: boolean;
  tripName: string;
  travelerName: string;
  branding: { name: string; brandColor: string };
};

export default function PayPublicPage({ token, paidQuery }: { token: string; paidQuery?: boolean }) {
  const [info, setInfo] = useState<PayInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/pay/${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInfo(data);
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [token]);

  async function pay() {
    setPaying(true);
    setError("");
    try {
      const res = await fetch(`/api/pay/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Error");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!info) {
    return <p className="text-center text-sm text-red-600">{error || "Enlace no válido"}</p>;
  }

  const done = info.paid || paidQuery;

  return (
    <div className="mx-auto max-w-md">
      <header
        className="rounded-t-2xl px-6 py-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${info.branding.brandColor}, #0f2744)`,
        }}
      >
        <p className="text-xs uppercase tracking-wider opacity-80">{info.branding.name}</p>
        <h1 className="text-xl font-bold">{info.phaseLabel}</h1>
        <p className="mt-1 text-sm opacity-90">
          {info.tripName} · {info.travelerName}
        </p>
      </header>

      <div className="rounded-b-2xl border border-t-0 border-slate-200 bg-white p-6 shadow-sm text-center">
        {done ? (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 text-lg font-bold text-slate-900">Pago registrado</p>
            <p className="mt-2 text-sm text-slate-600">
              Gracias. {info.branding.name} confirmará tu plaza en el viaje.
            </p>
          </>
        ) : (
          <>
            <p className="text-3xl font-black text-slate-900">{info.amountLabel}</p>
            <p className="mt-2 text-sm text-slate-500">Pago seguro con tarjeta (Stripe)</p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              disabled={paying}
              onClick={() => void pay()}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-70"
              style={{ backgroundColor: info.branding.brandColor }}
            >
              {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              Pagar ahora
            </button>
          </>
        )}
      </div>
    </div>
  );
}
