"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTripInvites } from "@/hooks/useTripInvites";
import type { TripRole, TripParticipant } from "@/hooks/useTripParticipants";
import { useToast } from "@/components/ui/toast";
import { btnPrimary } from "@/components/ui/brandStyles";
import { MessageCircle, Copy, Check, X, UserPlus2 } from "lucide-react";

type InviteParticipantPanelProps = {
  tripId: string;
  participant?: TripParticipant | null;
  onCreated?: () => void;
  onCancel?: () => void;
};

export default function InviteParticipantPanel({
  tripId,
  participant,
  onCreated,
  onCancel,
}: InviteParticipantPanelProps) {
  const { createInvite, buildInviteUrl, loading, error } = useTripInvites();
  const toast = useToast();

  const [displayName, setDisplayName] = useState(participant?.display_name ?? "");
  const [phone, setPhone] = useState(participant?.phone ?? "");
  const [role, setRole] = useState<TripRole>(participant?.role ?? "viewer");
  const [inviteUrl, setInviteUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDisplayName(participant?.display_name ?? "");
    setPhone(participant?.phone ?? "");
    setRole(participant?.role ?? "viewer");
    setInviteUrl("");
    setCopied(false);
  }, [participant?.id]);

  const title = participant
    ? `Invitar a ${participant.display_name} por WhatsApp`
    : "Invitación por WhatsApp";

  const description = participant
    ? "Genera un enlace personal para esta persona. Al abrirlo podrá registrarse o iniciar sesión y quedará vinculada al viaje."
    : "Crea un enlace de invitación y compártelo por WhatsApp.";

  const whatsappHref = useMemo(() => {
    if (!inviteUrl) return "";

    const cleanedPhone = phone.replace(/[^\d]/g, "");
    if (!cleanedPhone) return "";

    const personLabel = displayName.trim() || "Te";
    const text = participant
      ? `Hola ${personLabel}. Te paso tu enlace para unirte al viaje en Kaviro y vincular tu usuario: ${inviteUrl}`
      : `¡Hola! Te invito a unirte a mi viaje en Kaviro. Usa este enlace: ${inviteUrl}`;

    return `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(text)}`;
  }, [phone, inviteUrl, displayName, participant]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);

    const invite = await createInvite({
      trip_id: tripId,
      participant_id: participant?.id ?? null,
      display_name: displayName.trim() || null,
      role,
    });

    const url = buildInviteUrl(invite.token);
    setInviteUrl(url);
  }

  async function copyLink() {
    if (!inviteUrl) return;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Enlace copiado", "Ya puedes pegarlo donde quieras.");
    } catch {
      toast.error("No se pudo copiar", "Tu navegador bloqueó el portapapeles. Copia el enlace manualmente.");
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:to-[#0F1623]">
      <div className="flex items-start gap-3 border-b border-emerald-200/60 bg-emerald-500 px-5 py-4 dark:border-emerald-800/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/30 text-white">
          <MessageCircle className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-extrabold text-white">{title}</h2>
          <p className="mt-0.5 text-xs font-semibold text-emerald-100">{description}</p>
        </div>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Nombre visible
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ej. Ceci"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Teléfono WhatsApp
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ej. 34600111222 (con prefijo país)"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Rol inicial
          </span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TripRole)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
          >
            <option value="viewer">Lector</option>
            <option value="editor">Editor</option>
            <option value="owner">Owner</option>
          </select>
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            type="submit"
            disabled={loading}
            className={`${btnPrimary} inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 text-sm disabled:opacity-60 sm:w-auto`}
          >
            <UserPlus2 className="h-4 w-4" aria-hidden />
            {loading ? "Creando…" : "Generar enlace de invitación"}
          </button>

          {inviteUrl ? (
            <>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-200 dark:hover:bg-[#1E293B]"
              >
                {copied ? <Check className="h-4 w-4 text-emerald-600" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                {copied ? "Copiado" : "Copiar enlace"}
              </button>
              <a
                href={whatsappHref || "#"}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                  whatsappHref
                    ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                    : "pointer-events-none border-slate-200 bg-white text-slate-400 opacity-60 dark:border-[#334155] dark:bg-[#0F1623]"
                }`}
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Abrir WhatsApp
              </a>
            </>
          ) : null}
        </div>

        {inviteUrl ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 break-all dark:border-[#1E293B] dark:bg-[#080C14] dark:text-slate-300">
              {inviteUrl}
            </div>
            {/* QR code — escanear para unirse en móvil */}
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                Escanear para unirse
              </p>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteUrl)}&bgcolor=ffffff&color=0f172a&margin=8`}
                alt="QR de invitación"
                width={160}
                height={160}
                unoptimized
                className="rounded-xl dark:hidden"
              />
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(inviteUrl)}&bgcolor=0f1623&color=f1f5f9&margin=8`}
                alt="QR de invitación"
                width={160}
                height={160}
                unoptimized
                className="rounded-xl hidden dark:block"
              />
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Abre la cámara y apunta al código</p>
            </div>
          </>
        ) : null}

        {inviteUrl && onCreated ? (
          <button
            type="button"
            onClick={onCreated}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            <Check className="h-4 w-4" aria-hidden />
            Listo
          </button>
        ) : null}
      </form>

      {error ? (
        <div className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}
    </div>
  );
}
