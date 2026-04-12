"use client";

import React, { useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";

export default function ActivityMonitor({ userId }: { userId: string }) {
  const { throttleAction, emit } = useSocket();

  useEffect(() => {
    // Initial ping (throttled to 2 minutes globally)
    throttleAction('pingActivity', async () => {
       emit('ping', {});
    }, 120000);

    const interval = setInterval(() => {
      // Background interval check still fires to maintain throttle timestamp
      throttleAction('pingActivity', async () => {
         emit('ping', {});
      }, 120000);
    }, 60000); // Check every minute, but throttleAction will limit execution
    
    return () => clearInterval(interval);
  }, [userId, throttleAction, emit]);

  return null;
}
