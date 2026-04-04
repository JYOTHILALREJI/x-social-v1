"use client";

import React, { useState, useEffect } from 'react';
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
    name: string | null;
    bio: string | null;
    image: string | null;
    dob: string | Date;
    role: string;
    isGhost: boolean;
    creatorStatus: string;
    creatorProfile: {
      tier1Price: number;
      tier1Duration: number;
      tier2Price: number;
      tier2Duration: number;
      tier3Price: number;
      tier3Duration: number;
    } | null;
  };
  onEditProfile?: () => void;
  onSecurityClick?: () => void;
  onPrivacyClick?: () => void;
  onAppearanceClick?: () => void;
  onContentPreferencesClick?: () => void;
}

export default function UserSettings({ 
  onBecomeCreatorClick, showBecomeCreator, user, onEditProfile,
  onSecurityClick, onPrivacyClick, onAppearanceClick, onContentPreferencesClick
}: UserSettingsProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const [tier1, setTier1] = useState((user?.creatorProfile?.tier1Price || 0) / 100);
  const [tier2, setTier2] = useState((user?.creatorProfile?.tier2Price || 0) / 100);
  const [tier3, setTier3] = useState((user?.creatorProfile?.tier3Price || 0) / 100);

  // Initialize duration states. DB stores days. If perfectly divisible by 30, show as months.
  const initDur = (dbDays: number = 30) => {
    if (dbDays > 0 && dbDays % 30 === 0) return { val: dbDays / 30, unit: 'Months' };
    return { val: dbDays, unit: 'Days' };
  };

  const [t1Dur, setT1Dur] = useState(initDur(user?.creatorProfile?.tier1Duration).val);
  const [t1Unit, setT1Unit] = useState(initDur(user?.creatorProfile?.tier1Duration).unit);

  const [t2Dur, setT2Dur] = useState(initDur(user?.creatorProfile?.tier2Duration).val);
  const [t2Unit, setT2Unit] = useState(initDur(user?.creatorProfile?.tier2Duration).unit);

  const [t3Dur, setT3Dur] = useState(initDur(user?.creatorProfile?.tier3Duration).val);
  const [t3Unit, setT3Unit] = useState(initDur(user?.creatorProfile?.tier3Duration).unit);
  
  useEffect(() => {
    if (user?.creatorProfile) {
      setTier1(user.creatorProfile.tier1Price / 100);
      setTier2(user.creatorProfile.tier2Price / 100);
      setTier3(user.creatorProfile.tier3Price / 100);

      setT1Dur(initDur(user.creatorProfile.tier1Duration).val);
      setT1Unit(initDur(user.creatorProfile.tier1Duration).unit);

      setT2Dur(initDur(user.creatorProfile.tier2Duration).val);
      setT2Unit(initDur(user.creatorProfile.tier2Duration).unit);

      setT3Dur(initDur(user.creatorProfile.tier3Duration).val);
      setT3Unit(initDur(user.creatorProfile.tier3Duration).unit);
    }
  }, [user?.creatorProfile]);
  
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);

  const isVerifiedCreator = user?.creatorStatus === 'APPROVED';

  const [isEditingTiers, setIsEditingTiers] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{show: boolean, type: 'success' | 'error', message: string} | null>(null);

  const handleUpdatePrice = async () => {
    if (!user) return;
    setIsUpdatingPrice(true);
    
    // Convert to days before saving
    const d1 = t1Unit === 'Months' ? t1Dur * 30 : t1Dur;
    const d2 = t2Unit === 'Months' ? t2Dur * 30 : t2Dur;
    const d3 = t3Unit === 'Months' ? t3Dur * 30 : t3Dur;

    // Convert dollars to cents before saving
    const p1 = Math.round(tier1 * 100);
    const p2 = Math.round(tier2 * 100);
    const p3 = Math.round(tier3 * 100);

    const res = await updateTieredPrices(user.id, p1, d1, p2, d2, p3, d3);
    setIsUpdatingPrice(false);
    if (res.success) {
      setSaveStatus({ show: true, type: 'success', message: "Subscription tiers updated successfully!" });
      setIsEditingTiers(false);
    } else {
      setSaveStatus({ show: true, type: 'error', message: res.error || "Failed to update prices" });
    }
  };

  const handleCancelEditing = () => {
    setTier1((user?.creatorProfile?.tier1Price || 0) / 100);
    setT1Dur(initDur(user?.creatorProfile?.tier1Duration).val);
    setT1Unit(initDur(user?.creatorProfile?.tier1Duration).unit);

    setTier2((user?.creatorProfile?.tier2Price || 0) / 100);
    setT2Dur(initDur(user?.creatorProfile?.tier2Duration).val);
    setT2Unit(initDur(user?.creatorProfile?.tier2Duration).unit);

    setTier3((user?.creatorProfile?.tier3Price || 0) / 100);
    setT3Dur(initDur(user?.creatorProfile?.tier3Duration).val);
    setT3Unit(initDur(user?.creatorProfile?.tier3Duration).unit);

    setIsEditingTiers(false);
  };

  const settingsSections = [
    {
      title: "Account",
      items: [
        { icon: User, label: "Edit Profile", color: "text-blue-400", onClick: onEditProfile || (() => {}) },
        { icon: Lock, label: "Password & Security", color: "text-green-400", onClick: onSecurityClick || (() => {}) },
        { icon: ShieldCheck, label: "Privacy", color: "text-purple-400", onClick: onPrivacyClick || (() => {}) },
      ]
    },
    {
      title: "Preferences",
      items: [
        { icon: Moon, label: "Appearance", color: "text-zinc-400", onClick: onAppearanceClick || (() => {}) },
        { icon: Eye, label: "Content Preferences", color: "text-pink-400", onClick: onContentPreferencesClick || (() => {}) },
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
          <div className="bg-card-bg/20 border border-border-theme rounded-[2.5rem] overflow-hidden backdrop-blur-md">
            {section.items.map((item, i) => (
              <button 
                key={i} 
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-6 hover:bg-card-hover/30 border-b border-border-theme last:border-0 group transition-all"
              >
                <div className="flex items-center gap-5">
                  <div className={`p-3 rounded-2xl bg-card-bg/50 ${item.color.replace('text', 'bg').replace('400', '400/10').replace('500', '500/10')}`}>
                     <item.icon size={22} className={item.color} />
                  </div>
                  <span className="font-bold text-foreground text-lg">{item.label}</span>
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
            <div className="flex items-center gap-4">
              {isEditingTiers && (
                <button 
                  onClick={handleCancelEditing}
                  disabled={isUpdatingPrice}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={isEditingTiers ? handleUpdatePrice : () => setIsEditingTiers(true)}
                disabled={isUpdatingPrice}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20 active:scale-95 disabled:opacity-50"
              >
                {isUpdatingPrice ? "Processing..." : isEditingTiers ? "Save All Tiers" : "Edit Tiers"}
              </button>
            </div>
          </div>
          
          <div className="bg-purple-500/5 border border-purple-500/20 rounded-[2.5rem] p-8 space-y-10 backdrop-blur-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Tier 1 - Bronze */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter" style={{ color: '#CD7F32' }}>
                    Tier 1 <span className="text-[10px] not-italic text-muted-foreground font-bold ml-2">Bronze</span>
                  </h3>
                </div>
                {isEditingTiers ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black" style={{ color: '#CD7F32' }}>$</span>
                      <input 
                        type="number" 
                        value={tier1}
                        onChange={(e) => setTier1(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#CD7F324D' }}
                        placeholder="Amount in dollars"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={t1Dur}
                        onChange={(e) => setT1Dur(Number(e.target.value))}
                        className="w-2/3 px-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#CD7F324D' }}
                        placeholder="Duration"
                      />
                      <select 
                        value={t1Unit}
                        onChange={(e) => setT1Unit(e.target.value)}
                        className="w-1/3 px-2 py-3 bg-background border rounded-2xl text-foreground text-xs font-black focus:outline-none transition-all cursor-pointer"
                        style={{ borderColor: '#CD7F324D' }}
                      >
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-5 bg-background/50 border rounded-2xl" style={{ borderColor: '#CD7F3220' }}>
                    <span className="text-3xl font-black text-white italic tracking-tighter">${tier1.toFixed(2)}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Every {t1Unit === 'Months' && t1Dur === 1 ? 'Month' : `${t1Dur} ${t1Unit}`}</span>
                  </div>
                )}
              </div>

              {/* Tier 2 - Silver */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter" style={{ color: '#C0C0C0' }}>
                    Tier 2 <span className="text-[10px] not-italic text-muted-foreground font-bold ml-2">Silver</span>
                  </h3>
                </div>
                {isEditingTiers ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black" style={{ color: '#C0C0C0' }}>$</span>
                      <input 
                        type="number" 
                        value={tier2}
                        onChange={(e) => setTier2(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#C0C0C04D' }}
                        placeholder="Amount in dollars"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={t2Dur}
                        onChange={(e) => setT2Dur(Number(e.target.value))}
                        className="w-2/3 px-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#C0C0C04D' }}
                        placeholder="Duration"
                      />
                      <select 
                        value={t2Unit}
                        onChange={(e) => setT2Unit(e.target.value)}
                        className="w-1/3 px-2 py-3 bg-background border rounded-2xl text-foreground text-xs font-black focus:outline-none transition-all cursor-pointer"
                        style={{ borderColor: '#C0C0C04D' }}
                      >
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-5 bg-background/50 border rounded-2xl" style={{ borderColor: '#C0C0C020' }}>
                    <span className="text-3xl font-black text-white italic tracking-tighter">${tier2.toFixed(2)}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Every {t2Unit === 'Months' && t2Dur === 1 ? 'Month' : `${t2Dur} ${t2Unit}`}</span>
                  </div>
                )}
              </div>

              {/* Tier 3 - Gold */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter" style={{ color: '#FFD700' }}>
                    Tier 3 <span className="text-[10px] not-italic text-muted-foreground font-bold ml-2">Gold</span>
                  </h3>
                </div>
                {isEditingTiers ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black" style={{ color: '#FFD700' }}>$</span>
                      <input 
                        type="number" 
                        value={tier3}
                        onChange={(e) => setTier3(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#FFD7004D' }}
                        placeholder="Amount in dollars"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        value={t3Dur}
                        onChange={(e) => setT3Dur(Number(e.target.value))}
                        className="w-2/3 px-4 py-3 bg-background border rounded-2xl text-foreground font-black focus:outline-none transition-all"
                        style={{ borderColor: '#FFD7004D' }}
                        placeholder="Duration"
                      />
                      <select 
                        value={t3Unit}
                        onChange={(e) => setT3Unit(e.target.value)}
                        className="w-1/3 px-2 py-3 bg-background border rounded-2xl text-foreground text-xs font-black focus:outline-none transition-all cursor-pointer"
                        style={{ borderColor: '#FFD7004D' }}
                      >
                        <option value="Days">Days</option>
                        <option value="Months">Months</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-5 bg-background/50 border rounded-2xl" style={{ borderColor: '#FFD70020' }}>
                    <span className="text-3xl font-black text-white italic tracking-tighter">${tier3.toFixed(2)}</span>
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Every {t3Unit === 'Months' && t3Dur === 1 ? 'Month' : `${t3Dur} ${t3Unit}`}</span>
                  </div>
                )}
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
          <div className="bg-background border border-border-theme w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500" size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-foreground">Log Out?</h2>
              <p className="text-muted-foreground text-sm mb-8 italic">Your session will be terminated in the database.</p>
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
                  className="w-full py-4 bg-card-bg text-muted-foreground hover:text-foreground hover:bg-card-hover font-bold uppercase text-xs rounded-2xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {saveStatus?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background border border-border-theme w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${saveStatus.type === 'success' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {saveStatus.type === 'success' ? <ShieldCheck className="text-emerald-500" size={32} /> : <AlertCircle className="text-red-500" size={32} />}
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2 text-foreground">
                {saveStatus.type === 'success' ? "Success" : "Error"}
              </h2>
              <p className="text-muted-foreground text-sm mb-8 italic">{saveStatus.message}</p>
              <button 
                onClick={() => setSaveStatus(null)} 
                className="w-full py-4 bg-card-bg border border-border-theme text-foreground hover:bg-card-hover font-black uppercase tracking-widest text-[10px] rounded-2xl transition-colors"
               >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const CreatorOptionCard = ({ title, desc, status, icon }: { title: string, desc: string, status: string, icon: React.ReactNode }) => (
  <div className="flex items-center justify-between p-6 bg-card-bg border border-purple-500/10 rounded-3xl hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div>
        <p className="text-sm font-black uppercase tracking-tight text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{desc}</p>
      </div>
    </div>
    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full border border-purple-500/20">{status}</span>
  </div>
);
