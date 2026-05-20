import Link from "next/link";

export default function PublicMarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-[#1E293B] dark:bg-[#080C14]">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white">Kaviro</span> · Organiza viajes, gastos y rutas
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Inicio
          </Link>
          <Link href="/help" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Ayuda
          </Link>
          <Link href="/pricing" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Precios
          </Link>
          <Link href="/auth/login" className="text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            Entrar
          </Link>
          <Link href="/auth/register" className="font-semibold text-[var(--brand)] transition hover:text-[var(--brand-hover)]">
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </footer>
  );
}
