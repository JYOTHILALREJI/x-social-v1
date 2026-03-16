"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ExternalLink, UserCircle } from 'lucide-react';
import { updateCreatorStatus } from "@/app/lib/admin-actions";

export default function PendingCreatorsClient({ initialApplications }: { initialApplications: any[] }) {
  const [applications, setApplications] = useState(initialApplications);

  const handleAction = async (profileId: string, userId: string, status: "APPROVED" | "REJECTED") => {
    // Call the server action to update both User and CreatorProfile tables
    const result = await updateCreatorStatus(profileId, userId, status);
    
    if (result.success) {
      // Remove the item from the UI list smoothly
      setApplications(prev => prev.filter(app => app.id !== profileId));
    } else {
      alert("Failed to update status. Please check server logs.");
    }
  };

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-zinc-950/50 border border-zinc-900 rounded-[3rem]">
        <UserCircle size={48} className="text-zinc-800 mb-4" />
        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-xs italic">No pending applications</h3>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 w-full">
      <AnimatePresence>
        {applications.map((app) => (
          <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            key={app.id}
            className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center w-full group hover:border-purple-500/30 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">{app.user.username}</h3>
                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-500 text-[10px] font-bold rounded-full uppercase">
                  {app.user.role}
                </span>
              </div>
              <p className="text-zinc-500 text-xs font-bold mb-4 uppercase tracking-widest">{app.user.email}</p>
              
              <div className="flex flex-wrap gap-2">
                {app.categories?.map((cat: string) => (
                  <span key={cat} className="px-3 py-1 bg-zinc-900 text-[10px] font-bold uppercase rounded-lg text-zinc-400">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Proof Links */}
            <div className="flex flex-col gap-2 shrink-0">
              <a 
                href={app.idProofUrl} 
                target="_blank" 
                className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 hover:underline"
              >
                View ID Proof <ExternalLink size={12} />
              </a>
              <a 
                href={app.selfieUrl} 
                target="_blank" 
                className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400 hover:underline"
              >
                View Selfie <ExternalLink size={12} />
              </a>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleAction(app.id, app.userId, "REJECTED")}
                className="p-5 bg-zinc-900 hover:bg-red-500/20 text-zinc-600 hover:text-red-500 border border-zinc-800 rounded-3xl transition-all"
              >
                <X size={24} />
              </button>
              <button 
                onClick={() => handleAction(app.id, app.userId, "APPROVED")}
                className="px-10 py-5 bg-white text-black font-black uppercase rounded-3xl hover:bg-purple-600 hover:text-white transition-all flex items-center gap-3 active:scale-95"
              >
                <Check size={20} /> Approve
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}