import { test, expect } from "@playwright/test";
import { e2eCredentials, loginE2E } from "./helpers/auth";

test.describe("Auth (sin sesión)", () => {
  test("dashboard redirige a login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("login muestra formulario", async ({ page }) => {
    await page.goto("/auth/login");
    await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/auth/register");
  });

  test("register muestra formulario", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
    await expect(page.locator("#register-username")).toBeVisible();
    await expect(page.locator("#register-email")).toBeVisible();
  });

  test("login respeta ?next=", async ({ page }) => {
    await page.goto("/auth/login?next=/pricing");
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/pricing");
  });

  test("cuenta sin confirmar ofrece reenviar el correo", async ({ page }) => {
    await page.route("**/api/auth/login", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Email not confirmed" }),
      });
    });

    await page.goto("/auth/login");
    await page.locator("#login-email").fill("pendiente@example.com");
    await page.locator("#login-password").fill("password123");
    await page.getByRole("button", { name: "Iniciar sesión" }).click();

    await expect(page.getByText(/Todavía falta confirmar tu email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reenviar correo de confirmación" })).toBeVisible();
  });

  test("error de confirmación no expone detalles internos", async ({ page }) => {
    await page.goto("/auth/confirmed?status=error&message=invalid_grant&from=callback");

    await expect(page.getByText("No se pudo confirmar la cuenta")).toBeVisible();
    await expect(page.getByText(/vuelve al login/i)).toBeVisible();
    await expect(page.getByText(/TokenHash|ConfirmationURL|Supabase/i)).toHaveCount(0);
  });
});

test.describe("Auth (opcional con credenciales E2E)", () => {
  test.skip(!e2eCredentials().configured, "Define E2E_USER_EMAIL y E2E_USER_PASSWORD para este test");

  test("login con credenciales llega al dashboard", async ({ page }) => {
    await loginE2E(page);
    await expect(page.getByRole("heading", { name: /Mis viajes/i })).toBeVisible();
  });
});
