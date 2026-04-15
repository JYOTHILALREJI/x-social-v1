import { prisma } from "@/app/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MessagesClient from "./MessagesClient";
import { getConversations, getMessageRequests } from "@/app/actions/message-actions";

export default async function MessagesPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('auth_session')?.value;

  if (!sessionToken) {
    redirect("/auth");
  }

  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: { id: true, username: true, name: true, image: true, role: true, walletBalance: true, isGhost: true, publicKey: true, encryptedPrivateKey: true }
      }
    }
  });

  if (!session?.user) {
    redirect("/auth");
  }

  const { conversations = [] } = await getConversations(session.user.id);
  const { requests = [] } = session.user.role === 'CREATOR' 
    ? await getMessageRequests(session.user.id) 
    : { requests: [] };

  return (
    <MessagesClient 
      currentUser={session.user} 
      initialConversations={conversations} 
      initialRequests={requests}
    />
  );
}