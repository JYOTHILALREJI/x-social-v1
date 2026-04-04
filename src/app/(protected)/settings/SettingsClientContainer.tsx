"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import UserSettings from '@/components/UserSettings';
import EditProfileOverlay from '@/components/EditProfileOverlay';
import SecurityOverlay from '@/components/SecurityOverlay';
import PrivacyOverlay from '@/components/PrivacyOverlay';
import AppearanceOverlay from '@/components/AppearanceOverlay';
import ContentPreferencesOverlay from '@/components/ContentPreferencesOverlay';
import { useState } from 'react';

interface SettingsClientContainerProps {
  user: {
    id: string;
    username: string;
    name: string | null;
    dob: string | Date;
    bio: string | null;
    image: string | null;
    role: string;
    isGhost: boolean;
    creatorStatus: string;
    autoplayVideos: boolean;
    mutedWords: string[];
    creatorProfile: {
      tier1Price: number;
      tier2Price: number;
      tier3Price: number;
    } | null;
  };
}

const SettingsClientContainer = ({ user }: SettingsClientContainerProps) => {
  const router = useRouter();
  const [isEditOverlayOpen, setIsEditOverlayOpen] = useState(false);
  const [isSecurityOverlayOpen, setIsSecurityOverlayOpen] = useState(false);
  const [isPrivacyOverlayOpen, setIsPrivacyOverlayOpen] = useState(false);
  const [isAppearanceOverlayOpen, setIsAppearanceOverlayOpen] = useState(false);
  const [isContentPreferencesOverlayOpen, setIsContentPreferencesOverlayOpen] = useState(false);
  const [userData, setUserData] = useState(user);

  return (
    <div className="w-full min-h-screen bg-background text-foreground px-4 md:px-10 pt-10 pb-20 transition-colors duration-300">
      {/* 1. Header with Back Button - Full Width */}
      <div className="flex items-center gap-6 mb-12">
        <button 
          onClick={() => router.back()}
          className="p-3 bg-card-bg hover:bg-card-hover rounded-2xl border border-border-theme transition-all group"
        >
          <ArrowLeft size={24} className="text-muted-foreground group-hover:text-foreground group-hover:-translate-x-1 transition-transform" />
        </button>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight uppercase italic">Settings</h1>
      </div>

      {/* 2. Main Content Container using Modular Component */}
      <UserSettings 
        showBecomeCreator={false} 
        user={userData as any} 
        onEditProfile={() => setIsEditOverlayOpen(true)}
        onSecurityClick={() => setIsSecurityOverlayOpen(true)}
        onPrivacyClick={() => setIsPrivacyOverlayOpen(true)}
        onAppearanceClick={() => setIsAppearanceOverlayOpen(true)}
        onContentPreferencesClick={() => setIsContentPreferencesOverlayOpen(true)}
      />

      {/* 3. Sliding Overlays */}
      <EditProfileOverlay 
        isOpen={isEditOverlayOpen} 
        onClose={() => setIsEditOverlayOpen(false)} 
        user={userData as any} 
        onUpdate={(updated) => setUserData(prev => ({ ...prev, ...updated }))}
      />
      <SecurityOverlay 
        userId={userData.id} 
        isTwoFactorEnabled={!!(userData as any).twoFactorQuestion}
        defaultLoginAlerts={(userData as any).loginAlerts ?? false}
        isOpen={isSecurityOverlayOpen} 
        onClose={() => setIsSecurityOverlayOpen(false)} 
      />
      <PrivacyOverlay 
        userId={userData.id} 
        defaultPrivateAccount={(userData as any).isPrivateAccount ?? false}
        defaultActivityStatus={(userData as any).isActivityStatusEnabled ?? true}
        isOpen={isPrivacyOverlayOpen} 
        onClose={() => setIsPrivacyOverlayOpen(false)} 
        onUpdate={(updates) => setUserData(prev => ({ ...prev, ...updates }))}
      />
      <AppearanceOverlay isOpen={isAppearanceOverlayOpen} onClose={() => setIsAppearanceOverlayOpen(false)} />
      <ContentPreferencesOverlay
        isOpen={isContentPreferencesOverlayOpen}
        onClose={() => setIsContentPreferencesOverlayOpen(false)}
        userId={userData.id}
        defaultAutoplay={userData.autoplayVideos ?? true}
        defaultMutedWords={userData.mutedWords ?? []}
      />
    </div>
  );
};

export default SettingsClientContainer;
