"use client";

import React, { useState } from 'react';
import { 
  User, Lock, Bell, Eye, HelpCircle, DollarSign,
  LogOut, ChevronRight, Moon, ShieldCheck, AlertCircle, PlusCircle 
} from 'lucide-react';
import { handleLogoutAction } from "@/app/actions/auth";

import { updateTieredPrices } from '@/app/actions/creator-actions';

interface UserSettingsProps {
  onBecomeCreatorClick?: () => void;
  showBecomeCreator?: boolean;
  user?: {
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

export default function UserSettings({ onBecomeCreatorClick, showBecomeCreator, user }: UserSettingsProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [tier1, setTier1] = useState(user?.creatorProfile?.tier1Price || 0);
  const [tier2, setTier2] = useState(user?.creatorProfile?.tier2Price || 0);
  const [tier3, setTier3] = useState(user?.creatorProfile?.tier3Price || 0);
  
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const isVerifiedCreator = user?.creatorStatus === 'APPROVED';

  const handleUpdatePrice = async () => {
    if (!user) return;
    setIsUpdatingPrice(true);
    const res = await updateTieredPrices(user.id, tier1, tier2, tier3);
    setIsUpdatingPrice(false);
    if (res.success) {
      alert("Subscription tiers updated successfully!");
    } else {
      alert(res.error || "Failed to update prices");
    }
  };

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
    <div className="w-full space-y-10">
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

      {isVerifiedCreator && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">
              Creator Tier Settings
            </h2>
            <button 
              onClick={handleUpdatePrice}
              disabled={isUpdatingPrice}
              className="text-[10px] font-black uppercase tracking-widest text-purple-500 hover:text-white transition-colors"
            >
              {isUpdatingPrice ? "Processing..." : "Save All Tiers"}
            </button>
          </div>
          
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 space-y-10 backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-zinc-300">Tier 1 <span className="text-[10px] not-italic text-zinc-500 font-bold ml-2">Bronze</span></h3>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-500 font-black">$</span>
                  <input 
                    type="number" 
                    value={tier1}
                    onChange={(e) => setTier1(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-4 bg-black border border-purple-500/30 rounded-2xl text-white font-black focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Tier 2 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-amber-500">Tier 2 <span className="text-[10px] not-italic text-zinc-500 font-bold ml-2">Silver</span></h3>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 font-black">$</span>
                  <input 
                    type="number" 
                    value={tier2}
                    onChange={(e) => setTier2(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-4 bg-black border border-amber-500/30 rounded-2xl text-white font-black focus:outline-none focus:border-amber-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Tier 3 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter text-emerald-500">Tier 3 <span className="text-[10px] not-italic text-zinc-500 font-bold ml-2">Gold</span></h3>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black">$</span>
                  <input 
                    type="number" 
                    value={tier3}
                    onChange={(e) => setTier3(Number(e.target.value))}
                    className="w-full pl-8 pr-4 py-4 bg-black border border-emerald-500/30 rounded-2xl text-white font-black focus:outline-none focus:border-emerald-500 transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-purple-500/10">
               <CreatorOptionCard 
                 title="Payout Method" 
                 desc="Manage where you receive your earnings" 
                 status="Verified" 
                 icon={<DollarSign size={20} className="text-purple-400" />} 
               />
               <CreatorOptionCard 
                 title="Tax Information" 
                 desc="Required for processing large payouts" 
                 status="Complete" 
                 icon={<ShieldCheck size={20} className="text-purple-400" />} 
               />
            </div>
          </div>
        </div>
      )}

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
const CreatorOptionCard = ({ title, desc, status, icon }: { title: string, desc: string, status: string, icon: React.ReactNode }) => (
  <div className="flex items-center justify-between p-6 bg-black border border-purple-500/10 rounded-3xl hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-sm font-black uppercase tracking-tight text-white">{title}</p>
        <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>
      </div>
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20">{status}</span>
  </div>
);
