// src/app/settings/page.tsx
"use client";
import React, { useState } from 'react';
import { 
  User, Lock, Bell, Eye, HelpCircle, 
  LogOut, ChevronRight, Moon, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { handleLogoutAction } from "@/app/actions/auth"; //

const SettingsPage = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", color: "text-blue-400" },
        { icon: Lock, label: "Password & Security", color: "text-green-400" },
        { icon: ShieldCheck, label: "Privacy", color: "text-purple-400" },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Bell, label: "Notifications", color: "text-yellow-400" },
        { icon: Moon, label: "Appearance", color: "text-zinc-400" },
        { icon: Eye, label: "Content Preferences", color: "text-pink-400" },
      ]
    }
  ];

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await handleLogoutAction(); //
      // FORCE full page reload to landing page to break client-side caches
      window.location.href = "/"; 
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 lg:px-16 pt-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-black mb-8 tracking-tight uppercase italic">Settings</h1>
        <div className="space-y-8">
          {settingsSections.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] ml-2">
                {section.title}
              </h2>
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-md">
                {section.items.map((item, i) => (
                  <button key={i} className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 border-b border-zinc-800 last:border-0 group transition-colors">
                    <div className="flex items-center gap-4">
                      <item.icon size={20} className={item.color} />
                      <span className="font-medium text-zinc-200">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-600 group-hover:text-white" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button 
            onClick={() => setShowLogoutModal(true)} 
            className="w-full flex items-center gap-4 p-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl mt-4 transition-colors"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Log Out?</h2>
              <p className="text-zinc-500 text-sm mb-8 italic">Your session will be terminated in the database.</p>
              <div className="flex flex-col w-full gap-3">
                <button 
                  onClick={handleConfirmLogout} 
                  disabled={isLoggingOut} 
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black italic uppercase rounded-2xl disabled:opacity-50"
                >
                  {isLoggingOut ? "Processing..." : "Confirm Logout"}
                </button>
                <button 
                  onClick={() => setShowLogoutModal(false)} 
                  className="w-full py-4 bg-zinc-900 text-zinc-400 font-bold uppercase text-xs rounded-2xl"
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
};

export default SettingsPage;