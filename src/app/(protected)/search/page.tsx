import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import SearchClient from "@/components/SearchClient";
import { redirect } from "next/navigation";

export default async function SearchPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    select: { userId: true }
  });

  if (!session) {
    redirect("/auth");
  }

  return <SearchClient currentUserId={session.userId} />;
}