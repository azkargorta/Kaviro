import { notFound } from "next/navigation";
import { APP_NAME } from "@/lib/brand";
import ShareTripRecap from "@/components/share/ShareTripRecap";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { loadPublicRecapStats } from "@/lib/public-trip-recap-stats";

type Props = { params: { token: string } };

const TABLE = "trip_shares";

type ShareRow = {
  trip_id: string;
  revoked_at: string | null;
  expires_at: string | null;
  share_kind?: string | null;
};

async function loadRecapShare(token: string) {
  const supabase = getServiceRoleClient();
  const primary = await supabase
    .from(TABLE)
    .select("token, trip_id, revoked_at, expires_at, share_kind")
    .eq("token", token)
    .maybeSingle();

  let share: ShareRow | null = primary.data;
  let error = primary.error;

  if (error?.message?.includes("share_kind")) {
    const fb = await supabase
      .from(TABLE)
      .select("token, trip_id, revoked_at, expires_at")
      .eq("token", token)
      .maybeSingle();
    share = fb.data;
    error = fb.error;
  }

  if (error || !share || share.revoked_at) return null;
  if (share.expires_at && new Date(String(share.expires_at)).getTime() < Date.now()) return null;
  const kind = share.share_kind;
  if (kind && kind !== "recap") return null;

  const tripId = String(share.trip_id);
  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination, start_date, end_date, base_currency")
    .eq("id", tripId)
    .maybeSingle();
  if (!trip) return null;

  const stats = await loadPublicRecapStats(
    supabase,
    tripId,
    typeof trip.base_currency === "string" ? trip.base_currency : "EUR"
  );

  return { trip, stats };
}

export async function generateMetadata({ params }: Props) {
  const data = await loadRecapShare(params.token);
  if (!data?.trip) return { title: `Recap | ${APP_NAME}` };
  const dest = data.trip.destination ? ` — ${data.trip.destination}` : "";
  const title = `Recap: ${data.trip.name}${dest} | ${APP_NAME}`;
  return {
    title,
    description: `Estadísticas del viaje ${data.trip.name}${dest} en ${APP_NAME}.`,
    openGraph: { title, type: "website", siteName: APP_NAME },
  };
}

export default async function ShareRecapPage({ params }: Props) {
  const data = await loadRecapShare(params.token);
  if (!data) notFound();

  return <ShareTripRecap trip={data.trip} stats={data.stats} />;
}
