/**
 * Supabase placeholder para CI / E2E sin proyecto real.
 * El cliente debe instanciarse; las peticiones de auth devuelven sin sesión.
 * Mantener en sync con .github/workflows/ci.yml
 */
export const E2E_SUPABASE_PLACEHOLDER = {
  NEXT_PUBLIC_SUPABASE_URL: "https://ci-e2e-placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
} as const;

export function withE2eSupabaseEnv(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return env;
  }
  return { ...env, ...E2E_SUPABASE_PLACEHOLDER };
}
