import { createServerSupabase } from "@/lib/trip-ai/serverSupabase";

// ─── Client-side response cache ──────────────────────────────────────────────
// Deduplicates identical prompts within the same session (TTL: 10 min for briefs)
type CacheEntry = { value: string; expiresAt: number };
const _responseCache = new Map<string, CacheEntry>();

function cacheKey(tripId: string, mode: string, prompt: string): string {
  // Simple hash: concatenate and take first 40 chars of encoded string
  const raw = `${tripId}|${mode}|${prompt}`.slice(0, 200);
  return btoa(unescape(encodeURIComponent(raw))).slice(0, 40);
}

export function getCachedResponse(tripId: string, mode: string, prompt: string): string | null {
  const key = cacheKey(tripId, mode, prompt);
  const entry = _responseCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { _responseCache.delete(key); return null; }
  return entry.value;
}

export function setCachedResponse(tripId: string, mode: string, prompt: string, value: string, ttlMs = 600_000): void {
  const key = cacheKey(tripId, mode, prompt);
  _responseCache.set(key, { value, expiresAt: Date.now() + ttlMs });
  // Evict oldest entries if cache grows too large
  if (_responseCache.size > 50) {
    const oldest = [..._responseCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) _responseCache.delete(oldest[0]);
  }
}

export function clearResponseCache(): void {
  _responseCache.clear();
}


export type ChatMode =
  | "general"
  | "planning"
  | "expenses"
  | "optimizer"
  | "actions"
  | "day_planner"
  | "travel_docs"
  | "search";

export async function listConversations(tripId: string) {
  const supabase = createServerSupabase();
  const response = await supabase
    .from("trip_ai_conversations")
    .select("*")
    .eq("trip_id", tripId)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (response.error) throw new Error(response.error.message);
  return response.data || [];
}

export async function createConversation(tripId: string, mode: ChatMode, title?: string) {
  const supabase = createServerSupabase();
  const response = await supabase
    .from("trip_ai_conversations")
    .insert({
      trip_id: tripId,
      mode,
      title: title?.trim() || "Nueva conversación",
    })
    .select("*")
    .single();

  if (response.error) throw new Error(response.error.message);
  return response.data;
}

export async function getConversation(conversationId: string) {
  const supabase = createServerSupabase();
  const response = await supabase
    .from("trip_ai_conversations")
    .select("*")
    .eq("id", conversationId)
    .single();

  if (response.error) throw new Error(response.error.message);
  return response.data;
}

export async function listMessages(conversationId: string) {
  const supabase = createServerSupabase();
  const response = await supabase
    .from("trip_ai_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (response.error) throw new Error(response.error.message);
  return response.data || [];
}

export async function appendMessage(params: {
  conversationId: string;
  tripId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
  /** Si se indica, actualiza el modo de la conversación (p. ej. planning tras detectar itinerario en modo automático). */
  conversationMode?: ChatMode;
}) {
  const supabase = createServerSupabase();
  const response = await supabase
    .from("trip_ai_messages")
    .insert({
      conversation_id: params.conversationId,
      trip_id: params.tripId,
      role: params.role,
      content: params.content,
      metadata: params.metadata || {},
    })
    .select("*")
    .single();

  if (response.error) throw new Error(response.error.message);

  const convoPatch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.role === "user" && params.content.trim()) {
    convoPatch.title = params.content.trim().slice(0, 60);
  }
  if (params.conversationMode) {
    convoPatch.mode = params.conversationMode;
  }

  await supabase.from("trip_ai_conversations").update(convoPatch).eq("id", params.conversationId);

  return response.data;
}
