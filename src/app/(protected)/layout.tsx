import { AuthGuard } from "@/components/AuthGuard";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="w-full min-h-screen bg-black">
        {children}
      </div>
    </AuthGuard>
  );
}