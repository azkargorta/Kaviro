import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const constructEvent = vi.fn();

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: (name: string) => (name === "stripe-signature" ? "sig_test" : null),
  })),
}));

vi.mock("@/lib/stripe", () => ({
  getStripe: vi.fn(() => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve: vi.fn() },
  })),
}));

vi.mock("@/lib/supabase-admin", () => ({
  createSupabaseAdmin: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(async () => ({ error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(async () => ({ error: null })),
      })),
      insert: vi.fn(async () => ({ error: null })),
    })),
  })),
}));

vi.mock("@/lib/server/agency-trip-payment", () => ({
  markAgencyPaymentPaidFromSession: vi.fn(async () => undefined),
}));

vi.mock("@/lib/server/agency-billing-sync", () => ({
  isAgencyProSubscriptionMetadata: vi.fn(() => false),
  syncAgencyPlanFromSubscription: vi.fn(async () => undefined),
}));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

describe("POST /api/billing/webhook", () => {
  const origSecret = process.env.STRIPE_WEBHOOK_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = origSecret;
  });

  it("devuelve 500 si falta STRIPE_WEBHOOK_SECRET", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const { POST } = await import("../billing/webhook/route");
    const resp = await POST(new Request("http://localhost/api/billing/webhook", { method: "POST", body: "{}" }));
    expect(resp.status).toBe(500);
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("devuelve 400 si la firma Stripe es inválida", async () => {
    constructEvent.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });

    const { POST } = await import("../billing/webhook/route");
    const resp = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: "{}",
      })
    );
    expect(resp.status).toBe(400);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/firma/i);
  });

  it("acepta eventos no gestionados con received: true", async () => {
    constructEvent.mockReturnValueOnce({
      type: "invoice.paid",
      data: { object: {} },
    });

    const { POST } = await import("../billing/webhook/route");
    const resp = await POST(
      new Request("http://localhost/api/billing/webhook", {
        method: "POST",
        body: '{"id":"evt_1"}',
      })
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.received).toBe(true);
  });
});
