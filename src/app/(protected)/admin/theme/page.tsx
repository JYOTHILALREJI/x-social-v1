"use client";

import { useState } from "react";
import { 
  Palette, 
  Moon, 
  Sun, 
  Monitor, 
  Settings, 
  Save, 
  RotateCcw, 
  Layout, 
  Type, 
  Component as ComponentIcon,
  Sparkles,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminThemePage() {
  const [activeTab, setActiveTab] = useState<'colors' | 'layout' | 'typography'>('colors');
  const [saving, setSaving] = useState(false);

  // Mock settings
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#a855f7", // Purple
    secondaryColor: "#ec4899", // Pink
    accentColor: "#3b82f6", // Blue
    borderRadius: "20px",
    fontFamily: "Outfit, Inter, sans-serif",
    darkMode: true,
    glassmorphism: true,
    animationSpeed: "0.4s",
  });

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Theme settings saved and applied globally!");
    }, 1500);
  };

  const colors = [
    { name: "Purple", hex: "#a855f7" },
    { name: "Pink", hex: "#ec4899" },
    { name: "Blue", hex: "#3b82f6" },
    { name: "Emerald", hex: "#10b981" },
    { name: "Rose", hex: "#f43f5e" },
    { name: "Indigo", hex: "#6366f1" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-8 rounded-3xl border border-zinc-900 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-purple-500">
            <Palette size={200} />
        </div>
        <div className="space-y-1 relative z-10 text-white">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Theme Customization
          </h1>
          <p className="text-zinc-500 font-medium">Control the visual aesthetics and interaction feel of X-Social.</p>
        </div>
        <div className="flex gap-4 relative z-10">
            <button 
                onClick={handleSave}
                disabled={saving}
                className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-2 hover:shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                Save Changes
            </button>
            <button className="p-3.5 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                <RotateCcw size={20} />
            </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation */}
        <div className="lg:col-span-1 space-y-2">
            {[
                { id: 'colors', label: 'Color Palette', icon: Palette },
                { id: 'layout', label: 'Layout & Shapes', icon: Layout },
                { id: 'typography', label: 'Typography', icon: Type },
            ].map((tab) => {
                const Icon = tab.icon;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl text-sm font-bold transition-all duration-300
                            ${activeTab === tab.id ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:bg-zinc-900/50'}`}
                    >
                        <div className="flex items-center gap-3">
                            <Icon size={18} className={activeTab === tab.id ? "text-purple-500" : ""} />
                            {tab.label}
                        </div>
                        {activeTab === tab.id && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50" />}
                    </button>
                );
            })}
        </div>

        {/* Customization Details */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'colors' && (
              <motion.div
                key="colors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 bg-zinc-950 rounded-3xl border border-zinc-900 shadow-xl space-y-10"
              >
                <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Sparkles size={20} className="text-yellow-500" />
                        Color Tokens
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Primary Brand Color</p>
                            <div className="flex gap-3 flex-wrap">
                                {colors.map(c => (
                                    <button 
                                        key={c.hex} 
                                        onClick={() => setThemeSettings({ ...themeSettings, primaryColor: c.hex })}
                                        className={`w-12 h-12 rounded-2xl transition-all shadow-xl group relative 
                                            ${themeSettings.primaryColor === c.hex ? 'ring-4 ring-white ring-offset-4 ring-offset-black scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c.hex }}
                                    >
                                        {themeSettings.primaryColor === c.hex && <div className="absolute inset-0 flex items-center justify-center text-white"><Save size={14} /></div>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-xs font-black uppercase text-zinc-500 tracking-widest">Secondary Accent Color</p>
                            <div className="flex gap-3 flex-wrap">
                                {colors.map(c => (
                                    <button 
                                        key={c.hex} 
                                        onClick={() => setThemeSettings({ ...themeSettings, secondaryColor: c.hex })}
                                        className={`w-12 h-12 rounded-2xl transition-all shadow-xl
                                            ${themeSettings.secondaryColor === c.hex ? 'ring-4 ring-white ring-offset-4 ring-offset-black scale-110' : 'hover:scale-105'}`}
                                        style={{ backgroundColor: c.hex }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 pt-10 border-t border-zinc-900">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Moon size={20} className="text-blue-500" />
                        Mode & Effects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between group hover:border-blue-500/50 transition-all">
                             <div className="space-y-1">
                                <p className="font-bold">Glassmorphism</p>
                                <p className="text-xs text-zinc-500">Enable frosted glass effects globally.</p>
                             </div>
                             <div 
                                onClick={() => setThemeSettings({...themeSettings, glassmorphism: !themeSettings.glassmorphism})}
                                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${themeSettings.glassmorphism ? 'bg-blue-600' : 'bg-zinc-700'}`}
                             >
                                <motion.div 
                                    animate={{ x: themeSettings.glassmorphism ? 24 : 0 }}
                                    className="w-6 h-6 bg-white rounded-full shadow-lg shadow-blue-500/20" 
                                />
                             </div>
                        </div>

                        <div className="p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between group hover:border-purple-500/50 transition-all">
                             <div className="space-y-1">
                                <p className="font-bold">Ultra-Smooth Animations</p>
                                <p className="text-xs text-zinc-500">Enable high-framerate transitions.</p>
                             </div>
                             <div 
                                className={`w-14 h-8 bg-purple-600 rounded-full p-1 cursor-not-allowed opacity-100 flex items-center`}
                             >
                                <div className="w-6 h-6 bg-white rounded-full translate-x-[24px]" />
                             </div>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'layout' && (
               <motion.div
                key="layout"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-10 bg-zinc-950 rounded-3xl border border-zinc-900 shadow-xl space-y-10"
               >
                 <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Layout size={20} className="text-pink-500" />
                        Component Radii
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {["0.5rem", "1rem", "1.5rem", "2rem", "3rem"].map(r => (
                            <button
                                key={r}
                                onClick={() => setThemeSettings({ ...themeSettings, borderRadius: r })}
                                className={`p-6 rounded-2xl border transition-all text-center group
                                    ${themeSettings.borderRadius === r ? 'bg-pink-500/10 border-pink-500 text-pink-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
                            >
                                <div 
                                    className="w-12 h-12 mx-auto mb-4 bg-zinc-800 border-2 border-dashed border-zinc-700 group-hover:bg-zinc-700 transition-colors" 
                                    style={{ borderRadius: r }} 
                                />
                                <p className="text-xs font-black uppercase tracking-widest">{r === "0.5rem" ? "Sharp" : r === "1rem" ? "Rounded" : r === "3rem" ? "Super Soft" : "Curvy"}</p>
                                <p className="font-bold text-lg mt-1">{r}</p>
                            </button>
                        ))}
                    </div>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
          
          {/* Live Preview Card */}
          <div className="mt-12 p-10 bg-zinc-950 rounded-3xl border border-zinc-900 border-dashed relative overflow-hidden">
             <div className="absolute top-0 left-0 p-6 opacity-10">
                <Monitor size={100} />
             </div>
             <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2 relative z-10">
                <Zap size={14} className="text-yellow-500" />
                Live Design Preview
             </h3>

             <div className="flex flex-col md:flex-row gap-12 relative z-10">
                <div 
                    className="p-8 rounded-3xl shadow-2xl space-y-4 border transition-all duration-500"
                    style={{ 
                        borderRadius: themeSettings.borderRadius, 
                        borderColor: themeSettings.primaryColor + '30',
                        backgroundColor: themeSettings.primaryColor + '10',
                        backdropFilter: themeSettings.glassmorphism ? 'blur(12px)' : 'none'
                    }}
                >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-white to-zinc-400 opacity-20" />
                    <div className="space-y-2">
                        <div className="h-4 w-32 bg-white/20 rounded-full" />
                        <div className="h-2 w-20 bg-white/10 rounded-full" />
                    </div>
                    <button 
                        className="w-full py-3 rounded-xl font-bold text-sm shadow-xl transition-all"
                        style={{ backgroundColor: themeSettings.primaryColor, color: 'white' }}
                    >
                        Preview Button
                    </button>
                </div>

                <div className="flex-1 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-2xl font-black">Design Aesthetics</h4>
                        <p className="text-zinc-500 text-sm italic">"The user should be wowed at first glance by the design. Use best practices in modern web design (e.g. vibrant colors, dark modes, glassmorphism, and dynamic animations) to create a stunning first impression."</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1">
                             <h5 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-1">Color Token</h5>
                             <p className="font-mono font-bold text-sm text-purple-400">{themeSettings.primaryColor}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex-1">
                             <h5 className="font-bold text-xs uppercase tracking-widest text-zinc-500 mb-1">Border Radius</h5>
                             <p className="font-mono font-bold text-sm text-pink-400">{themeSettings.borderRadius}</p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
