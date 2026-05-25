"use client";

import UserNotificationsButton from "@/components/notifications/UserNotificationsButton";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

type Props = {
  /** Botones translúcidos sobre fondo coral (hero de viaje / dashboard). */
  heroMode?: boolean;
  /** Si no se pasa, el menú consulta /api/admin/me. */
  isAdmin?: boolean;
};

export default function LoggedInHeaderActions({ heroMode = false, isAdmin }: Props) {
  return (
    <div className="flex items-center gap-2">
      <UserNotificationsButton heroMode={heroMode} />
      <DashboardPageHeader isAdmin={isAdmin} heroMode={heroMode} />
    </div>
  );
}
