"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, ShieldCheck, Key, LogOut } from 'lucide-react';

import { changePassword, updateTwoFactor, updateLoginAlerts, getActiveSessions, revokeSession } from '@/app/actions/security-actions';

interface SecurityOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  isTwoFactorEnabled: boolean;
  defaultLoginAlerts: boolean;
}

const SECURITY_QUESTIONS = [
  "The name of your first pet?",
  "The name of your primary school?",
  "The first gift you got?"
];

export default function SecurityOverlay({ isOpen, onClose, userId, isTwoFactorEnabled, defaultLoginAlerts }: SecurityOverlayProps) {
  const [twoFactor, setTwoFactor] = useState(isTwoFactorEnabled);
  const [loginAlerts, setLoginAlerts] = useState(defaultLoginAlerts ?? false);
  
  // Password state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // 2FA state
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  
  // Sessions state
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      getActiveSessions(userId).then(res => {
        if (res.success) setSessions(res.sessions || []);
      });
      // (Optional: fetch user config here or lean on props. We start with loginAlerts=true mock for UI simplicity, ideally passed securely)
    }
  }, [isOpen, userId]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await changePassword(userId, oldPassword, newPassword);
    if (res.success) {
      alert("Password updated safely.");
      setIsChangingPassword(false);
      setOldPassword("");
      setNewPassword("");
    } else {
      alert(res.error);
    }
  };

  const handleToggle2FA = async () => {
    const newState = !twoFactor;
    if (newState && !answer) {
      alert("Please enter an answer to enable 2FA.");
      return;
    }
    const res = await updateTwoFactor(userId, newState ? question : null, newState ? answer : null, newState);
    if (res.success) setTwoFactor(newState);
  };

  const handleToggleLoginAlerts = async () => {
    const newState = !loginAlerts;
    const res = await updateLoginAlerts(userId, newState);
    if (res.success) setLoginAlerts(newState);
  };

  const handleRevoke = async (sessionId: string) => {
    const res = await revokeSession(sessionId);
    if (res.success) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100]"
          />

          {/* Sliding Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-background border-l border-border-theme z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-background/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                  Security & <span className="text-green-400">Password</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Protect your account</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-card-bg hover:bg-card-hover rounded-full border border-border-theme transition-all group"
              >
                <X size={20} className="text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              
              {/* Change Password */}
               <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Authentication</label>
                <div className="p-6 bg-card-bg/30 border border-border-theme rounded-[2.5rem] transition-all">
                  <div className="flex items-center justify-between cursor-pointer group mb-2" onClick={() => setIsChangingPassword(!isChangingPassword)}>
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-card-bg text-muted-foreground group-hover:text-green-400 transition-colors">
                        <Key size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Change Password</h4>
                         <p className="text-[10px] text-muted-foreground font-medium mt-1">Update your login credentials</p>
                      </div>
                    </div>
                  </div>
                  
                  {isChangingPassword && (
                     <form onSubmit={handlePasswordChange} className="mt-4 space-y-3 pt-4 border-t border-border-theme">
                      <input 
                        type="password" placeholder="Current Password" required
                        className="w-full px-4 py-3 bg-background border border-border-theme rounded-xl text-xs text-foreground focus:outline-none focus:border-green-500 transition-all"
                        value={oldPassword} onChange={e => setOldPassword(e.target.value)}
                      />
                      <input 
                        type="password" placeholder="New Password" required
                        className="w-full px-4 py-3 bg-background border border-border-theme rounded-xl text-xs text-foreground focus:outline-none focus:border-green-500 transition-all"
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      />
                      <button type="submit" className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl text-[10px] uppercase font-black tracking-widest text-white transition-all shadow-lg shadow-green-500/20">
                        Update Password
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Toggles */}
               <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Advanced Security</label>
                <div className="bg-card-bg/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  {/* Two Factor */}
                  <div className="p-6 border-b border-border-theme">
                    <div className="flex items-center justify-between cursor-pointer" onClick={handleToggle2FA}>
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-colors ${twoFactor ? 'bg-green-500/10 text-green-500' : 'bg-card-bg text-muted-foreground'}`}>
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Two-Factor Auth</h4>
                          <p className="text-[10px] text-muted-foreground font-medium mt-1">Security question layer</p>
                        </div>
                      </div>
                      <div className={`w-14 h-8 rounded-full relative transition-all duration-300 ${twoFactor ? 'bg-green-500' : 'bg-card-bg'}`}>
                        <motion.div animate={{ x: twoFactor ? 28 : 4 }} className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md" />
                      </div>
                    </div>
                                        {!twoFactor && (
                      <div className="mt-6 pt-4 border-t border-border-theme space-y-3">
                        <select 
                          className="w-full px-4 py-3 bg-background border border-border-theme rounded-xl text-xs text-muted-foreground focus:outline-none focus:border-green-500 transition-all cursor-pointer"
                          value={question} onChange={e => setQuestion(e.target.value)}
                        >
                           {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                        <input 
                          type="text" placeholder="Your Answer"
                          className="w-full px-4 py-3 bg-background border border-border-theme rounded-xl text-xs text-foreground focus:outline-none focus:border-green-500 transition-all"
                          value={answer} onChange={e => setAnswer(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Login Alerts */}
                   <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${loginAlerts ? 'bg-green-500/10 text-green-500' : 'bg-card-bg text-muted-foreground'}`}>
                        <Lock size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Login Alerts</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Get notified of new logins</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleToggleLoginAlerts}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${loginAlerts ? 'bg-green-500' : 'bg-card-bg'}`}
                    >
                      <motion.div 
                        animate={{ x: loginAlerts ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Sessions */}
               <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Active Sessions</label>
                <div className="p-6 bg-card-bg/30 border border-border-theme rounded-[2.5rem]">
                  <div className="flex flex-col gap-4">
                    {sessions.map((s, idx) => {
                      const isActive = new Date(s.expires).getTime() > Date.now();
                      if (!isActive) return null;
                      return (
                        <div key={s.id} className={`flex items-center justify-between ${idx !== sessions.length -1 ? 'pb-4 border-b border-border-theme' : ''}`}>
                          <div>
                            <h4 className="text-sm font-bold text-foreground">{s.device || 'Unknown Device'}</h4>
                            <p className="text-[10px] text-muted-foreground font-medium mt-1">Expires: {new Date(s.expires).toLocaleDateString()}</p>
                          </div>
                          <button onClick={() => handleRevoke(s.id)} className="text-[10px] px-4 py-2 bg-card-bg hover:bg-card-hover text-foreground border border-border-theme rounded-xl font-bold uppercase transition-all active:scale-95">
                            Revoke
                          </button>
                        </div>
                      );
                    })}
                    {sessions.length === 0 && <p className="text-xs text-muted-foreground text-center py-2 italic">Monitoring sessions...</p>}
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
