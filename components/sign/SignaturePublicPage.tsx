"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import SignaturePad from "@/components/sign/SignaturePad";

type DocInfo = {
  signed: boolean;
  signerName: string | null;
  travelerLabel: string | null;
  tripName: string;
  document: { title: string; bodyText: string };
  branding: { name: string; brandColor: string };
};

export default function SignaturePublicPage({ token }: { token: string }) {
  const [info, setInfo] = useState<DocInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/sign/${token}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setInfo(data);
          if (data.signerName) setName(data.signerName);
          setDone(data.signed);
        }
      })
      .catch(() => setError("Error al cargar"))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("Debes marcar que has leído y aceptas el documento.");
      return;
    }
    if (!signature) {
      setError("Dibuja tu firma en el recuadro.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent: true, signatureDataUrl: signature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
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

  const color = info.branding.brandColor;

  if (done) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">Documento firmado</h1>
        <p className="mt-2 text-sm text-slate-600">
          {info.branding.name} ha registrado tu firma para {info.tripName}.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header
        className="rounded-t-2xl px-6 py-5 text-white"
        style={{ background: `linear-gradient(135deg, ${color}, #0f2744)` }}
      >
        <p className="text-xs uppercase tracking-wider opacity-80">{info.branding.name}</p>
        <h1 className="text-xl font-bold">{info.document.title}</h1>
        <p className="mt-1 text-sm opacity-90">
          {info.tripName}
          {info.travelerLabel ? ` · ${info.travelerLabel}` : ""}
        </p>
      </header>

      <form
        onSubmit={(e) => void submit(e)}
        className="space-y-4 rounded-b-2xl border border-t-0 border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="max-h-48 overflow-y-auto rounded-lg bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap dark:bg-slate-800 dark:text-slate-300">
          {info.document.bodyText}
        </div>

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <span>He leído el documento y acepto sus condiciones.</span>
        </label>

        <div>
          <label className="block text-xs font-semibold text-slate-600">Nombre completo</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600">Email (opcional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600">Firma manuscrita</p>
          <SignaturePad onChange={setSignature} disabled={submitting} />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white disabled:opacity-70"
          style={{ backgroundColor: color }}
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          Firmar documento
        </button>
      </form>
    </div>
  );
}
