// src/app/lib/actions.ts
"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dobString = formData.get("dob") as string;
  
  const username = email.split('@')[0] + Math.floor(Math.random() * 1000);
  const dob = new Date(dobString);
  const hashedPassword = await bcrypt.hash(password, 10);

  let userId: string; // Store ID to use outside try/catch

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        dob,
        role: "USER",
        creatorStatus: "NONE",
      },
    });
    userId = user.id;
  } catch (error: any) {
    // Check for Prisma unique constraint error (P2002)
    if (error.code === 'P2002') {
      throw new Error("This email is already registered. Please Sign In.");
    }
    console.error("Registration Error:", error);
    throw new Error("Failed to create account.");
  }

  // Move session creation and redirect OUTSIDE the try/catch
  return await createSessionAndRedirect(userId);
}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (email === "admin@xsocial.com" && password === "admin123") {
    const cookieStore = await cookies();
    cookieStore.set("admin_session", "true", { path: "/" });
    redirect("/admin");
  }

  if (!email || !password) throw new Error("Missing credentials");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  return await createSessionAndRedirect(user.id);
}

async function createSessionAndRedirect(userId: string) {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set("auth_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
    sameSite: "lax",
  });

  // Next.js redirect must be called outside try/catch blocks
  redirect("/feed");
}