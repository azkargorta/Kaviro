import { useEffect, useState } from "react";

/** Sincroniza fin ≥ inicio y expone validación para formularios de viaje. */
export function useSyncedTripDates(initialStart = "", initialEnd = "") {
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);

  useEffect(() => {
    if (!startDate) return;
    if (!endDate || endDate < startDate) {
      setEndDate(startDate);
    }
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  function validateDates(): string | null {
    if (startDate && endDate && startDate > endDate) {
      return "La fecha de fin debe ser igual o posterior a la fecha de inicio.";
    }
    return null;
  }

  return {
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    endDateMin: startDate || undefined,
    validateDates,
  };
}
