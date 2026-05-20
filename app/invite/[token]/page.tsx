import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";

type Props = { params: { token: string } };

export async function generateMetadata(_: Props): Promise<Metadata> {
  return {
    title: "Te han invitado a Kaviro",
    description: "Únete a Kaviro y organiza tu próximo viaje en grupo con plan, gastos y mapa compartidos.",
  };
}

export default async function InvitePage({ params }: Props) {
  const { token: code } = params;
  const supabase = await createClient();

  // Find the referrer
  const { data: referrer } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("referral_code", code)
    .maybeSingle();

  const referrerName = (referrer as { username?: string; email?: string } | null)?.username
    || (referrer as { username?: string; email?: string } | null)?.email?.split("@")[0]
    || "Un usuario";

  const signupUrl = `/auth/login?ref=${code}&mode=signup`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
      <div className="w-full max-w-sm space-y-6">
        <Image src="/brand/icon.png" alt="Kaviro" width={64} height={64} className="mx-auto rounded-2xl" />

        <div>
          <p className="text-sm font-semibold text-[#F87171]">Invitación de {referrerName}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Organiza viajes sin líos
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {referrerName} te invita a Kaviro — plan del viaje, gastos compartidos, mapa de rutas y asistente IA. Todo en un sitio.
          </p>
        </div>

        {/* Bonus badge */}
        <div className="rounded-2xl border border-[#F87171]/25 bg-[#F87171]/5 px-4 py-3">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">🎁 Bono de bienvenida</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Regístrate con esta invitación y obtén <span className="font-semibold text-[#F87171]">1 mes de Premium gratis</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={signupUrl}
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#F87171] px-6 text-sm font-bold text-white transition hover:bg-[#EF4444]"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
          >
            Ya tengo cuenta → Entrar
          </Link>
        </div>

        <p className="text-[11px] text-slate-400">
          Sin tarjeta de crédito. El mes Premium se activa automáticamente al registrarte.
        </p>
      </div>
    </main>
  );
}
