/** ID estable para mensajes de chat (funciona sin contexto seguro HTTPS). */
export function newChatMessageId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* ignore */
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export type NormalizedChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown>;
};

export function normalizeChatMessage(raw: unknown): NormalizedChatMessage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const role =
    row.role === "user" || row.role === "assistant" || row.role === "system" ? row.role : "assistant";
  const content = typeof row.content === "string" ? row.content : row.content == null ? "" : String(row.content);
  const id = typeof row.id === "string" && row.id.trim() ? row.id : newChatMessageId();
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : undefined;
  return { id, role, content, metadata };
}
