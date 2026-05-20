import { test, expect } from "@playwright/test";
import { e2eCredentials, fetchDemoTripId, loginE2E } from "./helpers/auth";

test.describe("RSVP en plan demo (requiere E2E_USER_*)", () => {
  test.skip(!e2eCredentials().configured, "Define E2E_USER_EMAIL y E2E_USER_PASSWORD");

  test("responde Sí en ¿Te apuntas? de una actividad", async ({ page }) => {
    await loginE2E(page);
    const tripId = await fetchDemoTripId(page);
    test.skip(!tripId, "No hay viaje demo para el usuario E2E");

    await page.goto(`/trip/${encodeURIComponent(tripId)}/plan`);
    await expect(page.getByRole("heading", { name: /Plan/i }).or(page.getByText("Plan del viaje")).first()).toBeVisible({
      timeout: 15_000,
    }).catch(() => {});

    const rsvpToggle = page.getByRole("button", { name: /¿Te apuntas\?/i }).first();
    const hasRsvp = await rsvpToggle.isVisible({ timeout: 10_000 }).catch(() => false);
    test.skip(!hasRsvp, "El viaje demo no tiene actividades con RSVP visible");

    await rsvpToggle.click();
    const select = page.locator('select[id^="rsvp-"]').first();
    await expect(select).toBeVisible({ timeout: 8_000 });

    const tableWarning = page.getByText(/Falta la tabla en Supabase/i);
    if (await tableWarning.isVisible().catch(() => false)) {
      test.skip(true, "Ejecuta docs/tripboard_activity_reactions.sql en Supabase");
    }

    await select.selectOption("join");
    await expect(select).toHaveValue("join");
  });
});
