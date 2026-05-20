import { test, expect } from "@playwright/test";
import { e2eCredentials, ensureDashboard, loginE2E } from "./helpers/auth";

test.describe("Crear viaje (requiere E2E_USER_*)", () => {
  test.skip(!e2eCredentials().configured, "Define E2E_USER_EMAIL y E2E_USER_PASSWORD");

  test("crea viaje y muestra checklist de configuración", async ({ page }) => {
    await loginE2E(page);
    await ensureDashboard(page);

    const limitBanner = page.getByText(/límite.*viajes|máximo.*viajes/i);
    if (await limitBanner.isVisible().catch(() => false)) {
      test.skip(true, "Usuario E2E alcanzó el límite de viajes gratuitos");
    }

    await page.goto("/dashboard#create-trip");
    const tripName = `E2E ${Date.now()}`;
    await page.getByLabel("Nombre del viaje").fill(tripName);
    await page.getByRole("button", { name: "Crear viaje" }).click();

    await expect(page).toHaveURL(/\/trip\/[^/]+\/summary/, { timeout: 25_000 });
    await expect(page.getByText("Configura tu viaje")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/pasos/i).first()).toBeVisible();
  });
});
