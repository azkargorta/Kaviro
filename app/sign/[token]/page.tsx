import SignaturePublicPage from "@/components/sign/SignaturePublicPage";

type Props = { params: { token: string } };

export default function SignPage({ params }: Props) {
  return (
    <main className="min-h-[100dvh] bg-slate-100 px-4 py-10">
      <SignaturePublicPage token={params.token} />
    </main>
  );
}
