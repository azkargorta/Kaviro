import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";
import { defaultLoginNext, parseWorkspaceModeParam } from "@/lib/workspace-mode";

type Props = {
  searchParams?: { next?: string; mode?: string };
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mode = parseWorkspaceModeParam(searchParams?.mode);

  if (user) {
    const next = searchParams?.next;
    const dest =
      next && next.startsWith("/") && !next.startsWith("//") ? next : defaultLoginNext(mode);
    redirect(dest);
  }

  const isAgency = mode === "agency";

  return (
    <AuthShell
      title={isAgency ? "Acceso agencias" : "Iniciar sesión"}
      subtitle={
        isAgency
          ? "Entra al panel de tu organización (modo empresa)"
          : "Accede a tu cuenta de Kaviro"
      }
    >
      <LoginForm />
    </AuthShell>
  );
}