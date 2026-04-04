"use client";

import React from 'react';

interface UserStatusDotProps {
  lastSeen?: Date | string;
  isActivityStatusEnabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function UserStatusDot({ lastSeen, isActivityStatusEnabled, size = 'sm' }: UserStatusDotProps) {
  if (!isActivityStatusEnabled || !lastSeen) return null;

  const lastSeenDate = new Date(lastSeen);
  const now = new Date();
  const diffInMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);

  const isOnline = diffInMinutes < 5; // 5 minute threshold

  if (!isOnline) return null;

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className="relative flex-shrink-0">
      <span className={`${sizeClasses[size]} bg-green-500 rounded-full block border border-background`} />
      <span className={`absolute inset-0 ${sizeClasses[size]} bg-green-500 rounded-full animate-ping opacity-75`} />
    </div>
  );
}
