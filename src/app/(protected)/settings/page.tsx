"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Lock, Bell, Eye, HelpCircle, ArrowLeft,
  LogOut, ChevronRight, Moon, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { handleLogoutAction } from "@/app/actions/auth";

const SettingsPage = () => {
  const router = useRouter();
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
      await handleLogoutAction();
      window.location.href = "/"; 
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoggingOut(false);
    }
  };

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

      {/* 2. Main Content Container - Restricted to 90% Width */}
      <div className="w-full lg:w-[90%] space-y-10">
        {settingsSections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em] ml-4">
              {section.title}
            </h2>
            <div className="bg-zinc-900/20 border border-zinc-800/50 rounded-[2.5rem] overflow-hidden backdrop-blur-md">
              {section.items.map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between p-6 hover:bg-zinc-800/30 border-b border-zinc-800/50 last:border-0 group transition-all">
                  <div className="flex items-center gap-5">
                    <div className={`p-3 rounded-2xl bg-zinc-900/50 ${item.color.replace('text', 'bg').replace('400', '400/10')}`}>
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
      </div>

      {/* Logout Modal logic remains the same */}
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