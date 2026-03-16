"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logout() {
  const cookieStore = await cookies();
  
  // 1. Delete the httpOnly cookie from the server side
  cookieStore.delete("auth_session");

  // 2. Redirect to landing page
  redirect("/");
}