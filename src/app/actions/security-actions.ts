"use server";

import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function getSessionUserId() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_session')?.value;
    if (!sessionToken) return null;
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { userId: true }
    });
    return session?.userId || null;
  } catch (err) {
    console.error("[getSessionUserId] Error:", err);
    return null;
  }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User not found" };

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return { success: false, error: "wrong password, please type your existing password correctly" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { success: true };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, error: "Failed to change password" };
  }
}

export async function updateTwoFactor(userId: string, question: string | null, answer: string | null, toggleState: boolean) {
  try {
    if (!toggleState) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorQuestion: null, twoFactorAnswer: null }
      });
      return { success: true };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorQuestion: question, twoFactorAnswer: answer }
    });

    return { success: true };
  } catch (error) {
    console.error("Update 2FA error:", error);
    return { success: false, error: "Failed to update 2FA configuration" };
  }
}

export async function updateLoginAlerts(userId: string, enabled: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { loginAlerts: enabled }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update login alerts" };
  }
}

export async function getActiveSessions(userId: string) {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { expires: 'desc' }
    });
    return { success: true, sessions };
  } catch (error) {
    return { success: false, error: "Failed to fetch active sessions" };
  }
}

export async function revokeSession(sessionId: string) {
  try {
    await prisma.session.delete({
      where: { id: sessionId }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to revoke session" };
  }
}

export async function getUnreadLoginAlerts(userId: string) {
  try {
    const alerts = await prisma.notification.findMany({
      where: {
        userId,
        type: "NEW_LOGIN",
        isRead: false
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, alerts };
  } catch (error) {
    return { success: false, error: "Failed to fetch alerts" };
  }
}

export async function markNotificationRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to mark read" };
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
    return { success: true, count };
  } catch (error) {
    return { success: false, count: 0 };
  }
}

export async function updatePrivacySettings(userId: string, isPrivate: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isPrivateAccount: isPrivate }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update privacy settings" };
  }
}

export async function updateActivityStatus(userId: string, enabled: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { isActivityStatusEnabled: enabled }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update activity status" };
  }
}

export async function updateLastSeen(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { lastSeen: new Date() }
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateContentPreferences(
  userId: string,
  prefs: { autoplayVideos?: boolean; mutedWords?: string[] }
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(prefs.autoplayVideos !== undefined && { autoplayVideos: prefs.autoplayVideos }),
        ...(prefs.mutedWords !== undefined && { mutedWords: prefs.mutedWords }),
      }
    });
    return { success: true };
  } catch (error) {
    console.error('Update content preferences error:', error);
    return { success: false, error: 'Failed to update content preferences' };
  }
}
