"use client";

import { useIsDemoTrip } from "@/components/trip/TripDemoContext";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import ParticipantForm from "./ParticipantForm";
import InviteParticipantPanel from "./InviteParticipantPanel";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripTabActions from "@/components/trip/common/TripTabActions";
import {
  useTripParticipants,
  type TripParticipant,
  type TripRole,
} from "@/hooks/useTripParticipants";
import { useTripInvites } from "@/hooks/useTripInvites";
import { supabase } from "@/lib/supabase";
import ParticipantLinkProfilePanel from "./ParticipantLinkProfilePanel";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { iconSlotFill40 } from "@/components/ui/iconTokens";
import { btnPrimary } from "@/components/ui/brandStyles";
import { getRoleLabel, getStatusLabel } from "@/lib/participants";
import {
  Info,
  Link2,
  MessageCircle,
  Pencil,
  MoreHorizontal,
  Mail,
  Phone,
  User,
  RefreshCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  UserCheck,
  QrCode,
  X,
} from "lucide-react";

type TripParticipantsViewProps = {
  tripId: string;
  /** Rutas bajo `/trip/[id]/map/*`: pestañas del flujo «Rutas» en lugar de acciones de pantalla completa */
  mapFlow?: boolean;
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  if (parts.length === 1 && parts[0]!.length >= 2) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]?.[0] || "?").toUpperCase();
}

// Ge2 — Paleta hash determinista: mismo nombre → mismo color siempre
const AVATAR_PALETTE = [
  { bg: "bg-violet-200", text: "text-violet-900" },
  { bg: "bg-sky-200",    text: "text-sky-900"    },
  { bg: "bg-emerald-200",text: "text-emerald-900"},
  { bg: "bg-amber-200",  text: "text-amber-900"  },
  { bg: "bg-pink-200",   text: "text-pink-900"   },
  { bg: "bg-orange-200", text: "text-orange-900" },
  { bg: "bg-indigo-200", text: "text-indigo-900" },
  { bg: "bg-teal-200",   text: "text-teal-900"   },
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]!;
}

function roleStyle(role: string) {
  if (role === "owner") return "bg-violet-100 text-violet-800 border-violet-200";
  if (role === "editor") return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#1E293B] dark:text-slate-300 dark:border-[#334155]";
}

