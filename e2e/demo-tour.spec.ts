import { test, expect } from "@playwright/test";
import { completeDemoOnboardingApi, e2eCredentials, loginE2E } from "./helpers/auth";

test.describe("Tour demo (requiere E2E_USER_*)", () => {
  test.skip(!e2eCredentials().configured, "Define E2E_USER_EMAIL y E2E_USER_PASSWORD");

  test("inicia tour desde dashboard y muestra bienvenida", async ({ page }) => {
    await loginE2E(page);
    await completeDemoOnboardingApi(page);
    await page.goto("/dashboard");

    const startTour = page.getByRole("link", { name: "Iniciar tour" });
    await expect(startTour).toBeVisible({ timeout: 15_000 });
    await startTour.click();

    await expect(page).toHaveURL(/tutorial=demo/, { timeout: 15_000 });
    await expect(page.getByText("Bienvenido a Kaviro")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByText(/Barra del viaje/i)).toBeVisible({ timeout: 10_000 });
  });
});
