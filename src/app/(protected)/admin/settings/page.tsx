"use client";

import { useState } from "react";
import { 
  Settings, 
  Shield, 
  Globe, 
  Bell, 
  Lock, 
  CreditCard, 
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  Save,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getSystemSettings, updateSystemSettings } from "@/app/actions/admin-actions";
import { useEffect } from "react";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [fee, setFee] = useState(20);

  useEffect(() => {
    async function fetchSettings() {
        const res = await getSystemSettings();
        if (res.success && res.settings) {
            setFee(res.settings.platformFee);
        }
    }
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const res = await updateSystemSettings(fee);
    if (res.success) {
        alert("System settings updated successfully!");
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'storage', label: 'Storage', icon: HardDrive },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-8 rounded-3xl border border-border-theme shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-emerald-500">
            <Settings size={200} />
        </div>
        <div className="space-y-1 relative z-10 text-white">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-zinc-500 font-medium">Global configuration for the X-Social platform.</p>
        </div>
        <div className="flex gap-4 relative z-10">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3.5 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-2 hover:bg-zinc-200 active:scale-95 transition-all disabled:opacity-50"
            >
                {saving ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                Update
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="space-y-2">
            {tabs.map((t) => {
                const Icon = t.icon;
                return (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-bold transition-all
                            ${activeTab === t.id ? 'bg-zinc-900 text-white border border-border-theme shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Icon size={18} className={activeTab === t.id ? "text-emerald-500" : ""} />
                        {t.label}
                    </button>
                );
            })}
        </div>

        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'general' && (
                <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-10 bg-zinc-950 rounded-3xl border border-border-theme space-y-8"
                >
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Globe className="text-emerald-500" />
                            <h2 className="text-xl font-bold">Platform Configuration</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Platform Name</label>
                                <input type="text" defaultValue="X-Social (Dating & Creators)" className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-white font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Support Email</label>
                                <input type="email" defaultValue="admin@xsocial.com" className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-emerald-500 transition-all text-white font-medium" />
                            </div>
                        </div>

                        <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-3xl flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <AlertTriangle className="text-amber-500" size={32} />
                                <div>
                                    <p className="font-bold text-white">Maintenance Mode</p>
                                    <p className="text-xs text-zinc-500">Temporarily disable all user-facing activities.</p>
                                </div>
                             </div>
                             <button className="px-6 py-2 bg-zinc-900 rounded-xl text-xs font-black uppercase tracking-widest border border-border-theme hover:border-amber-500 transition-all">Enable</button>
                        </div>
                    </div>

                    <div className="space-y-6 pt-10 border-t border-border-theme">
                         <div className="flex items-center gap-3 mb-6">
                            <Bell className="text-blue-500" />
                            <h2 className="text-xl font-bold">Registration & Policy</h2>
                        </div>
                        <div className="space-y-4">
                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-border-theme">
                                <p className="font-medium">Public Registrations</p>
                                <div className="w-12 h-6 bg-emerald-600 rounded-full flex items-center justify-end px-1"><div className="w-4 h-4 bg-white rounded-full" /></div>
                             </div>
                             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-border-theme">
                                <p className="font-medium">Email Verification Required</p>
                                <div className="w-12 h-6 bg-zinc-800 rounded-full flex items-center justify-start px-1"><div className="w-4 h-4 bg-white rounded-full" /></div>
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {activeTab === 'payments' && (
                <motion.div
                    key="payments"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-10 bg-zinc-950 rounded-3xl border border-border-theme space-y-8"
                >
                    <div className="flex items-center gap-3 mb-10">
                        <CreditCard className="text-purple-500" />
                        <h2 className="text-xl font-bold">Monetization Settings</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Platform Commission (%)</p>
                            <input 
                                type="number" 
                                value={fee} 
                                onChange={(e) => setFee(Number(e.target.value))}
                                className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all text-white font-black text-2xl" 
                            />
                            <p className="text-[10px] text-zinc-500 italic ml-1">The percentage taken from every purchase or subscription.</p>
                        </div>
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Minimum Payout ($)</p>
                            <input type="number" defaultValue="50" className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all text-white font-black text-2xl" />
                        </div>
                    </div>

                    <div className="p-8 bg-purple-500/5 border border-purple-500/20 rounded-3xl mt-10">
                        <h4 className="font-black text-sm uppercase tracking-widest text-purple-400 mb-4">Payout Method</h4>
                        <div className="flex gap-4">
                             <div className="p-4 bg-black border-2 border-purple-500 rounded-2xl flex-1 flex items-center justify-between">
                                <span className="font-bold">Stripe Connect</span>
                                <CheckCircle2 className="text-purple-500" size={20} />
                             </div>
                             <div className="p-4 bg-black border border-border-theme rounded-2xl flex-1 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 cursor-pointer transition-all">
                                <span className="font-bold">PayPal Business</span>
                             </div>
                        </div>
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
