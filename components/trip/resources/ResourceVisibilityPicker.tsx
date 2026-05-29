"use client";

import type { ResourceVisibility } from "@/lib/trip-resources/visibility";
import type { TripParticipant } from "@/hooks/useTripParticipants";

type Props = {
  visibility: ResourceVisibility;
  onVisibilityChange: (value: ResourceVisibility) => void;
  selectedUserIds: string[];
  onSelectedUserIdsChange: (ids: string[]) => void;
  participants: TripParticipant[];
  currentUserId: string | null;
  disabled?: boolean;
};

function participantLabel(participant: TripParticipant) {
  return participant.display_name?.trim() || participant.username?.trim() || participant.email || "Viajero";
}

export default function ResourceVisibilityPicker({
  visibility,
  onVisibilityChange,
  selectedUserIds,
  onSelectedUserIdsChange,
  participants,
  currentUserId,
  disabled = false,
}: Props) {
  const selectable = participants.filter(
    (p) => p.status !== "removed" && typeof p.user_id === "string" && p.user_id && p.user_id !== currentUserId
  );

  function toggleUser(userId: string) {
    if (selectedUserIds.includes(userId)) {
      onSelectedUserIdsChange(selectedUserIds.filter((id) => id !== userId));
    } else {
      onSelectedUserIdsChange([...selectedUserIds, userId]);
    }
  }

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quién puede ver este documento</legend>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-[#334155]">
        <input
          type="radio"
          name="resource-visibility"
          className="mt-1"
          checked={visibility === "trip"}
          onChange={() => onVisibilityChange("trip")}
        />
        <span>
          <span className="block text-sm font-medium text-slate-900 dark:text-white">Todos los viajeros</span>
          <span className="block text-xs text-slate-500">Cualquier participante del viaje puede verlo y abrirlo.</span>
        </span>
      </label>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-[#334155]">
        <input
          type="radio"
          name="resource-visibility"
          className="mt-1"
          checked={visibility === "selected"}
          onChange={() => onVisibilityChange("selected")}
        />
        <span>
          <span className="block text-sm font-medium text-slate-900 dark:text-white">Solo algunos viajeros</span>
          <span className="block text-xs text-slate-500">Tú siempre lo verás; elige quién más puede acceder.</span>
        </span>
      </label>

      {visibility === "selected" ? (
        <div className="ml-1 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-[#334155] dark:bg-[#080C14]">
          {selectable.length === 0 ? (
            <p className="text-xs text-slate-500">No hay otros viajeros con cuenta vinculada en este viaje.</p>
          ) : (
            selectable.map((participant) => {
              const userId = participant.user_id as string;
              return (
                <label key={participant.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(userId)}
                    onChange={() => toggleUser(userId)}
                  />
                  {participantLabel(participant)}
                </label>
              );
            })
          )}
        </div>
      ) : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-[#334155]">
        <input
          type="radio"
          name="resource-visibility"
          className="mt-1"
          checked={visibility === "private"}
          onChange={() => onVisibilityChange("private")}
        />
        <span>
          <span className="block text-sm font-medium text-slate-900 dark:text-white">Solo yo</span>
          <span className="block text-xs text-slate-500">El resto del viaje no verá este documento en la lista.</span>
        </span>
      </label>
    </fieldset>
  );
}
