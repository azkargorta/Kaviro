type Props = {
  moduleLabel: string;
};

export default function TripReadOnlyBanner({ moduleLabel }: Props) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-200"
      role="status"
    >
      <p>
        Tienes acceso de <strong>lectura</strong> a {moduleLabel}. Para crear o editar, pide al organizador que
        active el permiso correspondiente en <strong>Gente → permisos</strong>.
      </p>
    </div>
  );
}
