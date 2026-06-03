"use client";

import { useEffect, useMemo, useState } from "react";
import { useIsDemoTrip } from "@/components/trip/TripDemoContext";
import type { DetectedDocumentData } from "@/lib/document-analyzer";
import {
  useTripResources,
  type TripReservation,
} from "@/hooks/useTripResources";
import DocumentAnalyzerPanel from "@/components/trip/resources/DocumentAnalyzerPanel";
import ResourceUploadForm from "@/components/trip/resources/ResourceUploadForm";
import ResourceList from "@/components/trip/resources/ResourceList";
import ReservationList from "@/components/trip/resources/ReservationList";
import TripListsPanel from "@/components/trip/lists/TripListsPanel";
import ReservationTemplateSelector, {
  type ReservationTemplateType,
} from "@/components/trip/resources/ReservationTemplateSelector";
import LodgingReservationForm from "@/components/trip/resources/LodgingReservationForm";
import TransportReservationForm from "@/components/trip/resources/TransportReservationForm";
import ActivityReservationForm from "@/components/trip/resources/ActivityReservationForm";
import { btnPrimary } from "@/components/ui/brandStyles";
import PremiumUpsell from "@/components/premium/PremiumUpsell";
import TripReadOnlyBanner from "@/components/trip/common/TripReadOnlyBanner";
import { SkeletonCard } from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import { useTripPermissions } from "@/hooks/useTripPermissions";
import { useTripWorkspace } from "@/components/trip/TripWorkspaceContext";
import { supabase } from "@/lib/supabase";

function templateFromDetected(data: DetectedDocumentData): ReservationTemplateType {
  if (data.documentType === "hotel_reservation") return "lodging";
  if (
    data.documentType === "flight_ticket" ||
    data.documentType === "boarding_pass" ||
    data.documentType === "train_ticket" ||
    data.documentType === "rental_car" ||
    data.documentType === "manual_transport_reservation"
  ) {
    return "transport";
  }
  return "activity";
}

