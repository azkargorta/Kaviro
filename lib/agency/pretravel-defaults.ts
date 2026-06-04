export type PretravelFieldType = "text" | "textarea" | "email" | "phone" | "date" | "select";

export type PretravelFieldDef = {
  field_key: string;
  label: string;
  field_type: PretravelFieldType;
  required: boolean;
  options?: string[] | null;
  sort_order: number;
};

export const DEFAULT_PRETRAVEL_FIELDS: PretravelFieldDef[] = [
  {
    field_key: "dietary_restrictions",
    label: "Restricciones alimentarias",
    field_type: "textarea",
    required: false,
    sort_order: 0,
  },
  {
    field_key: "allergies",
    label: "Alergias",
    field_type: "textarea",
    required: false,
    sort_order: 1,
  },
  {
    field_key: "emergency_contact_name",
    label: "Contacto de emergencia (nombre)",
    field_type: "text",
    required: true,
    sort_order: 2,
  },
  {
    field_key: "emergency_contact_phone",
    label: "Contacto de emergencia (teléfono)",
    field_type: "phone",
    required: true,
    sort_order: 3,
  },
  {
    field_key: "passport_number",
    label: "Número de pasaporte / DNI",
    field_type: "text",
    required: false,
    sort_order: 4,
  },
  {
    field_key: "passport_expiry",
    label: "Caducidad del documento",
    field_type: "date",
    required: false,
    sort_order: 5,
  },
  {
    field_key: "merch_size",
    label: "Talla de ropa (merchandising del grupo)",
    field_type: "select",
    required: false,
    options: ["XS", "S", "M", "L", "XL", "XXL"],
    sort_order: 6,
  },
];

export function generatePretravelToken(): string {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function pretravelPublicPath(token: string) {
  return `/pretravel/${token}`;
}
