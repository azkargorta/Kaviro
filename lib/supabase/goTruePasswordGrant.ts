export type GoTruePasswordGrantResult =
  | {
      ok: true;
      access_token: string;
      refresh_token: string;
      expires_in: number;
      token_type: string;
      user: { id: string; email?: string };
    }
  | { ok: false; status: number; message: string };

/**
 * Login email/contraseña vía REST GoTrue (sin el cliente JS completo).
 * Suele ser más rápido y predecible en serverless que signInWithPassword.
 */
export async function goTruePasswordGrant(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
  timeoutMs = 9_000
): Promise<GoTruePasswordGrantResult> {
  const base = supabaseUrl.replace(/\/$/, "");
  const url = `${base}/auth/v1/token?grant_type=password`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (e) {
    const aborted =
      e instanceof Error &&
      (e.name === "TimeoutError" || e.name === "AbortError" || /aborted|timeout/i.test(e.message));
    return {
      ok: false,
      status: aborted ? 504 : 502,
      message: aborted
        ? "El servicio de autenticación no respondió a tiempo."
        : "No se pudo conectar con el servicio de autenticación.",
    };
  }

  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  if (!res.ok) {
    const desc =
      typeof payload?.error_description === "string"
        ? payload.error_description
        : typeof payload?.msg === "string"
          ? payload.msg
          : typeof payload?.error === "string"
            ? payload.error
            : `Error ${res.status}`;
    return { ok: false, status: res.status, message: desc };
  }

  const access_token = typeof payload?.access_token === "string" ? payload.access_token : "";
  const refresh_token = typeof payload?.refresh_token === "string" ? payload.refresh_token : "";
  if (!access_token || !refresh_token) {
    return { ok: false, status: 502, message: "Respuesta de autenticación incompleta." };
  }

  const userRaw = payload?.user;
  const user =
    userRaw && typeof userRaw === "object" && !Array.isArray(userRaw)
      ? (userRaw as { id?: string; email?: string })
      : null;

  return {
    ok: true,
    access_token,
    refresh_token,
    expires_in: typeof payload?.expires_in === "number" ? payload.expires_in : 3600,
    token_type: typeof payload?.token_type === "string" ? payload.token_type : "bearer",
    user: { id: user?.id ?? "", email: user?.email },
  };
}
