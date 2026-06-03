import { NextResponse } from "next/server";
import {
  AGENCY_PARTNERSHIP_EMAIL,
  KAVIRO_TRIPS_PRODUCT_NAME,
} from "@/lib/brand";
import { buildAgencyAccessRequestEmailHtml, sendTransactionalEmail } from "@/lib/email/send-transactional-email";

type Body = {
  name?: string;
  agencyName?: string;
  email?: string;
  groupsPerYear?: string;
  message?: string;
};

function trimField(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLen);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const name = trimField(body.name, 120);
    const agencyName = trimField(body.agencyName, 160);
    const email = trimField(body.email, 254).toLowerCase();
    const groupsPerYear = trimField(body.groupsPerYear, 80);
    const message = trimField(body.message, 2000);

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Indica tu nombre." }, { status: 400 });
    }
    if (!agencyName || agencyName.length < 2) {
      return NextResponse.json({ error: "Indica el nombre de la agencia." }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email no válido." }, { status: 400 });
    }

    const subject = `Solicitud ${KAVIRO_TRIPS_PRODUCT_NAME} — ${agencyName}`;
    const html = buildAgencyAccessRequestEmailHtml({
      name,
      agencyName,
      email,
      groupsPerYear: groupsPerYear || "No indicado",
      message: message || "(sin mensaje adicional)",
    });

    const result = await sendTransactionalEmail({
      to: AGENCY_PARTNERSHIP_EMAIL,
      subject,
      html,
    });

    if (!result.sent) {
      console.error("agency contact email:", result.error);
      return NextResponse.json(
        { error: "No pudimos enviar la solicitud. Escríbenos a " + AGENCY_PARTNERSHIP_EMAIL },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/contact/agency:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
