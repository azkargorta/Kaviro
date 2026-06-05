import { NextResponse } from "next/server";
import {
  AgencyBillingPortalError,
  createAgencyBillingPortalSession,
} from "@/lib/agency-billing-portal";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const url = await createAgencyBillingPortalSession({ origin });
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof AgencyBillingPortalError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo abrir el portal." },
      { status: 500 }
    );
  }
}
