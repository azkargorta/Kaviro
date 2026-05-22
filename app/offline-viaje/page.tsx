import OfflineTripsList from "@/components/offline/OfflineTripsList";

export const metadata = {
  title: "Viajes sin conexión · Kaviro",
};

export default function OfflineTripsPage() {
  return (
    <main className="page-shell page-shell--safe-top mx-auto max-w-lg space-y-4 pb-10">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--text-primary)]">Viajes guardados</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Plan, listas y reservas de la última vez que abriste cada viaje con conexión.
        </p>
      </div>
      <OfflineTripsList />
    </main>
  );
}
