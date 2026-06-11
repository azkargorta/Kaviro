"use client";

import ExpenseForm from "@/components/trip/expenses/ExpenseForm";
import type { ExpenseFormInput } from "@/hooks/useTripExpenses";
import type { ExpenseDetectedData } from "@/components/trip/expenses/ExpenseAnalyzerPanel";
import type { ExpenseAnalysis } from "@/hooks/useTripExpenses";

type ExistingExpense = {
  id?: string;
  title?: string | null;
  category?: string | null;
  payer_name?: string | null;
  participant_names?: string[] | null;
  paid_by_names?: string[] | null;
  owed_by_names?: string[] | null;
  owed_amounts?: Record<string, number> | null;
  paid_amounts?: Record<string, number> | null;
  amount?: number | null;
  currency?: string | null;
  expense_date?: string | null;
  notes?: string | null;
  attachment_name?: string | null;
  analysis_data?: ExpenseAnalysis | null;
};

type Props = {
  saving?: boolean;
  existingParticipants: string[];
  registeredTravelers?: string[];
  baseCurrency?: string;
  editingExpense?: ExistingExpense | null;
  detectedData?: ExpenseDetectedData | null;
  isPremium?: boolean;
  onCancelEdit?: () => void;
  onSubmit: (input: ExpenseFormInput) => Promise<void>;
};

/**
 * Formulario de gastos optimizado para móvil (3 pasos: ticket → reparto → resumen).
 * Se usa dentro del bottom sheet de la pantalla Gastos.
 */
export default function MobileExpenseSheet(props: Props) {
  return <ExpenseForm {...props} />;
}
