import { AuthGuard } from "@/components/AuthGuard";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-black">
        <Navbar />
        <main className="flex-1 pb-20 md:pb-0 md:pl-20 lg:pl-64">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}