import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { "content-type": "application/json" },
      }),
  },
}));

const sendTransactionalEmail = vi.fn();
vi.mock("@/lib/email/send-transactional-email", () => ({
  sendTransactionalEmail,
  buildAgencyAccessRequestEmailHtml: vi.fn(() => "<p>test</p>"),
}));

const insertPlatformLead = vi.fn();
vi.mock("@/lib/server/platform-ops-data", () => ({ insertPlatformLead }));

async function readJson(resp: Response) {
  const text = await resp.text();
  return text ? JSON.parse(text) : null;
}

const validBody = {
  name: "Ana García",
  agencyName: "Viajes Norte",
  email: "ana@agencia.com",
  groupsPerYear: "10-20",
  message: "Quiero probar Kaviro Trips",
};

describe("POST /api/contact/agency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendTransactionalEmail.mockResolvedValue({ sent: true });
    insertPlatformLead.mockResolvedValue(undefined);
  });

  it("devuelve 400 si falta el nombre de la agencia", async () => {
    const { POST } = await import("../contact/agency/route");
    const resp = await POST(
      new Request("http://localhost/api/contact/agency", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validBody, agencyName: "A" }),
      })
    );
    expect(resp.status).toBe(400);
    const payload = await readJson(resp);
    expect(String(payload?.error || "")).toMatch(/agencia/i);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("devuelve 400 si el email no es válido", async () => {
    const { POST } = await import("../contact/agency/route");
    const resp = await POST(
      new Request("http://localhost/api/contact/agency", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...validBody, email: "malformado" }),
      })
    );
    expect(resp.status).toBe(400);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("devuelve 503 si el envío de email falla", async () => {
    sendTransactionalEmail.mockResolvedValueOnce({ sent: false, error: "smtp down" });

    const { POST } = await import("../contact/agency/route");
    const resp = await POST(
      new Request("http://localhost/api/contact/agency", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(resp.status).toBe(503);
    expect(insertPlatformLead).not.toHaveBeenCalled();
  });

  it("registra el lead y responde ok cuando el email se envía", async () => {
    const { POST } = await import("../contact/agency/route");
    const resp = await POST(
      new Request("http://localhost/api/contact/agency", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(validBody),
      })
    );
    expect(resp.status).toBe(200);
    const payload = await readJson(resp);
    expect(payload?.ok).toBe(true);
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
    expect(insertPlatformLead).toHaveBeenCalledWith(
      expect.objectContaining({
        contactName: validBody.name,
        agencyName: validBody.agencyName,
        email: validBody.email,
      })
    );
  });
});
