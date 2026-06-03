import type { SupabaseClient } from "@supabase/supabase-js";
import { getAgencyForUser } from "@/lib/agency";

function isSafeRelativePath(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//");
}

/** Rutas que deben respetarse aunque el usuario sea de agencia. */
function shouldHonorExplicitNext(next: string | null | undefined): boolean {
  if (!next || !isSafeRelativePath(next)) return false;
  if (next.startsWith("/agency/join")) return true;
  if (next.startsWith("/trip/")) return true;
  if (next.startsWith("/client/")) return true;
  if (next.startsWith("/auth/")) return true;
  if (next.startsWith("/account")) return true;
  if (next.startsWith("/empresa")) return true;
  return false;
}

/**
 * Destino tras login: miembros de agencia → panel Kaviro Trips por defecto.
 */
export async function getDefaultHomePathForUser(
  supabase: SupabaseClient,
  userId: string,
  requestedNext?: string | null
): Promise<string> {
  if (requestedNext && shouldHonorExplicitNext(requestedNext)) return requestedNext;

  const ctx = await getAgencyForUser(supabase, userId);
  if (ctx) return "/agency";

  if (requestedNext && isSafeRelativePath(requestedNext)) return requestedNext;
  return "/dashboard";
}

export async function userHasAgencyWorkspace(supabase: SupabaseClient, userId: string) {
  const ctx = await getAgencyForUser(supabase, userId);
  return Boolean(ctx);
}
