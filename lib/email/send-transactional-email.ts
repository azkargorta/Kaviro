import { APP_NAME, KAVIRO_TRIPS_PRODUCT_NAME, LEGAL_CONTACT_EMAIL } from "@/lib/brand";

export type SendEmailResult = {
  sent: boolean;
  error?: string;
};

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL?.trim() || `${APP_NAME} <${LEGAL_CONTACT_EMAIL}>`;

/** Envío vía API de Resend (requiere RESEND_API_KEY en el servidor). */
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY no configurada en el servidor." };
  }

  const to = params.to.trim().toLowerCase();
  if (!to.includes("@")) {
    return { sent: false, error: "Email de destino no válido." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: params.from || DEFAULT_FROM,
        to: [to],
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { message?: string; id?: string };
    if (!res.ok) {
      return { sent: false, error: data.message || `Resend HTTP ${res.status}` };
    }

    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "Error al enviar email." };
  }
}

export function buildAgencyInviteEmailHtml(params: {
  agencyName: string;
  inviteUrl: string;
  role: string;
  expiresAt: string;
}) {
  const roleLabel = params.role === "admin" ? "administrador" : "editor";
  const expires = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(params.expiresAt));

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:linear-gradient(90deg,#1e3a5f,#0f2744);padding:24px 28px;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">${KAVIRO_TRIPS_PRODUCT_NAME}</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#fff;">Invitación al equipo</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 16px;">Te han invitado a unirte a <strong>${escapeHtml(params.agencyName)}</strong> en ${KAVIRO_TRIPS_PRODUCT_NAME} como <strong>${roleLabel}</strong>.</p>
        <p style="margin:0 0 24px;">Pulsa el botón para aceptar (inicia sesión con este mismo email si aún no tienes cuenta en ${APP_NAME}):</p>
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${params.inviteUrl}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;">Aceptar invitación</a>
        </p>
        <p style="margin:0 0 8px;font-size:12px;color:#64748b;">El enlace caduca el ${expires}.</p>
        <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">${escapeHtml(params.inviteUrl)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAgencyAccessRequestEmailHtml(params: {
  name: string;
  agencyName: string;
  email: string;
  groupsPerYear: string;
  message: string;
}) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:linear-gradient(90deg,#1e3a5f,#0f2744);padding:24px 28px;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">${KAVIRO_TRIPS_PRODUCT_NAME}</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#fff;">Nueva solicitud de acceso</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 12px;"><strong>Nombre:</strong> ${escapeHtml(params.name)}</p>
        <p style="margin:0 0 12px;"><strong>Agencia:</strong> ${escapeHtml(params.agencyName)}</p>
        <p style="margin:0 0 12px;"><strong>Email:</strong> <a href="mailto:${escapeHtml(params.email)}">${escapeHtml(params.email)}</a></p>
        <p style="margin:0 0 12px;"><strong>Grupos/año:</strong> ${escapeHtml(params.groupsPerYear)}</p>
        <p style="margin:0 0 8px;"><strong>Mensaje:</strong></p>
        <p style="margin:0;white-space:pre-wrap;">${escapeHtml(params.message)}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendAgencyInviteEmail(params: {
  to: string;
  agencyName: string;
  inviteUrl: string;
  role: string;
  expiresAt: string;
}): Promise<SendEmailResult> {
  const subject = `Invitación a ${params.agencyName} · ${KAVIRO_TRIPS_PRODUCT_NAME}`;
  const html = buildAgencyInviteEmailHtml(params);
  return sendTransactionalEmail({ to: params.to, subject, html });
}
