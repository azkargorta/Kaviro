/** Error con código HTTP para handlers que no usan NextResponse directamente en helpers. */
export class ApiHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiHttpError";
    this.status = status;
  }
}

export function resolveHttpErrorStatus(error: unknown, fallback = 500): number {
  return error instanceof ApiHttpError ? error.status : fallback;
}
