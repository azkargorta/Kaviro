import { createSupabaseAdmin } from "@/lib/supabase-admin";
import {
  SQL_MIGRATION_CATALOG,
  type SqlMigrationCheck,
  type SqlMigrationDefinition,
} from "@/lib/sql-migration-catalog";

export type SqlMigrationStatus = "ok" | "missing" | "error";

export type SqlMigrationHealthRow = {
  id: string;
  file: string;
  label: string;
  group: SqlMigrationDefinition["group"];
  order: number;
  optional?: boolean;
  status: SqlMigrationStatus;
  detail?: string;
};

function isMissingSchemaError(message: string, check: SqlMigrationCheck): boolean {
  const m = message.toLowerCase();
  if (m.includes("does not exist") || m.includes("could not find")) return true;
  if (check.kind === "table" && m.includes(check.table)) return true;
  if (check.kind === "column" && m.includes(check.column)) return true;
  return false;
}

async function runCheck(
  admin: ReturnType<typeof createSupabaseAdmin>,
  check: SqlMigrationCheck
): Promise<{ status: SqlMigrationStatus; detail?: string }> {
  try {
    if (check.kind === "table") {
      const { error } = await admin.from(check.table).select("id", { head: true, count: "exact" }).limit(0);
      if (!error) return { status: "ok" };
      if (error.code === "42P01" || isMissingSchemaError(error.message, check)) {
        return { status: "missing", detail: `Tabla ${check.table} no encontrada` };
      }
      return { status: "ok", detail: error.message };
    }

    const { error } = await admin.from(check.table).select(check.column, { head: true }).limit(0);
    if (!error) return { status: "ok" };
    if (isMissingSchemaError(error.message, check)) {
      return { status: "missing", detail: `Columna ${check.table}.${check.column} no encontrada` };
    }
    return { status: "ok", detail: error.message };
  } catch (e) {
    return {
      status: "error",
      detail: e instanceof Error ? e.message : "Error de comprobación",
    };
  }
}

export async function getSqlMigrationHealth(): Promise<{
  rows: SqlMigrationHealthRow[];
  summary: { ok: number; missing: number; error: number; missingRequired: number };
}> {
  const admin = createSupabaseAdmin();
  const rows: SqlMigrationHealthRow[] = [];

  for (const def of SQL_MIGRATION_CATALOG) {
    const result = await runCheck(admin, def.check);
    rows.push({
      id: def.id,
      file: def.file,
      label: def.label,
      group: def.group,
      order: def.order,
      optional: def.optional,
      status: result.status,
      detail: result.detail,
    });
  }

  rows.sort((a, b) => a.order - b.order);

  const missing = rows.filter((r) => r.status === "missing");
  const missingRequired = missing.filter((r) => !r.optional).length;

  return {
    rows,
    summary: {
      ok: rows.filter((r) => r.status === "ok").length,
      missing: missing.length,
      error: rows.filter((r) => r.status === "error").length,
      missingRequired,
    },
  };
}
