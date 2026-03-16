// src/components/AuthGuard.tsx
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = (await cookieStore).get("auth_session")?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  const userSession = await prisma.session.findUnique({
    where: { sessionToken },
    include: { user: true }
  });

  if (!userSession || new Date() > userSession.expires) {
    redirect("/auth");
  }

  return <>{children}</>;
}