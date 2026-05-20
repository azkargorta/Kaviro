import { test, expect } from "@playwright/test";

test.describe("Páginas públicas", () => {
  test("landing: hero y CTA sin login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /organizado/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Crear mi viaje gratis|Empezar gratis/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Precios" }).first()).toBeVisible();
  });

  test("pricing: planes y FAQ", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Organiza gratis/i })).toBeVisible();
    await expect(page.getByText("Plan gratuito")).toBeVisible();
    await expect(page.getByText("Plan Premium")).toBeVisible();
    await expect(page.getByText("Preguntas frecuentes")).toBeVisible();
  });

  test("pricing enlaza a registro", async ({ page }) => {
    await page.goto("/pricing");
    const register = page.getByRole("link", { name: /Crear cuenta gratis|Empezar gratis/i }).first();
    await expect(register).toHaveAttribute("href", /\/auth\/register/);
  });
});
