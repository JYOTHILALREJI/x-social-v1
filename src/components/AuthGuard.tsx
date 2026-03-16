import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export async function AuthGuard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  // 1. Check if the cookie even exists
  if (!sessionToken) {
    redirect("/");
  }

  // 2. Verify the session in the database (Safe for Node.js runtime)
  const dbSession = await prisma.session.findUnique({
    where: { sessionToken },
  });

  // 3. If the DB was wiped or session is invalid, kick them out
  if (!dbSession || new Date() > dbSession.expires) {
    redirect("/");
  }

  return <>{children}</>;
}