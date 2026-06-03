"use client";

import { useState } from "react";
import { AGENCY_PARTNERSHIP_EMAIL, agencyPartnershipMailto } from "@/lib/brand";
import { ArrowRight, Loader2, Mail } from "lucide-react";

type Status = "idle" | "loading" | "success" | "error";

export default function EmpresaContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name") ?? ""),
      agencyName: String(fd.get("agencyName") ?? ""),
      email: String(fd.get("email") ?? ""),
      groupsPerYear: String(fd.get("groupsPerYear") ?? ""),
      message: String(fd.get("message") ?? ""),
    };

    try {
      const res = await fetch("/api/contact/agency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "No se pudo enviar. Inténtalo de nuevo.");
        return;
      }
      setStatus("success");
      form.reset();
    } catch {
      setStatus("error");
      setErrorMsg("Error de conexión. Comprueba tu red e inténtalo de nuevo.");
    }
  }

  if (status === "success") {
    return (
      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-8 text-center">
        <p className="text-base font-semibold text-white">Solicitud enviada</p>
        <p className="mt-2 text-sm text-slate-300">
          Te responderemos en menos de 24 horas a tu email.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-sky-400 underline hover:text-sky-300"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4 text-left">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold text-slate-400">Nombre</span>
          <input
            name="name"
            required
            minLength={2}
            autoComplete="name"
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            placeholder="Tu nombre"
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-slate-400">Nombre de la agencia</span>
          <input
            name="agencyName"
            required
            minLength={2}
            className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
            placeholder="Ej. Stripes Sports Trips"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-xs font-semibold text-slate-400">Email de contacto</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          placeholder="tu@agencia.com"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-400">Grupos aproximados al año (opcional)</span>
        <input
          name="groupsPerYear"
          className="mt-1.5 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          placeholder="Ej. 8–12 viajes de grupo"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold text-slate-400">Mensaje (opcional)</span>
        <textarea
          name="message"
          rows={3}
          className="mt-1.5 w-full resize-y rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none focus:ring-1 focus:ring-sky-500/40"
          placeholder="Tipo de viajes, tamaño de equipo, etc."
        />
      </label>

      {status === "error" && errorMsg ? (
        <p className="text-sm text-red-300" role="alert">
          {errorMsg}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#1e3a5f] shadow-lg transition hover:bg-slate-100 disabled:opacity-70 sm:w-auto"
      >
        {status === "loading" ? (
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        ) : (
          <Mail className="h-5 w-5" aria-hidden />
        )}
        Enviar solicitud
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>

      <p className="text-center text-xs text-slate-500 sm:text-left">
        También puedes escribir a{" "}
        <a href={agencyPartnershipMailto()} className="font-medium text-sky-400 underline hover:text-sky-300">
          {AGENCY_PARTNERSHIP_EMAIL}
        </a>
      </p>
    </form>
  );
}
