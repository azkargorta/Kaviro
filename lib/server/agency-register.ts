import type { SupabaseClient } from "@supabase/supabase-js";
import { slugifyForUrl } from "@/lib/agency-slug";
import { AGENCY_TRIAL_MAX_MEMBERS, agencyTrialEndsAt } from "@/lib/agency-plan";

const RESERVED_SLUGS = new Set([
  "agency",
  "api",
  "auth",
  "client",
  "admin",
  "empresa",
  "trip",
  "pay",
  "ops",
  "dashboard",
  "account",
  "pricing",
  "www",
]);

export class AgencyRegisterError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "AgencyRegisterError";
    this.status = status;
  }
}

function normalizeAgencySlug(raw: string, fallbackName: string): string {
  const base = slugifyForUrl(raw.trim() || fallbackName);
  if (!base || RESERVED_SLUGS.has(base)) {
    throw new AgencyRegisterError("El identificador URL no es válido. Prueba con otro nombre.");
  }
  return base;
}

async function slugAvailable(supabase: SupabaseClient, slug: string): Promise<boolean> {
  const { data, error } = await supabase.from("agencies").select("id").eq("slug", slug).maybeSingle();
  if (error) throw new AgencyRegisterError(error.message, 500);
  return !data?.id;
}

async function pickUniqueSlug(supabase: SupabaseClient, preferred: string): Promise<string> {
  let candidate = preferred;
  let n = 2;
  while (!(await slugAvailable(supabase, candidate))) {
    const suffix = `-${n}`;
    candidate = `${preferred.slice(0, Math.max(1, 64 - suffix.length))}${suffix}`;
    n += 1;
    if (n > 50) throw new AgencyRegisterError("No hay un identificador URL disponible. Prueba otro nombre.");
  }
  return candidate;
}

export async function registerAgencyForUser(
  supabase: SupabaseClient,
  userId: string,
  input: { name: string; slug?: string; contactEmail?: string | null }
) {
  const name = input.name.trim();
  if (name.length < 2) throw new AgencyRegisterError("Indica el nombre de la agencia (mín. 2 caracteres).");

  const existingMember = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (existingMember.data?.agency_id) {
    throw new AgencyRegisterError("Ya perteneces a una agencia.", 409);
  }

  const { data: owned } = await supabase.from("agencies").select("id").eq("owner_id", userId).limit(1).maybeSingle();
  if (owned?.id) throw new AgencyRegisterError("Ya tienes una agencia registrada.", 409);

  const preferredSlug = normalizeAgencySlug(input.slug || name, name);
  const slug = await pickUniqueSlug(supabase, preferredSlug);
  const contactEmail = (input.contactEmail || "").trim() || null;
  const now = new Date().toISOString();

  const { data: agency, error: insertErr } = await supabase
    .from("agencies")
    .insert({
      name,
      slug,
      owner_id: userId,
      plan: "trial",
      max_members: AGENCY_TRIAL_MAX_MEMBERS,
      plan_active_until: agencyTrialEndsAt(),
      contact_email: contactEmail,
      brand_color: "#1e3a5f",
      created_at: now,
      updated_at: now,
    })
    .select("id, name, slug, plan, max_members, plan_active_until")
    .single();

  if (insertErr) {
    if (insertErr.message.includes("agencies")) {
      throw new AgencyRegisterError("Ejecuta docs/kaviro_agency_mode.sql en Supabase.", 503);
    }
    throw new AgencyRegisterError(insertErr.message, 500);
  }

  const { error: memberErr } = await supabase.from("agency_members").insert({
    agency_id: agency.id,
    user_id: userId,
    role: "admin",
  });

  if (memberErr) {
    throw new AgencyRegisterError(memberErr.message, 500);
  }

  return agency;
}
