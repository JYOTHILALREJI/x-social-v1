import { AuthGuard } from "@/components/AuthGuard";
import PageTransition from "@/components/PageTransition";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="w-full min-h-screen bg-black">
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </AuthGuard>
  );
}