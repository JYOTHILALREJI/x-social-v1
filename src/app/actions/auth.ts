"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";

export async function handleLogoutAction() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("auth_session")?.value;

  if (sessionToken) {
    await prisma.session.delete({ where: { sessionToken } }).catch(() => {});
  }

  // Delete the cookie
  cookieStore.set("auth_session", "", { path: "/", expires: new Date(0) });
  
  redirect("/");
}