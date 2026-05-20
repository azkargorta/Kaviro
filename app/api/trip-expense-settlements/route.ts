 import { NextResponse } from "next/server";
 import { forbidUnlessCanManageExpenses, requireTripAccessApi } from "@/lib/trip-access-api";
 
 export async function POST(request: Request) {
   try {
     const body = await request.json();
     const tripId = typeof body?.tripId === "string" ? body.tripId : body?.trip_id;
     if (!tripId) return NextResponse.json({ error: "Falta tripId" }, { status: 400 });
 
     const gate = await requireTripAccessApi(tripId);
     if (!gate.ok) return gate.response;
     const forbidden = forbidUnlessCanManageExpenses(gate.access, "No tienes permisos para actualizar pagos.");
     if (forbidden) return forbidden;
 
     const { supabase } = gate;
     const settlement = body?.settlement;
     if (!settlement) return NextResponse.json({ error: "Falta settlement" }, { status: 400 });
 
     const newStatus = settlement.status === "paid" ? "pending" : "paid";
 
     if (settlement.id && typeof settlement.id === "string" && !settlement.id.includes("->")) {
       const { error } = await supabase
         .from("trip_expense_settlements")
         .update({ status: newStatus, paid_at: newStatus === "paid" ? new Date().toISOString() : null })
         .eq("id", settlement.id)
         .eq("trip_id", tripId);
       if (error) throw new Error(error.message);
     } else {
       const { error } = await supabase.from("trip_expense_settlements").insert({
         trip_id: tripId,
         debtor_name: settlement.debtor_name,
         creditor_name: settlement.creditor_name,
         amount: settlement.amount,
         currency: settlement.currency,
         status: newStatus,
         source_balance_key: settlement.source_balance_key,
         paid_at: newStatus === "paid" ? new Date().toISOString() : null,
       });
       if (error) throw new Error(error.message);
     }
 
     return NextResponse.json({ ok: true, status: newStatus });
   } catch (error) {
     return NextResponse.json(
       { error: error instanceof Error ? error.message : "No se pudo actualizar el estado del pago." },
       { status: 500 }
     );
   }
 }
 