export default function TripResourcesView({
  tripId,
  isPremium = false,
  canManageResources = true,
}: {
  tripId: string;
  /** Premium efectivo del viaje (usuario o participante). */
  isPremium?: boolean;
  canManageResources?: boolean;
}) {
  const {
    resources,
    reservations,
    loading,
    saving,
    error,
    uploadFile,
    createResource,
    createReservation,
    updateReservation,
    deleteResource,
    deleteResources,
    deleteReservation,
  } = useTripResources(tripId);

  const [detectedData, setDetectedData] = useState<DetectedDocumentData | null>(null);
  const [editingReservation, setEditingReservation] = useState<TripReservation | null>(null);
  const [templateType, setTemplateType] = useState<ReservationTemplateType | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showAnalyzerForm, setShowAnalyzerForm] = useState(false);
  const isDemoTrip = useIsDemoTrip();
  const [showLists, setShowLists] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { participant } = useTripPermissions(tripId);
  const { isAgencyTrip } = useTripWorkspace();

  async function toggleClientPortal(resourceId: string, visible: boolean) {
    const res = await fetch(`/api/trip-resources/${resourceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ show_on_client_portal: visible }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "No se pudo actualizar.");
    }
    window.location.reload();
  }

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setCurrentUserId(data.session?.user?.id ?? participant?.user_id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, [participant?.user_id]);

  useEffect(() => {
    if (isDemoTrip) setShowLists(true);
  }, [isDemoTrip]);

  const editingMode = useMemo(() => Boolean(editingReservation), [editingReservation]);
  const showLodgingForm = editingMode || templateType === "lodging";
  const showTransportForm = !editingMode && templateType === "transport";
  const showActivityForm = !editingMode && templateType === "activity";

  if (loading) {
    return (
      <div className="min-w-0 max-w-full space-y-6" aria-busy="true" aria-label="Cargando recursos">
        <SkeletonCard rows={2} />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
        </div>
        <SkeletonCard rows={2} />
        <div className="grid gap-6 md:grid-cols-2">
          <SkeletonCard rows={3} />
          <SkeletonCard rows={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {!canManageResources ? <TripReadOnlyBanner moduleLabel="documentos y reservas" /> : null}
      {error ? (
        <div className="break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Reveal variant="fade" data-tour="resources-lists-section" as="section" className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-[#1E293B] dark:bg-[#0F1623]">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0 max-w-full flex-1">
            <h3 className="text-lg font-semibold text-slate-900">Listas</h3>
            <p className="mt-1 text-sm text-slate-500">
              Crea listas privadas o compartidas (compra, maleta, documentos…).
            </p>
          </div>
          <button
            data-tour="resources-lists-btn"
            type="button"
            onClick={() => setShowLists((v) => !v)}
            className={`btn-press ${btnPrimary} shrink-0 whitespace-normal px-4 py-2 text-sm`}
          >
            {showLists ? "Cerrar listas" : "Crear/ver listas"}
          </button>
        </div>

        {showLists ? (
          <div key="lists-panel" data-tour="resources-lists-panel" className="step-enter">
            <TripListsPanel tripId={tripId} isPremium={isPremium} canManageResources={canManageResources} />
          </div>
        ) : null}
      </Reveal>

      <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-2">
        <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 max-w-full flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Adjuntar documento</h3>
              <p className="mt-1 text-sm text-slate-500">
                Sube imágenes o PDFs de reservas, tickets o documentos del viaje.
              </p>
            </div>

            {canManageResources ? (
              <button
                data-tour="resources-upload-btn"
                type="button"
                onClick={() => setShowUploadForm((current) => !current)}
                className={`btn-press ${btnPrimary} shrink-0 whitespace-normal px-4 py-2 text-sm`}
              >
                {showUploadForm ? "Cerrar" : "Adjuntar documento"}
              </button>
            ) : null}
          </div>

          {canManageResources && showUploadForm ? (
            <div className="mt-5">
              <ResourceUploadForm
                tripId={tripId}
                currentUserId={currentUserId}
                saving={saving}
                onUpload={uploadFile}
                onCreateResource={async (input) => {
                  await createResource({
                    title: input.title,
                    category: input.category,
                    notes: input.notes,
                    upload: input.upload,
                    detectedDocumentType: input.detectedDocumentType || null,
                    detectedData: input.detectedData || {},
                    visibility: input.visibility,
                    visibleToUserIds: input.visibleToUserIds,
                  });
                  setShowUploadForm(false);
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-[#1E293B] dark:bg-[#0F1623]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 max-w-full flex-1">
              <h3 className="text-lg font-semibold text-slate-900">Analizador de documento</h3>
              <p className="mt-1 text-sm text-slate-500">
                Analiza PDFs e imágenes para rellenar formularios automáticamente.
              </p>
            </div>

            {canManageResources ? (
              <button
                data-tour="resources-analyze-btn"
                type="button"
                onClick={() => {
                  if (!isPremium) return;
                  setShowAnalyzerForm((current) => !current);
                }}
                disabled={!isPremium}
                className={`btn-press ${btnPrimary} shrink-0 whitespace-normal px-4 py-2 text-sm disabled:opacity-60`}
              >
                {showAnalyzerForm ? "Cerrar" : "Analizar documento"}
              </button>
            ) : null}
          </div>

          {!isPremium ? (
            <div className="mt-5">
              <PremiumUpsell feature="documentAnalyzer" />
            </div>
          ) : null}

          {canManageResources && showAnalyzerForm && isPremium ? (
            <div className="mt-5">
              <DocumentAnalyzerPanel
                tripId={tripId}
                onUseDetectedData={(data) => {
                  setDetectedData(data);
                  setEditingReservation(null);
                  setTemplateType(templateFromDetected(data));
                  setShowAnalyzerForm(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </div>
          ) : null}
        </div>
      </div>

      {canManageResources ? (
        <ReservationTemplateSelector
          value={templateType || "lodging"}
          onChange={setTemplateType}
        />
      ) : null}

      {canManageResources && !showLodgingForm && !showTransportForm && !showActivityForm ? (
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#334155] bg-slate-50 dark:bg-[#080C14] px-6 py-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#0F1623] text-xl shadow-sm">🗂️</div>
        </div>
      ) : null}

      {canManageResources && showLodgingForm ? (
        <LodgingReservationForm
          saving={saving}
          detectedData={editingMode ? null : detectedData}
          initialData={
            editingMode
              ? {
                  providerName: editingReservation?.provider_name,
                  reservationName: editingReservation?.reservation_name,
                  reservationCode: editingReservation?.reservation_code,
                  address: editingReservation?.address,
                  city: editingReservation?.city,
                  country: editingReservation?.country,
                  checkInDate: editingReservation?.check_in_date,
                  checkInTime: editingReservation?.check_in_time,
                  checkOutDate: editingReservation?.check_out_date,
                  checkOutTime: editingReservation?.check_out_time,
                  guests: editingReservation?.guests,
                  totalAmount: editingReservation?.total_amount,
                  currency: editingReservation?.currency,
                  paymentStatus: editingReservation?.payment_status,
                  notes: editingReservation?.notes,
                  syncToPlan: editingReservation?.sync_to_plan,
                  latitude: editingReservation?.latitude,
                  longitude: editingReservation?.longitude,
                }
              : null
          }
          isEditing={editingMode}
          onCancelEdit={() => {
            setEditingReservation(null);
            setTemplateType(null);
            setDetectedData(null);
          }}
          onSubmit={async (input) => {
            if (editingReservation) {
              await updateReservation(editingReservation.id, {
                providerName: input.providerName,
                reservationName: input.reservationName,
                reservationCode: input.reservationCode,
                address: input.address,
                city: input.city,
                country: input.country,
                checkInDate: input.checkInDate,
                checkInTime: input.checkInTime,
                checkOutDate: input.checkOutDate,
                checkOutTime: input.checkOutTime,
                guests: input.guests ? Number(input.guests) : null,
                totalAmount: input.totalAmount ? Number(input.totalAmount) : null,
                currency: input.currency,
                paymentStatus: input.paymentStatus,
                notes: input.notes,
                syncToPlan: input.syncToPlan,
                latitude: input.latitude,
                longitude: input.longitude,
              });
              setEditingReservation(null);
            } else {
              await createReservation({
                reservationType: "lodging",
                providerName: input.providerName,
                reservationName: input.reservationName,
                reservationCode: input.reservationCode,
                address: input.address,
                city: input.city,
                country: input.country,
                checkInDate: input.checkInDate,
                checkInTime: input.checkInTime,
                checkOutDate: input.checkOutDate,
                checkOutTime: input.checkOutTime,
                guests: input.guests ? Number(input.guests) : null,
                totalAmount: input.totalAmount ? Number(input.totalAmount) : null,
                currency: input.currency,
                paymentStatus: input.paymentStatus,
                notes: input.notes,
                detectedDocumentType: detectedData?.documentType || null,
                detectedData: detectedData || {},
                syncToPlan: input.syncToPlan,
                latitude: input.latitude,
                longitude: input.longitude,
              });
            }

            setDetectedData(null);
            setTemplateType(null);
          }}
        />
      ) : null}

      {canManageResources && showTransportForm ? (
        <TransportReservationForm
          saving={saving}
          detectedData={detectedData}
          onSubmit={async (input) => {
            await createReservation({
              reservationType: "transport",
              providerName: input.providerName,
              reservationName: input.reservationName,
              reservationCode: input.reservationCode,
              address: `${input.origin} → ${input.destination}`,
              city: input.destination || null,
              country: null,
              checkInDate: input.departureDate,
              checkInTime: input.departureTime,
              checkOutDate: input.arrivalDate,
              checkOutTime: input.arrivalTime,
              guests: input.passengers ? Number(input.passengers) : null,
              totalAmount: input.totalAmount ? Number(input.totalAmount) : null,
              currency: input.currency,
              paymentStatus: input.paymentStatus,
              notes: input.notes,
              detectedDocumentType: detectedData?.documentType || "manual_transport_reservation",
              detectedData: {
                ...(detectedData || {}),
                origin: input.origin,
                destination: input.destination,
                transportType: input.transportType,
                seat: input.seat,
                terminal: input.terminal,
                gate: input.gate,
              },
              syncToPlan: false,
            });
            setDetectedData(null);
            setTemplateType(null);
          }}
        />
      ) : null}

      {canManageResources && showActivityForm ? (
        <ActivityReservationForm
          saving={saving}
          detectedData={detectedData}
          onSubmit={async (input) => {
            await createReservation({
              reservationType: "activity",
              providerName: input.providerName,
              reservationName: input.reservationName,
              reservationCode: input.reservationCode,
              address: input.location,
              city: null,
              country: null,
              checkInDate: input.activityDate,
              checkInTime: input.activityTime,
              checkOutDate: input.activityDate,
              checkOutTime: input.activityTime,
              guests: input.participants ? Number(input.participants) : null,
              totalAmount: input.totalAmount ? Number(input.totalAmount) : null,
              currency: input.currency,
              paymentStatus: input.paymentStatus,
              notes: input.notes,
              detectedDocumentType: detectedData?.documentType || "manual_activity_reservation",
              detectedData: {
                ...(detectedData || {}),
                location: input.location,
                duration: input.duration,
                meetingPoint: input.meetingPoint,
                language: input.language,
              },
              syncToPlan: false,
            });
            setDetectedData(null);
            setTemplateType(null);
          }}
        />
      ) : null}

      <div className="grid min-w-0 max-w-full gap-6 xl:grid-cols-2">
        <ReservationList
          reservations={reservations}
          {...(canManageResources
            ? {
                onEdit: (reservation: TripReservation) => {
                  setEditingReservation(reservation);
                  setDetectedData(null);
                  setTemplateType(
                    reservation.reservation_type === "lodging"
                      ? "lodging"
                      : reservation.reservation_type === "transport"
                        ? "transport"
                        : "activity"
                  );
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
                onDelete: deleteReservation,
              }
            : {})}
        />

        <ResourceList
          resources={resources}
          deleting={saving}
          {...(canManageResources
            ? {
                onDeleteMany: deleteResources,
                onAdd: () => {
                  setShowUploadForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                },
                ...(isAgencyTrip
                  ? { onToggleClientPortal: toggleClientPortal }
                  : {}),
              }
            : {})}
        />
      </div>
    </div>
  );
}
