"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ParticipantForm, { type ParticipantFormValues } from "./ParticipantForm";
import InviteParticipantPanel from "./InviteParticipantPanel";
import TravelMatesInvitePanel from "./TravelMatesInvitePanel";
import UsernameInvitePanel from "./UsernameInvitePanel";
import BulkImportParticipantsPanel from "./BulkImportParticipantsPanel";
import UserAvatar from "@/components/profile/UserAvatar";
import TripScreenActions from "@/components/trip/common/TripScreenActions";
import TripTabActions from "@/components/trip/common/TripTabActions";
import {
  useTripParticipants,
  type TripParticipant,
  type TripRole,
} from "@/hooks/useTripParticipants";
import { supabase } from "@/lib/supabase";
import ParticipantLinkProfilePanel from "./ParticipantLinkProfilePanel";
import TripBoardPageHeader from "@/components/layout/TripBoardPageHeader";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import LongTextSheet from "@/components/ui/LongTextSheet";
import { iconSlotFill40 } from "@/components/ui/iconTokens";
import { btnPrimary } from "@/components/ui/brandStyles";
import Reveal from "@/components/ui/Reveal";
import type { RevealDelay } from "@/components/ui/Reveal";
import { SkeletonCard } from "@/components/ui/Skeleton";
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
  FileSpreadsheet,
  GitMerge,
} from "lucide-react";
import MobileBottomSheet from "@/components/ui/MobileBottomSheet";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  onMerge,
  onRemove,
}: {
  canInvite: boolean;
  onEdit: () => void;
  onInvite: () => void;
  onLink: () => void;
  onMerge: () => void;
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
          onClick={(e) => {
            e.preventDefault();
            onEdit();
            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        >
          <Pencil className="h-4 w-4" aria-hidden />
          Editar
        </button>
        {canInvite ? (
          <>
            <button
              data-tour="participants-invite-btn"
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onInvite();
                (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
              Invitar por WhatsApp
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onLink();
                (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-50"
            >
              <Link2 className="h-4 w-4" aria-hidden />
              Vincular cuenta
            </button>
          </>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onMerge();
            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
        >
          <GitMerge className="h-4 w-4" aria-hidden />
          Fusionar nombre en gastos
        </button>
        <div className="my-1 h-px bg-slate-100 dark:bg-[#1E293B]" />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onRemove();
            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
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
  const { isAgencyTrip } = useTripWorkspace();
  const isMobile = useIsMobile();
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

  const [isCreating, setIsCreating] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<TripParticipant | null>(null);
  /** Un solo panel lateral activo: invitar (WhatsApp) o vincular cuenta (nunca ambos). */
  const [asidePanel, setAsidePanel] = useState<"none" | "invite" | "link">("none");
  const [asideParticipant, setAsideParticipant] = useState<TripParticipant | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [linkFilter, setLinkFilter] = useState<"all" | "linked" | "unlinked">("all");
  const [roleFilter, setRoleFilter] = useState<"all" | TripRole>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  type MobileParticipantsPanel = null | "menu" | "form" | "invite" | "link" | "import";
  const [mobilePanel, setMobilePanel] = useState<MobileParticipantsPanel>(null);

  // Modal de fusión de nombre en gastos
  type MergeState = { participantName: string; selectedAlias: string; expenseNames: string[]; loading: boolean; saving: boolean; done: number | null; error: string | null };
  const [mergeState, setMergeState] = useState<MergeState | null>(null);
  const participantFormRef = useRef<HTMLDivElement | null>(null);
  const asidePanelRef = useRef<HTMLDivElement | null>(null);

  const showParticipantForm = Boolean(isCreating || editingParticipant);

  useEffect(() => {
    if (!showParticipantForm || isMobile) return;
    const t = window.setTimeout(() => {
      participantFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [showParticipantForm, editingParticipant?.id, isMobile]);

  useEffect(() => {
    if (isMobile && showParticipantForm) setMobilePanel("form");
  }, [isMobile, showParticipantForm]);

  useEffect(() => {
    if (asidePanel === "none") return;
    const t = window.setTimeout(() => {
      asidePanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [asidePanel, asideParticipant?.id]);

  function closeAsidePanel() {
    setAsidePanel("none");
    setAsideParticipant(null);
  }

  async function openMergeDialog(participantName: string) {
    if (!participantName) return;
    setMergeState({ participantName, selectedAlias: "", expenseNames: [], loading: true, saving: false, done: null, error: null });
    try {
      const res = await fetch(`/api/trip-expenses?tripId=${encodeURIComponent(tripId)}`);
      if (!res.ok) throw new Error("No se pudieron cargar los gastos");
      const data = await res.json();
      const expenses = Array.isArray(data.expenses) ? data.expenses : [];
      const settlements = Array.isArray(data.settlements) ? data.settlements : [];
      const names = new Set<string>();
      for (const e of expenses) {
        if (e.payer_name) names.add(e.payer_name);
        if (Array.isArray(e.participant_names)) e.participant_names.forEach((n: string) => names.add(n));
        if (Array.isArray(e.paid_by_names)) e.paid_by_names.forEach((n: string) => names.add(n));
        if (Array.isArray(e.owed_by_names)) e.owed_by_names.forEach((n: string) => names.add(n));
      }
      for (const s of settlements) {
        if (s.debtor_name) names.add(s.debtor_name);
        if (s.creditor_name) names.add(s.creditor_name);
      }
      // Excluir el propio nombre del participante y los nombres actuales de Gente
      const currentParticipantNames = new Set(
        participants.map((p) => (p.display_name || "").trim().toLowerCase()).filter(Boolean)
      );
      const aliases = Array.from(names).filter(
        (n) => n.trim().toLowerCase() !== participantName.trim().toLowerCase() &&
               !currentParticipantNames.has(n.trim().toLowerCase())
      ).sort((a, b) => a.localeCompare(b));
      setMergeState((prev) => prev ? { ...prev, expenseNames: aliases, loading: false } : null);
    } catch (err) {
      setMergeState((prev) => prev ? { ...prev, loading: false, error: err instanceof Error ? err.message : "Error" } : null);
    }
  }

  async function executeMerge() {
    if (!mergeState || !mergeState.selectedAlias) return;
    setMergeState((prev) => prev ? { ...prev, saving: true, error: null } : null);
    try {
      const res = await fetch("/api/trip-expenses/rename-participant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripId, fromName: mergeState.selectedAlias, toName: mergeState.participantName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al fusionar");
      setMergeState((prev) => prev ? { ...prev, saving: false, done: data.updatedExpenses ?? 0 } : null);
    } catch (err) {
      setMergeState((prev) => prev ? { ...prev, saving: false, error: err instanceof Error ? err.message : "Error" } : null);
    }
  }

  function openCreateParticipant() {
    setEditingParticipant(null);
    closeAsidePanel();
    setIsCreating(true);
    if (isMobile) setMobilePanel("form");
  }

  function closeCreateParticipant() {
    setIsCreating(false);
    setMobilePanel(null);
  }

  function openEditParticipant(participant: TripParticipant) {
    setIsCreating(false);
    closeAsidePanel();
    setEditingParticipant(participant);
    if (isMobile) setMobilePanel("form");
  }

  function closeEditParticipant() {
    setEditingParticipant(null);
    setMobilePanel(null);
  }

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
    if (asidePanel !== "link" || !asideParticipant) return;
    const row = participants.find((p) => p.id === asideParticipant.id);
    if (row?.user_id) closeAsidePanel();
  }, [asidePanel, asideParticipant, participants]);

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

  const existingEmailsForImport = useMemo(
    () =>
      new Set(
        participants
          .map((p) => (p.email ? String(p.email).toLowerCase() : ""))
          .filter(Boolean)
      ),
    [participants]
  );

  const existingNamesForImport = useMemo(
    () =>
      new Set(
        participants.map((p) => String(p.display_name || "").trim().toLowerCase()).filter(Boolean)
      ),
    [participants]
  );

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

  async function handleCreate(input: ParticipantFormValues) {
    setActionError(null);
    await addParticipant({
      trip_id: input.trip_id,
      display_name: input.display_name || "",
      username: input.username ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      joined_via: input.joined_via ?? "manual",
      user_id: null,
      role: input.role ?? "viewer",
      status: input.status,
      can_manage_trip: input.can_manage_trip,
      can_manage_participants: input.can_manage_participants,
      can_manage_expenses: input.can_manage_expenses,
      can_manage_plan: input.can_manage_plan,
      can_manage_map: input.can_manage_map,
      can_manage_resources: input.can_manage_resources,
    });
    closeCreateParticipant();
  }

  async function handleUpdate(input: ParticipantFormValues) {
    if (!editingParticipant) return;
    setActionError(null);
    await updateParticipant(editingParticipant.id, {
      display_name: input.display_name,
      username: input.username ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      joined_via: input.joined_via ?? null,
      role: input.role,
      status: input.status,
      can_manage_trip: input.can_manage_trip,
      can_manage_participants: input.can_manage_participants,
      can_manage_expenses: input.can_manage_expenses,
      can_manage_plan: input.can_manage_plan,
      can_manage_map: input.can_manage_map,
      can_manage_resources: input.can_manage_resources,
    });
    closeEditParticipant();
  }

  async function handleRemove(id: string) {
    const confirmed = window.confirm("¿Seguro que quieres eliminar este participante?");
    if (!confirmed) return;
    try {
      setActionError(null);
      await removeParticipant(id);
      if (editingParticipant?.id === id) setEditingParticipant(null);
      if (asideParticipant?.id === id) closeAsidePanel();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  function openGenericInvite() {
    setEditingParticipant(null);
    setIsCreating(false);
    setBulkImportOpen(false);
    if (asidePanel === "invite" && !asideParticipant) {
      closeAsidePanel();
      return;
    }
    setAsideParticipant(null);
    setAsidePanel("invite");
  }

  function openParticipantInvite(participant: TripParticipant) {
    setEditingParticipant(null);
    setIsCreating(false);
    setBulkImportOpen(false);
    setAsideParticipant(participant);
    setAsidePanel("invite");
    if (isMobile) setMobilePanel("invite");
  }

  function openLinkProfile(participant: TripParticipant) {
    setEditingParticipant(null);
    setIsCreating(false);
    setBulkImportOpen(false);
    setAsideParticipant(participant);
    setAsidePanel("link");
    if (isMobile) setMobilePanel("link");
  }

  if (loading) {
    return (
      <main className="space-y-6" aria-busy="true" aria-label="Cargando participantes">
        <SkeletonCard rows={2} />
        <div className="grid gap-3 sm:grid-cols-3">
          <SkeletonCard rows={1} />
          <SkeletonCard rows={1} />
          <SkeletonCard rows={1} />
        </div>
        <SkeletonCard rows={3} />
        <SkeletonCard rows={3} />
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
    <main className="min-w-0 max-w-full space-y-5 overflow-x-hidden pb-20 md:space-y-8 md:pb-0">
      <TripBoardPageHeader
        section="Pasajeros del viaje"
        title="Participantes"
        description="Añade compañeros, envía invitaciones por WhatsApp para que vinculen su cuenta y evita duplicados buscando su perfil."
        iconKey="participants"
        iconAlt="Participantes"
        actions={mapFlow ? <TripTabActions tripId={tripId} /> : <TripScreenActions tripId={tripId} />}
      />

      {/* Ge1 — stats compactos en móvil */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Reveal variant="scale" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="px-2.5 py-2.5 text-center sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 sm:flex dark:bg-[#1E293B]">
              <Users className="h-5 w-5 text-slate-600 dark:text-slate-300" aria-hidden />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400 sm:text-[10px]">Total</p>
              <p className="text-xl font-extrabold leading-none text-slate-950 tabular-nums sm:text-3xl">{stats.total}</p>
            </div>
          </div>
        </Reveal>
        <Reveal variant="scale" delay={1} className="overflow-hidden rounded-xl border border-emerald-200 bg-white shadow-sm sm:rounded-2xl dark:border-emerald-900/40 dark:bg-[#0F1623]">
          <div className="px-2.5 py-2.5 text-center sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 sm:flex">
              <UserCheck className="h-5 w-5 text-emerald-700" aria-hidden />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600 sm:text-[10px]">Cuenta</p>
              <p className="text-xl font-extrabold leading-none text-emerald-700 tabular-nums sm:text-3xl">{stats.linked}</p>
            </div>
          </div>
        </Reveal>
        <Reveal variant="scale" delay={2} className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm sm:rounded-2xl dark:border-amber-900/40 dark:bg-[#0F1623]">
          <div className="px-2.5 py-2.5 text-center sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-3.5 sm:text-left">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 sm:flex">
              <Sparkles className="h-5 w-5 text-amber-700" aria-hidden />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600 sm:text-[10px]">Pend.</p>
              <p className="text-xl font-extrabold leading-none text-amber-700 tabular-nums sm:text-3xl">{stats.unlinked}</p>
            </div>
          </div>
        </Reveal>
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
                className="min-w-0 max-w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none ring-violet-200 transition focus:border-violet-300 focus:ring-2 dark:border-[#334155] dark:bg-[#080C14] dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 md:hidden">
          {(
            [
              { id: "all" as const, label: "Todos" },
              { id: "linked" as const, label: "Con cuenta" },
              { id: "unlinked" as const, label: "Pendientes" },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setLinkFilter(chip.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${
                linkFilter === chip.id
                  ? "border-violet-300 bg-violet-50 text-violet-900"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <section className="hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-[#1E293B] dark:bg-[#0F1623] sm:p-4 md:block">
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
              className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-xs font-semibold text-violet-950 shadow-sm transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200"
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
          <div className="motion-stagger-list grid gap-3">
            {filteredParticipants.map((participant, pIdx) => {
              const isLinkedUser = Boolean(participant.user_id);
              const canInviteThisParticipant = !isLinkedUser;
              const isYou = Boolean(currentUserId && participant.user_id === currentUserId);

              return (
                <Reveal
                  key={participant.id}
                  variant="slide"
                  delay={(pIdx % 4) as RevealDelay}
                  as="article"
                  className={`trip-card-hover group rounded-3xl border bg-white p-4 shadow-sm ${
                    isYou ? "border-violet-200 ring-1 ring-violet-100" : "border-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 flex-1 gap-3">
                      {participant.user_id ? (
                        <UserAvatar
                          displayName={participant.display_name || "?"}
                          avatarKind={participant.profile_avatar_kind}
                          avatarEmoji={participant.profile_avatar_emoji}
                          avatarIllustration={participant.profile_avatar_illustration}
                          size="lg"
                          className="rounded-2xl"
                          ringClassName="ring-2 ring-slate-200 dark:ring-slate-600"
                        />
                      ) : (
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold shadow-sm ${avatarColor(participant.display_name || "?").bg} ${avatarColor(participant.display_name || "?").text}`}
                        >
                          {initials(participant.display_name || "?")}
                        </div>
                      )}
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
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-violet-800">
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
                          <span className="hidden rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-600 sm:inline-flex">
                            {getStatusLabel(participant.status as "active" | "pending" | "removed")}
                          </span>
                        </div>

                        <div className="hidden flex-wrap gap-2 sm:flex">
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
                          onEdit={() => openEditParticipant(participant)}
                          onInvite={() => openParticipantInvite(participant)}
                          onLink={() => openLinkProfile(participant)}
                          onMerge={() => openMergeDialog(participant.display_name || "")}
                          onRemove={() => void handleRemove(participant.id)}
                        />
                      </div>
                    ) : null}
                  </div>
                </Reveal>
              );
            })}
          </div>
        )}

        {canManageParticipants && showParticipantForm && !isMobile ? (
          <div
            ref={participantFormRef}
            id="participant-form-panel"
            className="scroll-mt-24 rounded-2xl border border-violet-200 bg-violet-50/30 p-1 shadow-sm dark:border-violet-900/40 dark:bg-violet-950/20"
          >
            {isCreating ? (
              <ParticipantForm
                tripId={tripId}
                onSubmit={handleCreate}
                onCancel={closeCreateParticipant}
                submitLabel="Añadir participante"
              />
            ) : null}
            {editingParticipant ? (
              <ParticipantForm
                tripId={tripId}
                initialData={editingParticipant}
                onSubmit={handleUpdate}
                onCancel={closeEditParticipant}
                submitLabel="Guardar cambios"
              />
            ) : null}
          </div>
        ) : null}
        </section>

        <aside className="max-lg:hidden min-w-0 space-y-4 lg:sticky lg:top-4 lg:self-start">
          {!isAgencyTrip ? (
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-light)] p-4 shadow-sm dark:border-[color:var(--brand-border)] dark:bg-[var(--brand-light)]">
              <p className="text-sm font-extrabold text-[var(--brand-text)]">Chat del grupo</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Coordina con el resto sin depender de WhatsApp.
              </p>
              <Link
                href={`/trip/${tripId}/messages`}
                className="btn-press mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-hover)]"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Abrir mensajes
              </Link>
            </div>
          ) : null}

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
                  type="button"
                  data-tour="participants-add-btn"
                  onClick={() => (isCreating ? closeCreateParticipant() : openCreateParticipant())}
                  className={`btn-press ${btnPrimary} inline-flex items-center gap-2 px-4 py-2.5 text-sm`}
                >
                  <UserPlus className="h-4 w-4" aria-hidden />
                  {isCreating ? "Cerrar formulario" : "Añadir pasajero"}
                </button>
                <button
                  type="button"
                  data-tour="participants-invite-btn"
                  onClick={openGenericInvite}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                  {asidePanel === "invite" && !asideParticipant ? "Cerrar invitación" : "Invitar por WhatsApp"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBulkImportOpen((v) => !v);
                    if (!bulkImportOpen) {
                      closeCreateParticipant();
                      closeAsidePanel();
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-950 shadow-sm transition hover:bg-violet-100 sm:col-span-2"
                >
                  <FileSpreadsheet className="h-4 w-4" aria-hidden />
                  {bulkImportOpen ? "Cerrar importación" : "Importar desde Excel o lista"}
                </button>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Envía un enlace único por WhatsApp. La persona inicia sesión y Kaviro crea o vincula su pasajero automáticamente.
              </p>

              {bulkImportOpen ? (
                <div className="mt-4">
                  <BulkImportParticipantsPanel
                    tripId={tripId}
                    existingEmails={existingEmailsForImport}
                    existingNames={existingNamesForImport}
                    onImported={async () => {
                      await refetch();
                    }}
                    onClose={() => setBulkImportOpen(false)}
                  />
                </div>
              ) : null}

              <div className="mt-4">
                <UsernameInvitePanel tripId={tripId} />
                <TravelMatesInvitePanel tripId={tripId} />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#0F1623] p-4 text-sm text-slate-600 shadow-sm">
              <p className="font-semibold text-slate-900">Solo lectura</p>
              <p className="mt-1">
                No tienes permisos para gestionar pasajeros en este viaje.
              </p>
            </div>
          )}

          {canManageParticipants && asidePanel === "invite" ? (
            <div
              ref={asidePanelRef}
              data-tour="participants-qr"
              className="scroll-mt-24"
            >
              <InviteParticipantPanel
                tripId={tripId}
                participant={asideParticipant}
                onCreated={closeAsidePanel}
                onCancel={closeAsidePanel}
              />
            </div>
          ) : null}

          {canManageParticipants && asidePanel === "link" && asideParticipant ? (
            <div ref={asidePanelRef} className="scroll-mt-24">
              <ParticipantLinkProfilePanel
                participant={asideParticipant}
                onSearchProfiles={searchProfiles}
                onCancel={closeAsidePanel}
                onLinkProfile={async (profile) => {
                  setActionError(null);
                  try {
                    await linkParticipantToProfile(asideParticipant.id, profile);
                    closeAsidePanel();
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : "No se pudo vincular el usuario.");
                  }
                }}
              />
            </div>
          ) : null}
        </aside>
      </div>

      {canManageParticipants ? (
        <>
          <button
            type="button"
            onClick={() => setMobilePanel("menu")}
            className="fixed bottom-[calc(max(env(safe-area-inset-bottom),8px)+84px)] right-[max(1rem,env(safe-area-inset-right))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-white shadow-lg transition hover:bg-[var(--brand-hover)] active:scale-95 md:hidden"
            aria-label="Gestionar participantes"
          >
            <MoreHorizontal className="h-6 w-6" />
          </button>

          <MobileBottomSheet
            open={isMobile && mobilePanel === "menu"}
            onClose={() => setMobilePanel(null)}
            title="Gestionar pasajeros"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => openCreateParticipant()}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Añadir pasajero
              </button>
              <button
                type="button"
                onClick={() => {
                  openGenericInvite();
                  setMobilePanel("invite");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" aria-hidden />
                Invitar por WhatsApp
              </button>
              <button
                type="button"
                onClick={() => {
                  setBulkImportOpen(true);
                  setMobilePanel("import");
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden />
                Importar desde Excel
              </button>
            </div>
          </MobileBottomSheet>

          <MobileBottomSheet
            open={isMobile && mobilePanel === "form" && showParticipantForm}
            onClose={() => {
              closeCreateParticipant();
              closeEditParticipant();
            }}
            title={editingParticipant ? "Editar pasajero" : "Nuevo pasajero"}
          >
            {isCreating ? (
              <ParticipantForm
                tripId={tripId}
                onSubmit={handleCreate}
                onCancel={closeCreateParticipant}
                submitLabel="Añadir participante"
              />
            ) : null}
            {editingParticipant ? (
              <ParticipantForm
                tripId={tripId}
                initialData={editingParticipant}
                onSubmit={handleUpdate}
                onCancel={closeEditParticipant}
                submitLabel="Guardar cambios"
              />
            ) : null}
          </MobileBottomSheet>

          <MobileBottomSheet
            open={isMobile && mobilePanel === "invite" && asidePanel === "invite"}
            onClose={() => {
              closeAsidePanel();
              setMobilePanel(null);
            }}
            title="Invitar por WhatsApp"
          >
            <InviteParticipantPanel
              tripId={tripId}
              participant={asideParticipant}
              onCreated={() => {
                closeAsidePanel();
                setMobilePanel(null);
              }}
              onCancel={() => {
                closeAsidePanel();
                setMobilePanel(null);
              }}
            />
          </MobileBottomSheet>

          <MobileBottomSheet
            open={isMobile && mobilePanel === "import" && bulkImportOpen}
            onClose={() => {
              setBulkImportOpen(false);
              setMobilePanel(null);
            }}
            title="Importar participantes"
          >
            <BulkImportParticipantsPanel
              tripId={tripId}
              existingEmails={existingEmailsForImport}
              existingNames={existingNamesForImport}
              onImported={async () => {
                await refetch();
              }}
              onClose={() => {
                setBulkImportOpen(false);
                setMobilePanel(null);
              }}
            />
            <div className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <UsernameInvitePanel tripId={tripId} />
              <TravelMatesInvitePanel tripId={tripId} />
            </div>
          </MobileBottomSheet>

          <MobileBottomSheet
            open={isMobile && mobilePanel === "link" && asidePanel === "link" && !!asideParticipant}
            onClose={() => {
              closeAsidePanel();
              setMobilePanel(null);
            }}
            title="Vincular cuenta"
          >
            {asideParticipant ? (
              <ParticipantLinkProfilePanel
                participant={asideParticipant}
                onSearchProfiles={searchProfiles}
                onCancel={() => {
                  closeAsidePanel();
                  setMobilePanel(null);
                }}
                onLinkProfile={async (profile) => {
                  setActionError(null);
                  try {
                    await linkParticipantToProfile(asideParticipant.id, profile);
                    closeAsidePanel();
                    setMobilePanel(null);
                  } catch (e) {
                    setActionError(e instanceof Error ? e.message : "No se pudo vincular el usuario.");
                  }
                }}
              />
            ) : null}
          </MobileBottomSheet>
        </>
      ) : null}

      {/* Modal de fusión de nombre en gastos */}
      {mergeState ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-[#0F1623]">
            <div className="mb-4 flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                <GitMerge className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">Fusionar nombre en gastos</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Selecciona un alias antiguo en los gastos que corresponda a{" "}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{mergeState.participantName}</span>.
                  Todos los gastos y liquidaciones que usen ese alias quedarán unificados.
                </p>
              </div>
            </div>

            {mergeState.loading ? (
              <p className="py-4 text-center text-sm text-slate-500">Cargando nombres de gastos…</p>
            ) : mergeState.done !== null ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                ✓ {mergeState.done > 0
                  ? `Se actualizaron ${mergeState.done} registro${mergeState.done !== 1 ? "s" : ""} de gastos.`
                  : "No había registros que actualizar con ese alias."
                }
              </div>
            ) : (
              <>
                {mergeState.expenseNames.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                    No hay nombres en gastos que no coincidan con los participantes actuales de Gente.
                  </p>
                ) : (
                  <select
                    value={mergeState.selectedAlias}
                    onChange={(e) => setMergeState((prev) => prev ? { ...prev, selectedAlias: e.target.value } : null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--brand-border)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    <option value="">— Elegir alias a reemplazar —</option>
                    {mergeState.expenseNames.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                )}
                {mergeState.error ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">{mergeState.error}</p>
                ) : null}
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setMergeState(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                {mergeState.done !== null ? "Cerrar" : "Cancelar"}
              </button>
              {mergeState.done === null && !mergeState.loading && mergeState.expenseNames.length > 0 ? (
                <button
                  type="button"
                  disabled={!mergeState.selectedAlias || mergeState.saving}
                  onClick={() => void executeMerge()}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                >
                  {mergeState.saving ? "Fusionando…" : "Fusionar"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
