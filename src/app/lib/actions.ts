"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma"; 
import bcrypt from "bcryptjs"; 
import type { User, Session } from "../../generated/prisma/client";

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); 

  // Accesses the Session model from your schema [cite: 4]
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
    },
  });

  (await cookies()).set("auth_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
    sameSite: "lax",
  });

  redirect("/feed");
}

export async function signup(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const dob = formData.get("dob") as string;

  const hashedPassword = await bcrypt.hash(password, 10);

  // Populates User data according to your schema [cite: 1, 2]
  await prisma.user.create({
    data: {
      email,
      username: email.split('@')[0] + Math.floor(Math.random() * 1000),
      password: hashedPassword,
      dob: new Date(dob),
      role: "USER",
      walletBalance: 0, 
    },
  });

  return login(formData);
}