"use client";

import { Component, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onReset?: () => void;
};

type State = { error: Error | null };

/** Evita que un fallo del asistente tire abajo toda la pestaña del viaje. */
export default class TripAiAssistantErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Kaviro] Asistente IA:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/80 px-4 py-6 text-center dark:border-red-900/40 dark:bg-red-950/20">
          <p className="text-sm font-bold text-red-900 dark:text-red-200">No se pudo abrir el asistente</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-red-800/90 dark:text-red-300/90">
            {this.state.error.message || "Error inesperado al cargar el chat."}
          </p>
          <button
            type="button"
            className="mt-4 inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset?.();
            }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
