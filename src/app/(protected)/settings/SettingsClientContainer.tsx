"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UserSettings from '@/components/UserSettings';

interface SettingsClientContainerProps {
  user: {
    id: string;
    username: string;
    creatorStatus: string;
    creatorProfile: {
      tier1Price: number;
      tier2Price: number;
      tier3Price: number;
    } | null;
  };
}

const SettingsClientContainer = ({ user }: SettingsClientContainerProps) => {
  const router = useRouter();

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 pt-10 pb-20">
      {/* 1. Header with Back Button - Full Width */}
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-zinc-900/50 hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all group"
        >
          <ArrowLeft size={24} className="text-zinc-400 group-hover:text-white group-hover:-translate-x-1 transition-transform" />
        </button>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic">Settings</h1>
      </div>

      {/* 2. Main Content Container using Modular Component */}
      <UserSettings showBecomeCreator={false} user={user} />
    </div>
  );
};

export default SettingsClientContainer;
