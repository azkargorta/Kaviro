import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgencyRole } from "@/lib/agency";

export function generateAgencyInviteToken() {
  return randomBytes(24).toString("base64url");
}

export function agencyInvitePath(token: string) {
  return `/agency/join?token=${encodeURIComponent(token)}`;
}

export async function countAgencyMembers(
  supabase: SupabaseClient,
  agencyId: string,
  ownerId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("agency_members")
    .select("user_id", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  if (error) throw new Error(error.message);

  const memberCount = count ?? 0;
  const { data: ownerMember } = await supabase
    .from("agency_members")
    .select("user_id")
    .eq("agency_id", agencyId)
    .eq("user_id", ownerId)
    .maybeSingle();

  return ownerMember ? memberCount : memberCount + 1;
}

export async function countPendingAgencyInvites(supabase: SupabaseClient, agencyId: string) {
  const { count, error } = await supabase
    .from("agency_invites")
    .select("id", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString());

  if (error) {
    if (error.message.includes("agency_invites")) return 0;
    throw new Error(error.message);
  }
  return count ?? 0;
}

export type CreateAgencyInviteInput = {
  email: string;
  role: AgencyRole;
  invitedBy: string;
  expiresInDays?: number;
};

export async function createAgencyInvite(
  supabase: SupabaseClient,
  agencyId: string,
  input: CreateAgencyInviteInput
) {
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) throw new Error("Email no válido.");

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (input.expiresInDays ?? 14));

  const { data, error } = await supabase
    .from("agency_invites")
    .insert({
      agency_id: agencyId,
      email,
      role: input.role,
      token: generateAgencyInviteToken(),
      invited_by: input.invitedBy,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, token, email, role, expires_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
