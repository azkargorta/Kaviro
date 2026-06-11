"use client";

import UserNotificationsButton from "@/components/notifications/UserNotificationsButton";
import DashboardPageHeader from "@/components/dashboard/DashboardPageHeader";
import DashboardNewTripButton from "@/components/dashboard/DashboardNewTripButton";

type Props = {
  heroMode?: boolean;
  isAdmin?: boolean;
  showNotifications?: boolean;
  showNewTripButton?: boolean;
  newTripDisabled?: boolean;
};

export default function LoggedInHeaderActions({
  heroMode = false,
  isAdmin,
  showNotifications = true,
  showNewTripButton = false,
  newTripDisabled = false,
}: Props) {
  return (
    <div className="flex items-center gap-2">
      {showNewTripButton ? (
        <DashboardNewTripButton heroMode={heroMode} disabled={newTripDisabled} />
      ) : null}
      {showNotifications ? <UserNotificationsButton heroMode={heroMode} /> : null}
      <DashboardPageHeader isAdmin={isAdmin} heroMode={heroMode} />
    </div>
  );
}
