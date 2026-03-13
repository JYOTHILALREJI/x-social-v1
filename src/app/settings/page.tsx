"use client";
import React from 'react';
import { 
  User, Lock, Bell, Eye, HelpCircle, 
  LogOut, ChevronRight, Moon, ShieldCheck 
} from 'lucide-react';
import Link from 'next/link';

const SettingsPage = () => {
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
    },
    {
      title: "Support",
      items: [
        { icon: HelpCircle, label: "Help Center", color: "text-zinc-500" },
      ]
    }
  ];

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
                {section.items.map((item, itemIdx) => (
                  <button 
                    key={itemIdx}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800 last:border-0 group"
                  >
                    <div className="flex items-center gap-4">
                      <item.icon size={20} className={item.color} />
                      <span className="font-medium text-zinc-200">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-zinc-600 group-hover:text-white transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ))}

          <button className="w-full flex items-center gap-4 p-4 text-red-500 font-bold hover:bg-red-500/10 rounded-2xl transition-colors mt-4">
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;