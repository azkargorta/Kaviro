import { agencyInvitePath } from "@/lib/agency-invites";
import { sendAgencyInviteEmail } from "@/lib/email/send-transactional-email";
import { getAppOrigin } from "@/lib/email/get-app-origin";

export async function sendAgencyInviteNotification(params: {
  email: string;
  agencyName: string;
  role: string;
  token: string;
  expiresAt: string;
  origin?: string;
}) {
  const origin = params.origin || (await getAppOrigin());
  const inviteUrl = `${origin}${agencyInvitePath(params.token)}`;

  const emailResult = await sendAgencyInviteEmail({
    to: params.email,
    agencyName: params.agencyName,
    inviteUrl,
    role: params.role,
    expiresAt: params.expiresAt,
  });

  return { inviteUrl, emailSent: emailResult.sent, emailError: emailResult.error };
}
