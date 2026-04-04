"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BellRing, Mail, Smartphone, AtSign } from 'lucide-react';

interface NotificationsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsOverlay({ isOpen, onClose }: NotificationsOverlayProps) {
  const [pushNotifs, setPushNotifs] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [mentions, setMentions] = useState(true);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-950 border-l border-border-theme z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  Push <span className="text-yellow-400">Alerts</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Manage notifications</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-border-theme transition-all group"
              >
                <X size={20} className="text-zinc-500 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Delivery Methods</label>
                <div className="bg-zinc-900/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 border-b border-border-theme flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${pushNotifs ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-white">Push Notifications</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">Receive alerts on your device</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setPushNotifs(!pushNotifs)}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${pushNotifs ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                    >
                      <motion.div 
                        animate={{ x: pushNotifs ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                  
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${emailNotifs ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-white">Email Notifications</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">Weekly summaries and major alerts</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEmailNotifs(!emailNotifs)}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${emailNotifs ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                    >
                      <motion.div 
                        animate={{ x: emailNotifs ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Event Types</label>
                <div className="bg-zinc-900/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${mentions ? 'bg-yellow-500/10 text-yellow-500' : 'bg-zinc-800 text-zinc-400'}`}>
                        <AtSign size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-white">Mentions & Tags</h4>
                        <p className="text-[10px] text-zinc-500 font-medium mt-1">When someone mentions you</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMentions(!mentions)}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${mentions ? 'bg-yellow-500' : 'bg-zinc-800'}`}
                    >
                      <motion.div 
                        animate={{ x: mentions ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
