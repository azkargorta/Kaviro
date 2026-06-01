export type ParticipantImportRow = {
  display_name: string;
  email: string | null;
  phone: string | null;
};

export type ParticipantImportDraft = ParticipantImportRow & {
  id: string;
  selected: boolean;
  warning?: string;
};

export type BulkImportResult = {
  created: number;
  skipped: number;
  errors: Array<{ display_name: string; error: string }>;
};
