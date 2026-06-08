import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import KaviroMark from "@/components/brand/KaviroMark";
import type { Metadata } from "next";

type Props = { params: { token: string } };

function acceptNextPath(token: string) {
  return `/api/trip-invites/accept-redirect?token=${encodeURIComponent(token)}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const admin = getServiceRoleClient();
  const { data: invite } = await admin
    .from("trip_invites")
    .select("display_name")
    .eq("token", params.token)
    .maybeSingle();

  if (invite) {
    return {
      title: "Te han invitado a un viaje en Kaviro",
      description: "Únete al viaje y accede al plan, gastos y mapa compartidos.",
    };
  }

  return {
    title: "Te han invitado a Kaviro",
    description: "Únete a Kaviro y organiza tu próximo viaje en grupo.",
  };
}

export default async function InvitePage({ params }: Props) {
  const { token } = params;
  const admin = getServiceRoleClient();

  const { data: tripInvite } = await admin
    .from("trip_invites")
    .select("id, trip_id, display_name, status, expires_at")
    .eq("token", token)
    .maybeSingle();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (tripInvite) {
    const expired =
      tripInvite.expires_at && new Date(tripInvite.expires_at as string).getTime() < Date.now();
    const alreadyAccepted = tripInvite.status === "accepted";

    const { data: trip } = await admin
      .from("trips")
      .select("name, destination")
      .eq("id", tripInvite.trip_id as string)
      .maybeSingle();

    const tripName = (trip?.name as string) || "un viaje";
    const destination = (trip?.destination as string) || null;
    const inviteeName = (tripInvite.display_name as string) || "Viajero";
    const nextPath = acceptNextPath(token);
    const registerUrl = `/auth/register?next=${encodeURIComponent(nextPath)}`;
    const loginUrl = `/auth/login?next=${encodeURIComponent(nextPath)}`;

    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
        <div className="w-full max-w-sm space-y-6">
          <KaviroMark size={64} className="mx-auto rounded-2xl" title="Kaviro" />

          <div>
            <p className="text-sm font-semibold text-[#0B5CFF]">Invitación al viaje</p>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {tripName}
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Te invitan a unirte como <span className="font-semibold">{inviteeName}</span>
              {destination ? ` · ${destination}` : ""}. Al entrar verás el plan, gastos y mapa del grupo.
            </p>
          </div>

          {expired ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Esta invitación ha caducado. Pide al organizador un enlace nuevo.
            </div>
          ) : alreadyAccepted && user ? (
            <div className="flex flex-col gap-3">
              <Link
                href={nextPath}
                className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0B5CFF] px-6 text-sm font-bold text-white transition hover:bg-[#094bcc]"
              >
                Ir al viaje
              </Link>
            </div>
          ) : user ? (
            <div className="flex flex-col gap-3">
              <Link
                href={nextPath}
                className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0B5CFF] px-6 text-sm font-bold text-white transition hover:bg-[#094bcc]"
              >
                Unirme al viaje
              </Link>
              <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400">
                Ir al panel
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href={registerUrl}
                className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[#0B5CFF] px-6 text-sm font-bold text-white transition hover:bg-[#094bcc]"
              >
                Crear cuenta y unirme
              </Link>
              <Link
                href={loginUrl}
                className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
              >
                Ya tengo cuenta → Entrar
              </Link>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Fallback: código de referido (invitación a la plataforma)
  const { data: referrer } = await supabase
    .from("profiles")
    .select("username, email")
    .eq("referral_code", token)
    .maybeSingle();

  const referrerName =
    (referrer as { username?: string; email?: string } | null)?.username ||
    (referrer as { username?: string; email?: string } | null)?.email?.split("@")[0] ||
    null;

  if (!referrerName) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
        <div className="w-full max-w-sm space-y-4">
          <KaviroMark size={64} className="mx-auto rounded-2xl" title="Kaviro" />
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Enlace no válido</h1>
          <p className="text-sm text-slate-500">
            No encontramos esta invitación. Pide al organizador que te envíe el enlace de nuevo.
          </p>
          <Link href="/auth/login" className="text-sm font-semibold text-[#0B5CFF] hover:underline">
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  const signupUrl = `/auth/login?ref=${token}&mode=signup`;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-[var(--surface-page)] px-6 text-center">
      <div className="w-full max-w-sm space-y-6">
        <KaviroMark size={64} className="mx-auto rounded-2xl" title="Kaviro" />

        <div>
          <p className="text-sm font-semibold text-[#F87171]">Invitación de {referrerName}</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Organiza viajes sin líos
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {referrerName} te invita a Kaviro — plan del viaje, gastos compartidos, mapa de rutas y asistente IA.
          </p>
        </div>

        <div className="rounded-2xl border border-[#F87171]/25 bg-[#F87171]/5 px-4 py-3">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">🎁 Bono de bienvenida</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Regístrate y obtén <span className="font-semibold text-[#F87171]">1 mes de Premium gratis</span>.
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
      </div>
    </main>
  );
}
