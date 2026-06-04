import PayPublicPage from "@/components/pay/PayPublicPage";

type Props = {
  params: { token: string };
  searchParams: { paid?: string; cancel?: string };
};

export default function PayPage({ params, searchParams }: Props) {
  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-10">
      <PayPublicPage token={params.token} paidQuery={searchParams.paid === "1"} />
    </main>
  );
}