function KeyValueChip({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-semibold text-slate-700 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-200">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function ActionMenu({
  canInvite,
  onEdit,
  onInvite,
  onLink,
  onRemove,
}: {
  canInvite: boolean;
  onEdit: () => void;
  onInvite: () => void;
  onLink: () => void;
  onRemove: () => void;
}) {
  return (
    <details className="relative">
      <summary className="list-none">
        <span className="sr-only">Acciones</span>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
          <MoreHorizontal className="h-5 w-5" aria-hidden />
        </span>
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg dark:border-[#1E293B] dark:bg-[#0F1623]">
        <button
          type="button"
          onClick={() => {
            onEdit();
            (document.activeElement as HTMLElement | null)?.blur?.();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </button>
        {canInvite ? (
          <>
            <button
              type="button"
              onClick={() => {
                onInvite();
                (document.activeElement as HTMLElement | null)?.blur?.();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Invitar por WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                onLink();
                (document.activeElement as HTMLElement | null)?.blur?.();
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              Vincular cuenta
            </button>
          </>
        ) : null}
        <div className="my-1 h-px bg-slate-100 dark:bg-[#1E293B]" />
        <button
          type="button"
          onClick={() => {
            onRemove();
            (document.activeElement as HTMLElement | null)?.blur?.();
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Quitar
        </button>
      </div>
    </details>
  );
}

export default function TripParticipantsView({ tripId, mapFlow = false }: TripParticipantsViewProps) {
  const {
    participants,
    loading,
    error,
    addParticipant,
    updateParticipant,
    removeParticipant,
    searchProfiles,
    linkParticipantToProfile,
    refetch,
  } = useTripParticipants(tripId);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isLoadedUser, setIsLoadedUser] = useState(false);
  const [serverCanManageParticipants, setServerCanManageParticipants] = useState<boolean | null>(null);
  const [serverAccessLoaded, setServerAccessLoaded] = useState(false);

  const isDemoTrip = useIsDemoTrip();
  const [isCreating, setIsCreating] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const { createInvite, buildInviteUrl } = useTripInvites();

  useEffect(() => {
    if (isDemoTrip) setIsInviting(true);
  }, [isDemoTrip]);
  const [inviteParticipant, setInviteParticipant] = useState<TripParticipant | null>(null);
  const [editingParticipant, setEditingParticipant] = useState<TripParticipant | null>(null);
  const [linkingParticipant, setLinkingParticipant] = useState<TripParticipant | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | TripRole>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    if (isLoadedUser) return;
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user?.id ?? null);
      setCurrentUserEmail((data.session?.user?.email ?? null)?.toLowerCase() ?? null);
      setIsLoadedUser(true);
    });
  }, [isLoadedUser]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/trip-access?tripId=${encodeURIComponent(tripId)}`)
      .then((r) => r.json())
      .then((payload) => {
        if (cancelled) return;
        const can = Boolean(payload?.access?.canManageParticipants);
        setServerCanManageParticipants(can);
        setServerAccessLoaded(true);
      })
      .catch(() => {
        if (cancelled) return;
        setServerCanManageParticipants(null);
        setServerAccessLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => {
    if (!linkingParticipant) return;
    const row = participants.find((p) => p.id === linkingParticipant.id);
    if (row?.user_id) setLinkingParticipant(null);
  }, [linkingParticipant, participants]);

  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
  }, [participants]);

  const myParticipant = useMemo(() => {
    if (!participants.length) return null;

    if (currentUserId) {
      const byUserId = participants.find((p) => p.user_id === currentUserId) ?? null;
      if (byUserId) return byUserId;
    }

    if (currentUserEmail) {
      const byEmail =
        participants.find((p) => (p.email ? String(p.email).toLowerCase() : "") === currentUserEmail) ?? null;
      if (byEmail) return byEmail;
    }

    return null;
  }, [participants, currentUserId, currentUserEmail]);

  const canManageParticipants = Boolean(
    serverAccessLoaded
      ? serverCanManageParticipants
      : myParticipant?.role === "owner" || myParticipant?.can_manage_participants
  );

  const stats = useMemo(() => {
    const total = participants.length;
    const linked = participants.filter((p) => Boolean(p.user_id)).length;
    const unlinked = total - linked;
    return { total, linked, unlinked };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortedParticipants.filter((p) => {
      if (roleFilter !== "all" && p.role !== roleFilter) return false;
      if (linkFilter === "linked" && !p.user_id) return false;
      if (linkFilter === "unlinked" && p.user_id) return false;
      if (!q) return true;
      const hay = [
        p.display_name,
        p.username,
        p.email,
        p.phone,
        p.joined_via,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [sortedParticipants, query, linkFilter, roleFilter]);

  async function handleCreate(input: {
    trip_id: string;
    display_name?: string;
    username?: string | null;
    phone?: string | null;
    joined_via?: string | null;
    role?: TripRole;
  }) {
    setActionError(null);
    await addParticipant({
      trip_id: input.trip_id,
      display_name: input.display_name || "",
      username: input.username ?? null,
      phone: input.phone ?? null,
      joined_via: input.joined_via ?? "manual",
      user_id: null,
      role: input.role ?? "viewer",
    });
    setIsCreating(false);
  }

  async function handleUpdate(input: {
    trip_id: string;
    display_name?: string;
    username?: string | null;
    phone?: string | null;
    joined_via?: string | null;
    role?: TripRole;
  }) {
    if (!editingParticipant) return;
    setActionError(null);
    await updateParticipant(editingParticipant.id, {
      display_name: input.display_name,
      username: input.username ?? null,
      phone: input.phone ?? null,
      joined_via: input.joined_via ?? null,
      role: input.role,
    });
    setEditingParticipant(null);
  }

  async function handleRemove(id: string) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar este participante?");
    if (!confirmed) return;
    try {
      setActionError(null);
      await removeParticipant(id);
      if (editingParticipant?.id === id) setEditingParticipant(null);
      if (inviteParticipant?.id === id) {
        setInviteParticipant(null);
        setIsInviting(false);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  function openGenericInvite() {
    setEditingParticipant(null);
    setLinkingParticipant(null);
    setIsCreating(false);
    setInviteParticipant(null);
    setIsInviting((prev) => !prev);
  }

  async function handleCreateQr() {
    if (showQr && qrUrl) { setShowQr(false); setQrUrl(null); return; }
    setQrLoading(true);
    try {
      const invite = await createInvite({ trip_id: tripId, role: "viewer" });
      setQrUrl(buildInviteUrl(invite.token));
      setShowQr(true);
    } catch { /* silent */ }
    finally { setQrLoading(false); }
  }

  function openParticipantInvite(participant: TripParticipant) {
    setEditingParticipant(null);
    setLinkingParticipant(null);
    setIsCreating(false);
    setInviteParticipant(participant);
    setIsInviting(true);
  }

  function openLinkProfile(participant: TripParticipant) {
    setInviteParticipant(null);
    setIsInviting(false);
    setIsCreating(false);
    setEditingParticipant(null);
    setLinkingParticipant((prev) => (prev?.id === participant.id ? null : participant));
  }

  if (loading) {
    return (
      <main className="space-y-6">
        <div className="h-40 animate-pulse rounded-3xl bg-gradient-to-r from-[#FEF2F2] via-white to-[#FECACA]" />
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#1E293B]" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 dark:bg-[#1E293B]" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded-xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] dark:border-[#1E293B] dark:bg-[#0F1623] px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          Reintentar
        </button>
      </main>
    );
  }

  return (
    <main className="min-w-0 max-w-full space-y-8 overflow-x-hidden">
      <TripBoardPageHeader
        section="Pasajeros del viaje"
        title="Participantes"
        description="Añade compañeros, envía invitaciones por WhatsApp para que vinculen su cuenta y evita duplicados buscando su perfil."
        iconKey="participants"
        iconAlt="Participantes"
        actions={mapFlow ? <TripTabActions tripId={tripId} /> : <TripScreenActions tripId={tripId} />}
      />

      {/* Ge1 — 3 stat cards con número grande como protagonista */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-[#1E293B] text-slate-600 dark:text-slate-300">
              <Users className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
              <p className="text-3xl font-extrabold leading-none text-slate-950 tabular-nums">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-[#0F1623]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Con cuenta</p>
              <p className="text-3xl font-extrabold leading-none text-emerald-700 tabular-nums">{stats.linked}</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm dark:border-amber-900/40 dark:bg-[#0F1623]">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pendientes</p>
              <p className="text-3xl font-extrabold leading-none text-amber-700 tabular-nums">{stats.unlinked}</p>
            </div>
          </div>
        </div>
      </div>

      {actionError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
      ) : null}

      {serverAccessLoaded && !canManageParticipants ? (
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-5 py-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 ${iconSlotFill40}`}
            >
              <Info aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-amber-950">Vista de solo lectura</p>
              <p className="text-sm text-amber-900/80">
                Solo el <span className="font-semibold">owner</span> o quien tenga permiso explícito de{" "}
                <span className="font-semibold">gestionar participantes</span> puede añadir, editar o invitar. Si
                necesitas cambios, pídeselo a quien administra el viaje.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lista de pasajeros</h2>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre, @usuario, email o teléfono…"
                className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-[var(--brand-border)] transition focus:border-[var(--brand)] focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
              />
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-2 text-sm font-extrabold text-slate-950">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-[#334155] dark:bg-[#1E293B] dark:text-slate-300">
                <SlidersHorizontal className="h-4 w-4" aria-hidden />
              </span>
              Filtros
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 py-2 text-xs font-semibold text-[var(--brand-text)] shadow-sm transition hover:border-[var(--brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-border)]"
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? "Ocultar filtros" : "Mostrar filtros"}
            </button>
          </div>

          {filtersOpen ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  { id: "all" as const, label: "Todos" },
                  { id: "linked" as const, label: "Con cuenta" },
                  { id: "unlinked" as const, label: "Sin vincular" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setLinkFilter(chip.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    linkFilter === chip.id
                      ? "border-violet-300 bg-violet-50 text-violet-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300 dark:hover:bg-[#1E293B]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:inline-block" aria-hidden />
              {(
                [
                  { id: "all" as const, label: "Todos los roles" },
                  { id: "owner" as const, label: "Owner" },
                  { id: "editor" as const, label: "Editor" },
                  { id: "viewer" as const, label: "Lector" },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setRoleFilter(chip.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                    roleFilter === chip.id
                      ? "border-sky-300 bg-sky-50 text-sky-900"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623] dark:text-slate-300 dark:hover:bg-[#1E293B]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {sortedParticipants.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center dark:border-[#334155] dark:bg-[#080C14]">
            <Users className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-base font-semibold text-slate-800">Aún no hay pasajeros</p>
            <p className="mt-1 text-sm text-slate-500">
              Cuando tengas permiso de gestión, podrás añadir manualmente o enviar una invitación por WhatsApp.
            </p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-600">
            No hay resultados con estos filtros. Prueba a limpiar la búsqueda o cambiar el filtro de vinculación.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredParticipants.map((participant) => {
              const isLinkedUser = Boolean(participant.user_id);
              const canInviteThisParticipant = !isLinkedUser;
              const isYou = Boolean(currentUserId && participant.user_id === currentUserId);

              return (
                <article
                  key={participant.id}
                  className={`group rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                    isYou ? "border-[var(--brand-border)] ring-1 ring-[var(--brand-border)]" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {/* Ge2 — Avatar with deterministic hash color */}
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold shadow-sm ${avatarColor(participant.display_name || "?").bg} ${avatarColor(participant.display_name || "?").text}`}
                      >
                        {initials(participant.display_name || "?")}
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="min-w-0 max-w-full text-base font-extrabold text-slate-900" role="heading" aria-level={3}>
                            <LongTextSheet
                              text={participant.display_name}
                              modalTitle="Participante"
                              minLength={36}
                              lineClamp={2}
                              className="font-extrabold text-slate-900"
                            />
                          </div>
                          {isYou ? (
                            <span className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--brand-text)]">
                              Tú
                            </span>
                          ) : null}
                          {/* Ge3 — Role badge with icon */}
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleStyle(participant.role)}`}>
                            {participant.role === "owner" && <span aria-hidden>👑</span>}
                            {participant.role === "editor" && <span aria-hidden>✏️</span>}
                            {participant.role === "viewer" && <span aria-hidden>👁️</span>}
                            {getRoleLabel(participant.role)}
                          </span>
                          {/* Ge5 — Pending state with tooltip */}
                          {isLinkedUser ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                              <span aria-hidden>✓</span> Cuenta vinculada
                            </span>
                          ) : (
                            <span
                              className="inline-flex cursor-help items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-900"
                              title="Esta persona aún no ha iniciado sesión en Kaviro. Envíale el enlace de invitación por WhatsApp para que vincule su cuenta."
                            >
                              <span aria-hidden>⏳</span> Pendiente de vincular
                            </span>
                          )}
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {getStatusLabel(participant.status as "active" | "pending" | "removed")}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {participant.username ? (
                            <KeyValueChip icon={<User className="h-3.5 w-3.5" aria-hidden />} label={`@${participant.username}`} />
                          ) : null}
                          {participant.email ? (
                            <KeyValueChip icon={<Mail className="h-3.5 w-3.5" aria-hidden />} label={participant.email} />
                          ) : null}
                          {participant.phone ? (
                            <KeyValueChip icon={<Phone className="h-3.5 w-3.5" aria-hidden />} label={participant.phone} />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {canManageParticipants ? (
                      <div className="flex items-start justify-end">
                        <ActionMenu
                          canInvite={canInviteThisParticipant}
                          onEdit={() => setEditingParticipant(participant)}
                          onInvite={() => openParticipantInvite(participant)}
                          onLink={() => openLinkProfile(participant)}
                          onRemove={() => void handleRemove(participant.id)}
                        />
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </section>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          {canManageParticipants ? (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-extrabold text-slate-950">Control de pasajeros</div>
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCcw className="h-4 w-4" aria-hidden />
                  Recargar
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  data-tour="participants-add-btn"
                  type="button"
                  onClick={() => {
                    setEditingParticipant(null);
                    setInviteParticipant(null);
                    setIsInviting(false);
                    setLinkingParticipant(null);
                    setIsCreating((prev) => !prev);
                  }}
                  className={`${btnPrimary} inline-flex items-center gap-2 px-4 py-2.5 text-sm`}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {isCreating ? "Cerrar" : "Añadir pasajero"}
                </button>
                <button
                  data-tour="participants-invite-btn"
                  type="button"
                  onClick={openGenericInvite}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                  {isInviting && !inviteParticipant ? "Cerrar invitación" : "Invitar por WhatsApp"}
                </button>
                <button
                  data-tour="participants-qr-btn"
                  type="button"
                  onClick={handleCreateQr}
                  disabled={qrLoading}
                  className="col-span-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-light)] px-4 py-2.5 text-sm font-semibold text-[var(--brand-text)] shadow-sm transition hover:border-[var(--brand)] disabled:opacity-50"
                >
                  <QrCode className="h-4 w-4" aria-hidden />
                  {qrLoading ? "Generando QR..." : showQr ? "Ocultar QR" : "Crear QR de invitación"}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Envía un enlace único por WhatsApp o genera un QR para escanear en el momento.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4 text-sm text-slate-600 shadow-sm">
              <p className="font-semibold text-slate-900">Solo lectura</p>
              <p className="mt-1">
                No tienes permisos para gestionar pasajeros en este viaje.
              </p>
            </div>
          )}

          {canManageParticipants && showQr && qrUrl ? (
            <div data-tour="participants-qr" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623]">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <p className="text-sm font-extrabold text-slate-900 dark:text-white">QR de invitación</p>
                  <p className="text-xs text-slate-500 mt-0.5">Escanea para unirte al viaje</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowQr(false); setQrUrl(null); }}
                  className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50"
                  aria-label="Cerrar QR"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0f172a&margin=8`}
                  alt="QR de invitación al viaje"
                  width={200}
                  height={200}
                  unoptimized
                  className="rounded-2xl border border-slate-100 shadow-sm dark:hidden"
                />
                <Image
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=0f1623&color=f1f5f9&margin=8`}
                  alt="QR de invitación al viaje"
                  width={200}
                  height={200}
                  unoptimized
                  className="rounded-2xl border border-[#1E293B] shadow-sm hidden dark:block"
                />
                <p className="text-center text-xs text-slate-400 leading-snug max-w-[200px]">
                  Muéstralo en pantalla para que cualquier persona del grupo pueda escanear y unirse al instante.
                </p>
              </div>
            </div>
          ) : null}

          {canManageParticipants && isInviting ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-1 shadow-sm">
              <InviteParticipantPanel
                tripId={tripId}
                participant={inviteParticipant}
                onCreated={() => {
                  setIsInviting(false);
                  setInviteParticipant(null);
                }}
                onCancel={() => {
                  setIsInviting(false);
                  setInviteParticipant(null);
                }}
              />
            </div>
          ) : null}

          {canManageParticipants && isCreating ? (
            <ParticipantForm
              tripId={tripId}
              onSubmit={handleCreate}
              onCancel={() => setIsCreating(false)}
              submitLabel="Añadir participante"
            />
          ) : null}

          {canManageParticipants && editingParticipant ? (
            <ParticipantForm
              tripId={tripId}
              initialData={editingParticipant}
              onSubmit={handleUpdate}
              onCancel={() => setEditingParticipant(null)}
              submitLabel="Guardar cambios"
            />
          ) : null}

          {canManageParticipants && linkingParticipant ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/40 p-1 shadow-sm">
              <ParticipantLinkProfilePanel
                participant={linkingParticipant}
                onSearchProfiles={searchProfiles}
                onLinkProfile={async (profile) => {
                  setActionError(null);
                  try {
                    await linkParticipantToProfile(linkingParticipant.id, profile);
                    setLinkingParticipant(null);
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : "No se pudo vincular el usuario.");
                  }
                }}
              />
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  );
}
