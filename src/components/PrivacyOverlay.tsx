"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, EyeOff, UserX, Loader2, Trash2 } from 'lucide-react';
import { updatePrivacySettings, updateActivityStatus } from '@/app/actions/security-actions';
import { getBlockedUsers, unblockUser } from '@/app/actions/block';
import Image from 'next/image';

interface PrivacyOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  defaultPrivateAccount: boolean;
  defaultActivityStatus: boolean;
  onUpdate?: (updates: { isPrivateAccount?: boolean; isActivityStatusEnabled?: boolean }) => void;
}

export default function PrivacyOverlay({ 
  isOpen, 
  onClose, 
  userId, 
  defaultPrivateAccount,
  defaultActivityStatus,
  onUpdate
}: PrivacyOverlayProps) {
  const [privateAccount, setPrivateAccount] = useState(defaultPrivateAccount);
  const [activityStatus, setActivityStatus] = useState(defaultActivityStatus);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [isBlocksExpanded, setIsBlocksExpanded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBlockedUsers();
    }
  }, [isOpen]);

  // Update local state when props change (e.g. after a refresh or parent update)
  useEffect(() => {
    setPrivateAccount(defaultPrivateAccount);
    setActivityStatus(defaultActivityStatus);
  }, [defaultPrivateAccount, defaultActivityStatus]);

  const loadBlockedUsers = async () => {
    setLoadingBlocks(true);
    const users = await getBlockedUsers();
    setBlockedUsers(users);
    setLoadingBlocks(false);
  };

  const handleUnblock = async (targetId: string) => {
    const res = await unblockUser(targetId);
    if (res.success) {
      setBlockedUsers(prev => prev.filter(u => u.id !== targetId));
    }
  };

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
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-background border-l border-border-theme z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                  Account <span className="text-purple-400">Privacy</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Control your visibility</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-card-bg hover:bg-card-hover rounded-full border border-border-theme transition-all group"
              >
                <X size={20} className="text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Visibility Rules</label>
                <div className="bg-card-bg/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 border-b border-border-theme flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${privateAccount ? 'bg-purple-500/10 text-purple-500' : 'bg-card-bg text-muted-foreground'}`}>
                        <EyeOff size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Private Account</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Only approved followers can see posts</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const newVal = !privateAccount;
                        setPrivateAccount(newVal);
                        await updatePrivacySettings(userId, newVal);
                        if (onUpdate) onUpdate({ isPrivateAccount: newVal });
                      }}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${privateAccount ? 'bg-purple-500' : 'bg-card-bg'}`}
                    >
                      <motion.div 
                        animate={{ x: privateAccount ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                  
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${activityStatus ? 'bg-purple-500/10 text-purple-500' : 'bg-card-bg text-muted-foreground'}`}>
                        <ShieldCheck size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Activity Status</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Show when you are active</p>
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        const newVal = !activityStatus;
                        setActivityStatus(newVal);
                        await updateActivityStatus(userId, newVal);
                        if (onUpdate) onUpdate({ isActivityStatusEnabled: newVal });
                      }}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${activityStatus ? 'bg-purple-500' : 'bg-card-bg'}`}
                    >
                      <motion.div 
                        animate={{ x: activityStatus ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Connections</label>
                <div 
                  onClick={() => setIsBlocksExpanded(!isBlocksExpanded)}
                  className="p-6 bg-card-bg/30 border border-border-theme rounded-[2.5rem] group hover:bg-card-bg/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-card-bg text-muted-foreground group-hover:text-purple-400 transition-colors">
                        <UserX size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Blocked Accounts</h4>
                         <p className="text-[10px] text-muted-foreground font-medium mt-1">Manage users you have blocked</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-card-bg px-3 py-1 rounded-full text-foreground font-bold">{blockedUsers.length}</span>
                  </div>

                  <AnimatePresence>
                    {isBlocksExpanded && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-6 space-y-4"
                      >
                         <div className="h-px bg-border-theme w-full mb-6" />
                         {loadingBlocks ? (
                           <div className="flex justify-center py-4"><Loader2 className="animate-spin text-zinc-600" /></div>
                         ) : blockedUsers.length > 0 ? (
                           blockedUsers.map(user => (
                             <div key={user.id} className="flex items-center justify-between py-2">
                               <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full overflow-hidden bg-card-bg border border-border-theme relative">
                                   <Image src={user.image || "/default_user_profile/default-avatar.png"} alt={user.username} fill className="object-cover" />
                                 </div>
                                 <div>
                                   <p className="text-xs font-black text-foreground uppercase italic tracking-tighter">@{user.username}</p>
                                   <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">{user.name}</p>
                                 </div>
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); handleUnblock(user.id); }}
                                 className="p-2.5 bg-card-bg hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-xl transition-all border border-transparent hover:border-red-500/20"
                               >
                                 <Trash2 size={14} />
                               </button>
                             </div>
                           ))
                         ) : (
                           <p className="text-center text-[10px] text-zinc-600 font-black uppercase tracking-widest py-4">No blocked accounts</p>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
