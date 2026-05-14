"use client";

import { Search } from "lucide-react";

// Fires a custom event that CommandPalette listens to — no prop drilling needed
export default function CommandPaletteButton() {
  function handleClick() {
    document.dispatchEvent(new CustomEvent("kaviro:open-palette"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Buscar"
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:bg-[var(--surface-page)] dark:border-[#334155] dark:bg-[#0F1623]"
    >
      <Search className="h-4 w-4" />
    </button>
  );
}
