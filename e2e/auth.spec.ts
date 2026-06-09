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
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Contraseña")).toBeVisible();
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear cuenta" })).toHaveAttribute("href", "/auth/register");
  });

  test("register muestra formulario", async ({ page }) => {
    await page.goto("/auth/register");
    await expect(page.getByRole("heading", { name: "Crear cuenta" })).toBeVisible();
    await expect(page.getByLabel("Nombre de usuario")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("login respeta ?next=", async ({ page }) => {
    await page.goto("/auth/login?next=/pricing");
    await expect(page).toHaveURL(/\/auth\/login/);
    expect(new URL(page.url()).searchParams.get("next")).toBe("/pricing");
  });
});

test.describe("Auth (opcional con credenciales E2E)", () => {
  test.skip(!e2eCredentials().configured, "Define E2E_USER_EMAIL y E2E_USER_PASSWORD para este test");

  test("login con credenciales llega al dashboard", async ({ page }) => {
    await loginE2E(page);
    await expect(page.getByRole("heading", { name: /Mis viajes/i })).toBeVisible();
  });
});
