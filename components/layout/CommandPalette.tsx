"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, MapPin, DollarSign, Users, FileText, X } from "lucide-react";

type Result = {
  id: string;
  label: string;
  sub?: string;
  icon: React.ReactNode;
  href: string;
};

type Props = { tripId: string };

export default function CommandPalette({ tripId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [selected, setSelected] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Keyboard shortcut Cmd+K / Ctrl+K + mobile button event
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    function onMobileOpen() { setOpen(true); }
    document.addEventListener("keydown", onKey);
    document.addEventListener("kaviro:open-palette", onMobileOpen);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("kaviro:open-palette", onMobileOpen);
    };
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [activitiesRes, expensesRes] = await Promise.allSettled([
        fetch(`/api/trip-activities?tripId=${tripId}`).then((r) => r.json()),
        fetch(`/api/trip-expenses?tripId=${tripId}`).then((r) => r.json()),
      ]);

      const activities = activitiesRes.status === "fulfilled"
        ? (activitiesRes.value.activities ?? []) : [];
      const expenses = expensesRes.status === "fulfilled"
        ? (expensesRes.value.expenses ?? []) : [];

      const ql = q.toLowerCase();

      const actResults: Result[] = activities
        .filter((a: Record<string, unknown>) =>
          String(a.title ?? "").toLowerCase().includes(ql) ||
          String(a.place_name ?? "").toLowerCase().includes(ql)
        )
        .slice(0, 5)
        .map((a: Record<string, unknown>) => ({
          id: `act-${a.id}`,
          label: String(a.title ?? a.place_name ?? "Actividad"),
          sub: a.activity_date ? String(a.activity_date).slice(0, 10) : undefined,
          icon: <Calendar className="h-4 w-4" />,
          href: `/trip/${tripId}/plan`,
        }));

      const expResults: Result[] = expenses
        .filter((e: Record<string, unknown>) =>
          String(e.title ?? "").toLowerCase().includes(ql) ||
          String(e.paid_by ?? "").toLowerCase().includes(ql)
        )
        .slice(0, 3)
        .map((e: Record<string, unknown>) => ({
          id: `exp-${e.id}`,
          label: String(e.title ?? "Gasto"),
          sub: e.amount != null ? `${Number(e.amount).toFixed(2)} €` : undefined,
          icon: <DollarSign className="h-4 w-4" />,
          href: `/trip/${tripId}/expenses`,
        }));

      // Static nav items that match
      const navItems: Result[] = [
        { id: "nav-plan",    label: "Plan",          icon: <Calendar className="h-4 w-4" />, href: `/trip/${tripId}/plan` },
        { id: "nav-map",     label: "Rutas",         icon: <MapPin className="h-4 w-4" />,  href: `/trip/${tripId}/map` },
        { id: "nav-expenses",label: "Gastos",        icon: <DollarSign className="h-4 w-4" />, href: `/trip/${tripId}/expenses` },
        { id: "nav-people",  label: "Participantes", icon: <Users className="h-4 w-4" />,   href: `/trip/${tripId}/participants` },
        { id: "nav-docs",    label: "Documentos",    icon: <FileText className="h-4 w-4" />, href: `/trip/${tripId}/resources` },
      ].filter((n) => n.label.toLowerCase().includes(ql));

      setResults([...actResults, ...expResults, ...navItems].slice(0, 8));
      setSelected(0);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    const t = setTimeout(() => void search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  function navigate(href: string) {
    setOpen(false);
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && results[selected]) navigate(results[selected].href);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-[#1E293B] dark:bg-[#0F1623]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#1E293B] px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar actividades, gastos, secciones…"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {loading && <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-200 border-t-[#F87171] animate-spin" />}
          <button onClick={() => setOpen(false)} className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-[#1E293B]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 ? (
          <ul className="py-2 max-h-72 overflow-y-auto">
            {results.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(r.href)}
                  onMouseEnter={() => setSelected(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                    i === selected
                      ? "bg-[#F87171]/10 text-[#F87171]"
                      : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B]"
                  }`}
                >
                  <span className={i === selected ? "text-[#F87171]" : "text-slate-400"}>{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.label}</div>
                    {r.sub && <div className="text-xs text-slate-400 truncate">{r.sub}</div>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : query && !loading ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">
            Sin resultados para «{query}»
          </div>
        ) : !query ? (
          <div className="px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400 mb-2">Ir a</p>
            {[
              { label: "Plan",          icon: <Calendar className="h-3.5 w-3.5" />, href: `/trip/${tripId}/plan` },
              { label: "Gastos",        icon: <DollarSign className="h-3.5 w-3.5" />, href: `/trip/${tripId}/expenses` },
              { label: "Rutas",         icon: <MapPin className="h-3.5 w-3.5" />,  href: `/trip/${tripId}/map` },
              { label: "Participantes", icon: <Users className="h-3.5 w-3.5" />,   href: `/trip/${tripId}/participants` },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.href)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E293B] transition"
              >
                <span className="text-slate-400">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Footer */}
        <div className="border-t border-slate-100 dark:border-[#1E293B] px-4 py-2 flex items-center gap-3 text-[10px] text-slate-400">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
          <span className="ml-auto"><kbd className="font-mono">⌘K</kbd> para abrir</span>
        </div>
      </div>
    </div>
  );
}
