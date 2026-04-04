"use client";

import { useEffect } from "react";
import { updateLastSeen } from "@/app/actions/security-actions";

export default function ActivityMonitor({ userId }: { userId: string }) {
  useEffect(() => {
    const ping = () => updateLastSeen(userId);
    ping(); // Initial ping
    const interval = setInterval(ping, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [userId]);

  return null;
}
