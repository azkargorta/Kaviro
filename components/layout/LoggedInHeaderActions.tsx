"use client";

import UserNotificationsButton from "@/components/notifications/UserNotificationsButton";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";

type Props = {
  /** Botones translúcidos sobre fondo coral (hero de viaje / dashboard). */
  heroMode?: boolean;
  /** Si no se pasa, el menú consulta /api/admin/me. */
  isAdmin?: boolean;
  /** Ocultar campana suelta cuando Novedades ya incluye notificaciones (p. ej. dentro de un viaje). */
  showNotifications?: boolean;
};

export default function LoggedInHeaderActions({
  heroMode = false,
  isAdmin,
  showNotifications = true,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {showNotifications ? <UserNotificationsButton heroMode={heroMode} /> : null}
      <DashboardPageHeader isAdmin={isAdmin} heroMode={heroMode} />
    </div>
  );
}
