export async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<{ res: Response; payload: Record<string, unknown> | null }> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    return { res, payload };
  } finally {
    window.clearTimeout(timeoutId);
  }
}
