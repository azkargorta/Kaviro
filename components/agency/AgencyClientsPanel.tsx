"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Pencil, Trash2 } from "lucide-react";
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

type ClientRow = {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  notes: string | null;
  tripCount?: number;
};

export default function AgencyClientsPanel() {
  const toast = useToast();
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agencies/clients", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cargar.");
      setClients(data.clients ?? []);
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agencies/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          contact_email: email.trim() || null,
          contact_phone: phone.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo crear.");
      setName("");
      setEmail("");
      setPhone("");
      setNotes("");
      toast.push({ kind: "success", title: "Cliente guardado" });
      load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(client: ClientRow) {
    setEditingId(client.id);
    setEditName(client.name);
    setEditEmail(client.contact_email ?? "");
    setEditPhone(client.contact_phone ?? "");
    setEditNotes(client.notes ?? "");
  }

  async function saveEdit(id: string) {
    try {
      const res = await fetch(`/api/agencies/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          contact_email: editEmail.trim() || null,
          contact_phone: editPhone.trim() || null,
          notes: editNotes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setEditingId(null);
      toast.push({ kind: "success", title: "Cliente actualizado" });
      load();
    } catch (e) {
      toast.push({ kind: "error", title: e instanceof Error ? e.message : "Error" });
    }
  }

  async function removeClient(id: string, clientName: string) {
    if (!confirm(`¿Eliminar a «${clientName}»? Los viajes quedarán sin cliente vinculado.`)) return;
    const res = await fetch(`/api/agencies/clients/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.push({ kind: "error", title: data.error || "No se pudo eliminar." });
      return;
    }
    toast.push({ kind: "success", title: "Cliente eliminado" });
    load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className={agencyPageTitleClass}>Clientes</h1>
        <p className={agencyPageSubtitleClass}>
          Empresas o grupos a los que preparas programas. Vincúlalos al crear un viaje en{" "}
          <Link href="/agency" className="font-semibold text-[#1e3a5f] underline dark:text-sky-300">
            Viajes
          </Link>
          .
        </p>
      </div>

      <form onSubmit={handleCreate} className={`${agencyCardClass} space-y-3 p-5`}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
          <Building2 className="h-4 w-4" aria-hidden />
          Nuevo cliente
        </h2>
        <label className={agencyLabelClass}>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} className={agencyInputClass} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={agencyLabelClass}>
            Email de contacto
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={agencyInputClass}
            />
          </label>
          <label className={agencyLabelClass}>
            Teléfono
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={agencyInputClass} />
          </label>
        </div>
        <label className={agencyLabelClass}>
          Notas internas
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={agencyInputClass} />
        </label>
        <button type="submit" disabled={saving} className={agencyBtnPrimaryClass}>
          {saving ? "Guardando…" : "Añadir cliente"}
        </button>
      </form>

      <div className={`${agencyCardClass} p-5`}>
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Listado</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Cargando…</p>
        ) : clients.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">Aún no hay clientes registrados.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-700">
            {clients.map((client) => (
              <li key={client.id} className="py-4 first:pt-0">
                {editingId === client.id ? (
                  <div className="space-y-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={agencyInputClass}
                    />
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className={agencyInputClass}
                      placeholder="Email"
                    />
                    <input
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className={agencyInputClass}
                      placeholder="Teléfono"
                    />
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={2}
                      className={agencyInputClass}
                    />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => saveEdit(client.id)} className={agencyBtnPrimaryClass}>
                        Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className={agencyBtnSecondaryClass}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{client.name}</p>
                      {client.contact_email ? (
                        <p className="text-xs text-slate-500">{client.contact_email}</p>
                      ) : null}
                      {client.contact_phone ? (
                        <p className="text-xs text-slate-500">{client.contact_phone}</p>
                      ) : null}
                      {client.notes ? (
                        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{client.notes}</p>
                      ) : null}
                      <p className="mt-1 text-xs font-medium text-[#1e3a5f] dark:text-sky-300">
                        {client.tripCount ?? 0} programa{(client.tripCount ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(client)}
                        className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1.5 text-xs`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeClient(client.id, client.name)}
                        className={`${agencyBtnSecondaryClass} gap-1 px-2 py-1.5 text-xs text-red-700`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
