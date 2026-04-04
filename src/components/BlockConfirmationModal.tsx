"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX, AlertCircle, Loader2 } from 'lucide-react';

interface BlockConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  username: string;
  loading: boolean;
}

export default function BlockConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  username,
  loading
}: BlockConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-zinc-950 border border-red-500/20 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header / Caution */}
            <div className="p-8 text-center border-b border-border-theme bg-red-500/5 relative">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <UserX size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                Block <span className="text-red-500">@{username}</span>?
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">
                This action is reversible but immediate
              </p>
            </div>

            {/* Warning Details */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-zinc-900/40 p-4 rounded-2xl border border-border-theme">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-tight text-white italic">Immediate Segregation</p>
                    <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                      All mutual follows and subscriptions will be revoked instantly. You will no longer see each other's content.
                    </p>
                  </div>
                </div>
                
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 text-center px-4">
                  They will not be notified of this block, but your profile will disappear for them.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 bg-zinc-900/50 flex gap-3 border-t border-border-theme">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 bg-zinc-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-colors disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 flex justify-center py-4 bg-red-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-500 transition-all shadow-lg shadow-red-500/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Block"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
