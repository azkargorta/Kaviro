import { KAVIRO_TRIPS_PRODUCT_NAME } from "@/lib/brand";
import type { AgencyEmailEvent } from "@/lib/agency/email-events";
import { AGENCY_EMAIL_EVENT_LABELS } from "@/lib/agency/email-events";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildAgencyTravelerEmailHtml(params: {
  agencyName: string;
  brandColor: string;
  tripName: string;
  travelerName: string;
  event: AgencyEmailEvent;
  actionUrl: string;
  bodyExtra?: string;
}) {
  const headline = AGENCY_EMAIL_EVENT_LABELS[params.event];
  const color = params.brandColor?.trim() || "#1e3a5f";

  const intro =
    params.event === "deposit_reminder"
      ? `Para confirmar tu plaza en <strong>${escapeHtml(params.tripName)}</strong>, completa el pago de la señal:`
      : params.event === "final_reminder"
        ? `Ya tienes la señal registrada. Puedes completar el pago final del viaje <strong>${escapeHtml(params.tripName)}</strong>:`
        : params.event === "pretravel_invite"
          ? `Antes del viaje <strong>${escapeHtml(params.tripName)}</strong>, ${escapeHtml(params.agencyName)} necesita algunos datos tuyos:`
          : `Tu opinión ayuda a ${escapeHtml(params.agencyName)}. Cuéntanos cómo fue <strong>${escapeHtml(params.tripName)}</strong>:`;

  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0;">
    <tr>
      <td style="background:linear-gradient(135deg,${escapeHtml(color)},#0f2744);padding:24px 28px;">
        <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.75);">${escapeHtml(params.agencyName)}</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#fff;">${escapeHtml(headline)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
        <p style="margin:0 0 16px;">Hola ${escapeHtml(params.travelerName)},</p>
        <p style="margin:0 0 20px;">${intro}</p>
        ${params.bodyExtra ? `<p style="margin:0 0 20px;font-size:14px;color:#64748b;">${escapeHtml(params.bodyExtra)}</p>` : ""}
        <p style="margin:0 0 24px;text-align:center;">
          <a href="${params.actionUrl}" style="display:inline-block;background:${escapeHtml(color)};color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:6px;">Continuar</a>
        </p>
        <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;">${escapeHtml(params.actionUrl)}</p>
        <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;">Enviado con ${KAVIRO_TRIPS_PRODUCT_NAME}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function agencyTravelerEmailSubject(params: {
  agencyName: string;
  tripName: string;
  event: AgencyEmailEvent;
}) {
  const label = AGENCY_EMAIL_EVENT_LABELS[params.event];
  return `${label} · ${params.tripName} · ${params.agencyName}`;
}
