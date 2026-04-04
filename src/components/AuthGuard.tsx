// src/components/AuthGuard.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import GlobalAuthListener from "@/components/GlobalAuthListener";
import ActivityMonitor from "@/components/ActivityMonitor";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  let userSession;
  try {
    userSession = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true }
    });
  } catch (err) {
    console.error("[AuthGuard] Database error:", err);
    redirect("/auth");
  }

  if (!userSession || new Date() > userSession.expires || !userSession.user) {
    redirect("/auth");
  }

  return (
    <>
      {children}
      <GlobalAuthListener userId={userSession.userId} />
      <ActivityMonitor userId={userSession.userId} />
    </>
  );
}