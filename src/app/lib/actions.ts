// src/app/lib/actions.ts
"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { UAParser } from "ua-parser-js";

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

  if (!email || !password) throw new Error("Missing credentials");

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid credentials");
  }

  if (user.twoFactorQuestion) {
    return {
      requiresTwoFactor: true,
      question: user.twoFactorQuestion,
      userId: user.id
    };
  }

  return await createSessionAndRedirect(user.id);
}

export async function verifyTwoFactor(userId: string, answer: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.twoFactorAnswer !== answer) {
    throw new Error("invalid answer");
  }
  return await createSessionAndRedirect(user.id);
}

async function createSessionAndRedirect(userId: string) {
  const sessionToken = crypto.randomUUID();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Extract User Agent device info
  const reqHeaders = await headers();
  const userAgentString = reqHeaders.get("user-agent") || "";
  let deviceName = "Unknown Device";
  if (userAgentString) {
    const parser = new UAParser(userAgentString);
    const os = parser.getOS().name || "Unknown OS";
    const browser = parser.getBrowser().name || "Unknown Browser";
    deviceName = `${os} • ${browser}`;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { sessions: true } });
  
  const newSession = await prisma.session.create({
    data: {
      sessionToken,
      userId,
      expires,
      device: deviceName
    },
  });

  if (user?.loginAlerts) {
    // Check if there's any active session from a different device
    const knownDevices = new Set(user.sessions.filter(s => s.expires > new Date()).map(s => s.device));
    if (!knownDevices.has(deviceName)) {
      // It's a new device, push notification
      await prisma.notification.create({
        data: {
          userId,
          message: `Someone just logged into your account, is it you? Device: ${deviceName}`,
          type: "NEW_LOGIN",
          relatedId: newSession.id
        }
      });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires,
    path: "/",
    sameSite: "lax",
  });

  // Next.js redirect must be called outside try/catch blocks
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (u?.role === "ADMIN") redirect("/admin");
  redirect("/feed");
}