import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export default async function NotificationsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          notifications: {
            where: { isRead: false },
            orderBy: { createdAt: 'desc' }
          }
        }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  return (
    <div className="w-full min-h-screen bg-black text-white pl-20 lg:pl-64">
      <NotificationsClient 
        userId={session.user.id} 
        initialNotifications={session.user.notifications as any}
      />
    </div>
  );
}
