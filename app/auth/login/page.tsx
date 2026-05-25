import { redirect } from "next/navigation";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams?: { next?: string };
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const next = searchParams?.next;
    const dest = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
    redirect(dest);
  }

  return (
    <AuthShell
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta de Kaviro"
    >
      <LoginForm />
    </AuthShell>
  );
}