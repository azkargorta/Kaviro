import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/platform-admin";

export async function requireOpsPage(nextPath = "/ops") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (!(await isPlatformAdmin(user.id, user.email))) {
    redirect("/dashboard");
  }

  return { user };
}
