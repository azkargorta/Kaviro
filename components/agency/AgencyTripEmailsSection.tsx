"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Send } from "lucide-react";
import {
  AGENCY_EMAIL_EVENT_LABELS,
  type AgencyEmailEvent,
  type EmailAutomationSettings,
} from "@/lib/agency/email-events";
import { agencyBtnPrimaryClass, agencyBtnSecondaryClass } from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type LogRow = {
  id: string;
  event_type: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
  created_at: string;
};

type EventMeta = { id: AgencyEmailEvent; label: string; description: string };

export default function AgencyTripEmailsSection({ tripId }: { tripId: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [resendConfigured, setResendConfigured] = useState(true);
  const [settings, setSettings] = useState<EmailAutomationSettings | null>(null);
  const [events, setEvents] = useState<EventMeta[]>([]);
  const [log, setLog] = useState<LogRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/emails`, { cache: "no-store" });
      const data = await res.json();
      if (data.needsMigration) {
        setNeedsMigration(true);
        return;
      }
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      setResendConfigured(Boolean(data.resendConfigured));
      setEvents(data.events ?? []);
      setLog(data.recentLog ?? []);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [tripId, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveSettings(next: EmailAutomationSettings) {
    setSettings(next);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/emails`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
      void load();
    }
  }

  async function sendEvent(event: AgencyEmailEvent) {
    setBusy(event);
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType: event, origin: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.noRecipients) {
        toast.push({ kind: "info", title: "Nadie pendiente con email para este envío" });
      } else {
        toast.push({
          kind: "success",
          title: `Enviados: ${data.sent}${data.skipped ? ` · omitidos (24h): ${data.skipped}` : ""}${data.failed ? ` · fallos: ${data.failed}` : ""}`,
        });
      }
      await load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(null);
    }
  }

  async function sendAll() {
    setBusy("all");
    try {
      const res = await fetch(`/api/agencies/trips/${tripId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sendAll: true, origin: window.location.origin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.push({ kind: "success", title: "Envío masivo completado" });
      await load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />;
  if (needsMigration) {
    return (
      <p className="text-sm text-amber-800">
        Ejecuta <code>docs/kaviro_agency_emails.sql</code> en Supabase y configura <code>RESEND_API_KEY</code> en Vercel.
      </p>
    );
  }

  if (!settings) return null;

  const toggles: { key: keyof EmailAutomationSettings; event: AgencyEmailEvent; label: string }[] = [
    { key: "remindDeposit", event: "deposit_reminder", label: "Recordatorio señal" },
    { key: "remindFinal", event: "final_reminder", label: "Recordatorio pago final" },
    { key: "pretravelInvite", event: "pretravel_invite", label: "Encuesta pre-viaje" },
    { key: "npsInvite", event: "nps_invite", label: "NPS post-viaje" },
    { key: "signatureInvite", event: "signature_invite", label: "Firma de documento" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Envía enlaces por email (Resend) a viajeros con email en ficha. No se reenvía al mismo destinatario en 24 h.
      </p>

      {!resendConfigured ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <code>RESEND_API_KEY</code> no está en el servidor: puedes copiar enlaces manualmente en Cobros / Encuestas.
        </p>
      ) : null}

      <div className="space-y-2">
        {toggles.map((t) => {
          const meta = events.find((e) => e.id === t.event);
          return (
            <div
              key={t.key}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800"
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings[t.key]}
                  onChange={(e) => void saveSettings({ ...settings, [t.key]: e.target.checked })}
                />
                <span className="font-medium text-slate-900 dark:text-white">{t.label}</span>
              </label>
              <div className="flex items-center gap-2">
                {meta?.description ? (
                  <span className="hidden text-xs text-slate-500 sm:inline max-w-[12rem] truncate" title={meta.description}>
                    {meta.description}
                  </span>
                ) : null}
                <button
                  type="button"
                  disabled={!resendConfigured || busy !== null}
                  onClick={() => void sendEvent(t.event)}
                  className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1 text-[10px]`}
                >
                  {busy === t.event ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Enviar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {resendConfigured ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void sendAll()}
          className={`${agencyBtnPrimaryClass} gap-1.5`}
        >
          {busy === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Enviar todo lo activado
        </button>
      ) : null}

      {log.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Últimos envíos</p>
          <ul className="max-h-40 overflow-y-auto text-xs text-slate-600 divide-y divide-slate-100 dark:divide-slate-800">
            {log.map((row) => (
              <li key={row.id} className="py-1.5 flex justify-between gap-2">
                <span>
                  {AGENCY_EMAIL_EVENT_LABELS[row.event_type as AgencyEmailEvent] ?? row.event_type} →{" "}
                  {row.recipient_email}
                </span>
                <span
                  className={
                    row.status === "sent"
                      ? "text-emerald-600"
                      : row.status === "skipped"
                        ? "text-slate-400"
                        : "text-red-600"
                  }
                >
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
