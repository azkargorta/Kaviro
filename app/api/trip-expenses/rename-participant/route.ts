import { NextResponse } from "next/server";
import { forbidUnlessCanManageExpenses, requireTripAccessApi } from "@/lib/trip-access-api";

/** Reemplaza todas las ocurrencias de `oldName` por `newName` en un array de strings. */
function replaceInArray(arr: unknown, oldName: string, newName: string): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((v) => (typeof v === "string" && v === oldName ? newName : v));
}

/** Reemplaza la clave `oldName` por `newName` en un objeto { [name]: number }. */
function replaceInAmountMap(
  obj: unknown,
  oldName: string,
  newName: string
): Record<string, number> | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
    const newKey = key === oldName ? newName : key;
    result[newKey] = typeof val === "number" ? val : Number(val);
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tripId, fromName, toName } = body as {
      tripId?: string;
      fromName?: string;
      toName?: string;
    };

    if (!tripId || !fromName || !toName) {
      return NextResponse.json(
        { error: "Faltan parámetros: tripId, fromName, toName" },
        { status: 400 }
      );
    }
    if (fromName.trim() === toName.trim()) {
      return NextResponse.json({ updatedExpenses: 0, updatedSettlements: 0 });
    }

    const gate = await requireTripAccessApi(tripId);
    if (!gate.ok) return gate.response;

    const forbidden = forbidUnlessCanManageExpenses(
      gate.access,
      "No tienes permisos para modificar gastos."
    );
    if (forbidden) return forbidden;

    const { supabase } = gate;
    const from = fromName.trim();
    const to = toName.trim();

    // ── 1. Gastos ──────────────────────────────────────────────────────────────
    const { data: expenses, error: fetchErr } = await supabase
      .from("trip_expenses")
      .select("id, payer_name, participant_names, paid_by_names, owed_by_names, owed_amounts, paid_amounts")
      .eq("trip_id", tripId);

    if (fetchErr) throw new Error(fetchErr.message);

    const toUpdate: Array<{
      id: string;
      payer_name?: string;
      participant_names?: string[];
      paid_by_names?: string[];
      owed_by_names?: string[];
      owed_amounts?: Record<string, number> | null;
      paid_amounts?: Record<string, number> | null;
    }> = [];

    for (const exp of expenses ?? []) {
      const patch: (typeof toUpdate)[number] = { id: exp.id };
      let changed = false;

      if (exp.payer_name === from) { patch.payer_name = to; changed = true; }

      const pn = replaceInArray(exp.participant_names, from, to);
      if (JSON.stringify(pn) !== JSON.stringify(exp.participant_names)) { patch.participant_names = pn; changed = true; }

      const pb = replaceInArray(exp.paid_by_names, from, to);
      if (JSON.stringify(pb) !== JSON.stringify(exp.paid_by_names)) { patch.paid_by_names = pb; changed = true; }

      const ob = replaceInArray(exp.owed_by_names, from, to);
      if (JSON.stringify(ob) !== JSON.stringify(exp.owed_by_names)) { patch.owed_by_names = ob; changed = true; }

      const oa = replaceInAmountMap(exp.owed_amounts, from, to);
      if (oa && JSON.stringify(oa) !== JSON.stringify(exp.owed_amounts)) { patch.owed_amounts = oa; changed = true; }

      const pa = replaceInAmountMap(exp.paid_amounts, from, to);
      if (pa && JSON.stringify(pa) !== JSON.stringify(exp.paid_amounts)) { patch.paid_amounts = pa; changed = true; }

      if (changed) toUpdate.push(patch);
    }

    for (const patch of toUpdate) {
      const { id, ...fields } = patch;
      await supabase.from("trip_expenses").update(fields).eq("id", id);
    }

    // ── 2. Settlements ─────────────────────────────────────────────────────────
    await supabase
      .from("trip_expense_settlements")
      .update({ debtor_name: to })
      .eq("trip_id", tripId)
      .eq("debtor_name", from);

    await supabase
      .from("trip_expense_settlements")
      .update({ creditor_name: to })
      .eq("trip_id", tripId)
      .eq("creditor_name", from);

    return NextResponse.json({
      ok: true,
      updatedExpenses: toUpdate.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
