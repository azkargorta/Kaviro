"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Mail, Trash2, UserPlus, Users } from "lucide-react";
import { AGENCY_PARTNERSHIP_EMAIL, agencyPartnershipMailto, KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import {
  agencyBtnPrimaryClass,
  agencyBtnSecondaryClass,
  agencyCardClass,
  agencyInputClass,
  agencyLabelClass,
  agencyPageSubtitleClass,
  agencyPageTitleClass,
} from "@/lib/agency-theme";
import { useToast } from "@/components/ui/toast";

type Member = {
  userId: string;
  role: string;
  displayName: string;
  email: string | null;
  isOwner: boolean;
};

type PendingInvite = {
  id: string;
  email: string;
  role: string;
  inviteUrl: string;
  expiresAt: string;
};

type Props = {
  agencyName: string;
  yourRole: string;
};

export default function AgencyTeamPanel({ agencyName, yourRole }: Props) {
  const toast = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [maxMembers, setMaxMembers] = useState(3);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "admin">("editor");
  const [inviting, setInviting] = useState(false);
  const isAdmin = yourRole === "admin";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, invRes] = await Promise.all([
        fetch("/api/agencies/team", { cache: "no-store" }),
        fetch("/api/agencies/invites", { cache: "no-store" }),
      ]);
      const team = await teamRes.json();
      const inv = await invRes.json();
      if (teamRes.ok) {
        setMembers(team.members ?? []);
        setMaxMembers(team.maxMembers ?? 3);
      }
      if (invRes.ok) setInvites(inv.invites ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setInviting(true);
    try {
      const res = await fetch("/api/agencies/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo invitar.");
      setEmail("");
      if (data.emailSent) {
        toast.push({
          kind: "success",
          title: "Invitación enviada por email",
          description: `Correo enviado a ${data.email}.`,
        });
      } else {
        toast.push({
          kind: "success",
          title: "Invitación creada",
          description:
            data.emailError ||
            "No se pudo enviar el email. Copia el enlace desde la lista de pendientes.",
        });
        if (data.inviteUrl) await navigator.clipboard.writeText(data.inviteUrl);
      }
      load();
    } catch (err) {
      toast.push({ kind: "error", title: err instanceof Error ? err.message : "Error" });
    } finally {
      setInviting(false);
    }
  }

  async function revokeInvite(id: string) {
    const res = await fetch(`/api/agencies/invites?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) load();
  }

  async function resendInvite(id: string) {
    try {
      const res = await fetch("/api/agencies/invites/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo reenviar.");
      toast.push({
        kind: data.emailSent ? "success" : "error",
        title: data.emailSent ? "Email reenviado" : "No se envió el email",
        description: data.emailError,
      });
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Equipo</h1>
        <p className={agencyPageSubtitleClass}>
          Personas con acceso al panel de <strong>{agencyName}</strong>. Tu rol:{" "}
          <span className="font-semibold">{yourRole}</span>. Cupo acordado:{" "}
          <span className="font-semibold">{maxMembers}</span> perfiles.
        </p>
      </div>

      {isAdmin ? (
        <form onSubmit={handleInvite} className={`${agencyCardClass} space-y-3 p-5`}>
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <UserPlus className="h-4 w-4" aria-hidden />
            Invitar por email
          </h2>
          <p className="text-xs text-slate-500">
            Se envía un correo con el enlace de acceso (requiere RESEND_API_KEY en el servidor).
          </p>
          <div>
            <label className={agencyLabelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={agencyInputClass}
              placeholder="colega@agencia.com"
              required
            />
          </div>
          <div>
            <label className={agencyLabelClass}>Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "editor" | "admin")}
              className={agencyInputClass}
            >
              <option value="editor">Editor (viajes)</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button type="submit" disabled={inviting} className={agencyBtnPrimaryClass}>
            {inviting ? "Enviando…" : "Enviar invitación"}
          </button>
        </form>
      ) : null}

      {invites.length > 0 ? (
        <div className={`${agencyCardClass} p-5`}>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Invitaciones pendientes</p>
          <ul className="mt-3 space-y-3">
            {invites.map((inv) => (
              <li key={inv.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-600">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{inv.email}</p>
                <p className="text-xs text-slate-500">{inv.role}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
                    onClick={() => resendInvite(inv.id)}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Reenviar email
                  </button>
                  <button
                    type="button"
                    className={`${agencyBtnSecondaryClass} gap-1 text-xs`}
                    onClick={() => navigator.clipboard.writeText(inv.inviteUrl)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copiar enlace
                  </button>
                  {isAdmin ? (
                    <button
                      type="button"
                      className={`${agencyBtnSecondaryClass} gap-1 text-xs text-red-700`}
                      onClick={() => revokeInvite(inv.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Revocar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${agencyCardClass} p-5`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Users className="h-4 w-4" aria-hidden />
            Miembros ({members.length}/{maxMembers})
          </h2>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Cargando…</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
            {members.map((m) => (
              <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {m.displayName}
                    {m.isOwner ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">(propietario)</span>
                    ) : null}
                  </p>
                  {m.email ? <p className="text-xs text-slate-500">{m.email}</p> : null}
                </div>
                <span className="rounded-full bg-[#1e3a5f]/10 px-2.5 py-0.5 text-xs font-bold uppercase text-[#1e3a5f] dark:bg-sky-900/30 dark:text-sky-200">
                  {m.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Para ampliar el cupo de perfiles o condiciones comerciales:{" "}
        <a href={agencyPartnershipMailto()} className="font-semibold text-[#1e3a5f] dark:text-sky-300">
          {AGENCY_PARTNERSHIP_EMAIL}
        </a>
      </p>
    </div>
  );
}
