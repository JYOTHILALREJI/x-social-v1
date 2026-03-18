"use client";

import React, { useState } from 'react';
import { 
  User, Lock, Bell, Eye, HelpCircle,
  LogOut, ChevronRight, Moon, ShieldCheck, AlertCircle, PlusCircle 
} from 'lucide-react';
import { handleLogoutAction } from "@/app/actions/auth";

interface UserSettingsProps {
  onBecomeCreatorClick?: () => void;
  showBecomeCreator?: boolean;
}

export default function UserSettings({ onBecomeCreatorClick, showBecomeCreator }: UserSettingsProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", color: "text-blue-400", onClick: () => {} },
        { icon: Lock, label: "Password & Security", color: "text-green-400", onClick: () => {} },
        { icon: ShieldCheck, label: "Privacy", color: "text-purple-400", onClick: () => {} },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", color: "text-yellow-400", onClick: () => {} },
        { icon: Moon, label: "Appearance", color: "text-zinc-400", onClick: () => {} },
        { icon: Eye, label: "Content Preferences", color: "text-pink-400", onClick: () => {} },
      ]
    }
  ];

  if (showBecomeCreator) {
    settingsSections[0].items.unshift({
      icon: PlusCircle,
      label: "Become a Creator",
      color: "text-purple-500",
      onClick: onBecomeCreatorClick || (() => {})
    });
  }

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogoutAction();
      window.location.href = "/"; 
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full lg:w-[90%] space-y-10">
      {settingsSections.map((section, idx) => (
        <div key={idx} className="space-y-4">
          <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] ml-4">
            {section.title}
          </h2>
          <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            {section.items.map((item, i) => (
              <button 
                key={i} 
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/30 border-b border-zinc-800/50 last:border-0 group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl bg-zinc-900/50 ${item.color.replace('text', 'bg').replace('400', '400/10').replace('500', '500/10')}`}>
                     <item.icon size={22} className={item.color} />
                  </div>
                  <span className="font-bold text-zinc-200 text-lg">{item.label}</span>
                </div>
                <ChevronRight size={20} className="text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <button 
        onClick={() => setShowLogoutModal(true)} 
        className="w-fit flex items-center gap-4 px-8 py-5 text-red-500 font-black uppercase italic hover:bg-red-500/10 rounded-[2rem] mt-4 transition-all"
      >
        <LogOut size={22} />
        <span>Terminate Session</span>
      </button>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-white">Log Out?</h2>
              <p className="text-zinc-500 text-sm mb-8 italic">Your session will be terminated in the database.</p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleConfirmLogout} 
                  disabled={isLoggingOut} 
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black italic uppercase rounded-2xl disabled:opacity-50 transition-colors"
                >
                  {isLoggingOut ? "Processing..." : "Confirm Logout"}
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="w-full py-4 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 font-bold uppercase text-xs rounded-2xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
