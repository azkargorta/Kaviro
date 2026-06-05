import OpsSqlMigrationsClient from "@/components/ops/OpsSqlMigrationsClient";

export default function OpsMigrationsPage() {
  return (
    <div className="space-y-2">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Migraciones SQL</h2>
      <OpsSqlMigrationsClient />
    </div>
  );
}
