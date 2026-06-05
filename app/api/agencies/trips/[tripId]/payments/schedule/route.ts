import { NextResponse } from "next/server";
import { requireAgencyTripAccess } from "@/lib/require-agency-trip";
import { saveAgencyParticipantPaymentSchedule } from "@/lib/server/record-agency-payment";
import { buildAgencyTripPaymentsPayload } from "@/lib/server/agency-payments-payload";

type Params = { params: { tripId: string } };

function migration() {
  return NextResponse.json({
    needsMigration: true,
    migration: "kaviro_agency_payment_schedule.sql",
  });
}

function isScheduleMigration(msg: string) {
  return msg.includes("payment_schedule");
}

export async function PATCH(req: Request, { params }: Params) {
  const gate = await requireAgencyTripAccess(params.tripId);
  if ("error" in gate) return gate.error;

  try {
    const body = await req.json().catch(() => null);
    const participantId = typeof body?.participantId === "string" ? body.participantId.trim() : "";
    const installments = Array.isArray(body?.installments) ? body.installments : [];

    if (!participantId) {
      return NextResponse.json({ error: "Falta el viajero." }, { status: 400 });
    }
    if (!installments.length) {
      return NextResponse.json({ error: "Añade al menos una cuota." }, { status: 400 });
    }

    const normalized = installments.map(
      (item: { id?: string; label?: string; amount?: unknown; dueAt?: string | null }, index: number) => {
        const amount = Number(item?.amount);
        if (!Number.isFinite(amount) || amount < 0) {
          throw new Error(`Importe no válido en la cuota ${index + 1}.`);
        }
        return {
          id: typeof item?.id === "string" ? item.id : undefined,
          label: typeof item?.label === "string" ? item.label : `Cuota ${index + 1}`,
          amount,
          dueAt: typeof item?.dueAt === "string" ? item.dueAt : null,
        };
      }
    );

    await saveAgencyParticipantPaymentSchedule({
      tripId: params.tripId,
      participantId,
      installments: normalized,
    });

    const built = await buildAgencyTripPaymentsPayload(gate, params.tripId);
    if ("error" in built) return built.error;
    return NextResponse.json(built.payload);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "No se pudo guardar el plan.";
    if (isScheduleMigration(msg)) return migration();
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
