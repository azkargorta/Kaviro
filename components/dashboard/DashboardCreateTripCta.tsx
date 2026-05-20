"use client";

import { btnPrimary } from "@/components/ui/brandStyles";
import { openCreateTripForm } from "@/lib/open-create-trip";
import { Plus } from "lucide-react";

type Props = {
  disabled?: boolean;
};

export default function DashboardCreateTripCta({ disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        openCreateTripForm();
      }}
      className={`animate-dash-primary-once w-full motion-reduce:animate-none ${btnPrimary}`}
    >
      <Plus className="h-5 w-5 opacity-95" aria-hidden />
      Crear viaje
    </button>
  );
}
