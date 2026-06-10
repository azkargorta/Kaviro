import { test, expect } from "@playwright/test";

test.describe("Centro de ayuda", () => {
  test("página principal con FAQ y feedback", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("heading", { name: "Centro de ayuda" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Asistente IA \(Premium\)/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Análisis de documentos \(Premium\)/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Enviar feedback" })).toBeVisible();
  });

  test("enlace a guía recap", async ({ page }) => {
    await page.goto("/help");
    await expect(page.getByRole("link", { name: /Recap del viaje/i })).toHaveAttribute("href", "/help/recap");
  });
});
