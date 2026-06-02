"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import type { AgencyBranding } from "@/lib/agency";
import { clientPortalPath } from "@/lib/agency";
import {
  AGENCY_NAVY_DARK,
  agencyBtnPrimaryClass,
  agencyCardClass,
  agencyInputClass,
  agencyPageSubtitleClass,
  agencyPageTitleClass,
} from "@/lib/agency-theme";

const PRESET_COLORS = ["#1e3a5f", "#0f2744", "#1d4ed8", "#047857", "#b45309", "#be123c", "#6d28d9"];

type Props = {
  agencySlug: string;
  initial: AgencyBranding;
  canEdit: boolean;
};

export default function AgencyBrandingForm({ agencySlug, initial, canEdit }: Props) {
  const router = useRouter();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(initial.name);
  const [brandColor, setBrandColor] = useState(initial.brandColor);
  const [contactEmail, setContactEmail] = useState(initial.contactEmail ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agencies/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand_color: brandColor,
          contact_email: contactEmail.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      toast.push({ kind: "success", title: "Branding actualizado" });
      router.refresh();
    } catch (err) {
      toast.push({
        kind: "error",
        title: err instanceof Error ? err.message : "Error al guardar",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(file: File | null) {
    if (!file || !canEdit) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/agencies/branding/logo", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir el logo.");
      setLogoUrl(data.logoUrl ?? data.branding?.logoUrl ?? null);
      toast.push({ kind: "success", title: "Logo actualizado" });
      router.refresh();
    } catch (err) {
      toast.push({
        kind: "error",
        title: err instanceof Error ? err.message : "Error al subir",
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    if (!canEdit || !logoUrl) return;
    setSaving(true);
    try {
      const res = await fetch("/api/agencies/branding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear_logo: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo quitar el logo.");
      setLogoUrl(null);
      toast.push({ kind: "success", title: "Logo eliminado" });
      router.refresh();
    } catch (err) {
      toast.push({
        kind: "error",
        title: err instanceof Error ? err.message : "Error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 max-w-xl">
      <div>
        <h1 className={agencyPageTitleClass}>Branding</h1>
        <p className={agencyPageSubtitleClass}>
          Logo, color y contacto que verán tus clientes en el{" "}
          <span className="font-semibold">portal cliente</span>.
        </p>
        {!canEdit ? (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Solo los administradores pueden editar. Tu rol es editor.
          </p>
        ) : null}
      </div>

      <div
        className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm dark:border-[#334155]"
        style={{
          background: `linear-gradient(90deg, ${brandColor} 0%, ${AGENCY_NAVY_DARK} 100%)`,
        }}
      >
        <div className="flex items-start gap-3 p-4 text-white">
          {logoUrl ? (
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
              <Image src={logoUrl} alt="" fill className="object-contain p-1" sizes="48px" unoptimized />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-lg font-black">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-white/80">{name}</p>
            <p className="text-sm font-semibold">Viaje de ejemplo · 12 jun — 20 jun</p>
            {contactEmail ? (
              <p className="mt-1 text-xs text-white/75">Contacto: {contactEmail}</p>
            ) : null}
          </div>
        </div>
      </div>

      {canEdit ? (
        <form onSubmit={handleSave} className="space-y-6">
          <section className={`${agencyCardClass} p-5`}>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Logo</h2>
            <p className="mt-1 text-xs text-slate-500">PNG, JPG, WebP o SVG · máx. 2 MB</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              {logoUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-[#334155] dark:bg-[#0F1623]">
                  <Image src={logoUrl} alt="" fill className="object-contain p-1" sizes="64px" unoptimized />
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-slate-300 text-2xl font-black text-slate-400">
                  {name.charAt(0)}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className={`${agencyBtnPrimaryClass} gap-2 px-4 py-2 text-xs disabled:opacity-50`}
                >
                  <ImagePlus className="h-4 w-4" aria-hidden />
                  {uploading ? "Subiendo…" : "Subir logo"}
                </button>
                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    disabled={saving}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-[#334155]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    Quitar
                  </button>
                ) : null}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          <section className={`${agencyCardClass} space-y-4 p-5`}>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Nombre de la agencia
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Color de marca
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setBrandColor(c)}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      brandColor === c ? "border-slate-900 scale-110 dark:border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="h-8 w-10 cursor-pointer rounded border border-slate-200 dark:border-[#334155]"
                  aria-label="Selector de color"
                />
                <input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-24 rounded-lg border border-slate-200 px-2 py-1 text-xs font-mono dark:border-[#334155] dark:bg-[#0F1623]"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Email de contacto (portal cliente)
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="hola@tuagencia.com"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-[#334155] dark:bg-[#0F1623]"
              />
            </div>
          </section>

          <button
            type="submit"
            disabled={saving || uploading}
            className={`${agencyBtnPrimaryClass} disabled:opacity-50`}
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      ) : null}

      <p className="text-xs text-slate-500">
        Ejemplo de URL del portal:{" "}
        <code className="text-slate-700 dark:text-slate-300">
          {clientPortalPath(agencySlug, "mi-viaje")}
        </code>
      </p>
    </div>
  );
}
