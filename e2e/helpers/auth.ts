import { expect, type Page } from "@playwright/test";

export function e2eCredentials() {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;
  return { email, password, configured: Boolean(email && password) };
}

export async function loginE2E(page: Page) {
  const { email, password, configured } = e2eCredentials();
  if (!configured) {
    throw new Error("Define E2E_USER_EMAIL y E2E_USER_PASSWORD para este test");
  }
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email!);
  await page.getByLabel("Contraseña").fill(password!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
}

/** Evita redirección al tour demo en tests que necesitan el dashboard. */
export async function completeDemoOnboardingApi(page: Page) {
  await page.evaluate(async () => {
    await fetch("/api/onboarding/demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete" }),
      credentials: "include",
    });
  });
}

export async function ensureDashboard(page: Page) {
  await completeDemoOnboardingApi(page);
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Mis viajes/i })).toBeVisible({ timeout: 15_000 });
}

export async function fetchDemoTripId(page: Page): Promise<string> {
  const data = await page.evaluate(async () => {
    const r = await fetch("/api/onboarding/demo", { credentials: "include" });
    return r.json();
  });
  return String(data?.tripId || "");
}
