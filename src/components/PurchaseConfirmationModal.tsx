"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, AlertCircle, Loader2 } from 'lucide-react';

interface PurchaseConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemPrice: number; // in cents
  currentBalance: number; // in cents
  loading: boolean;
}

export default function PurchaseConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemPrice,
  currentBalance,
  loading
}: PurchaseConfirmationModalProps) {
  const newBalance = currentBalance - itemPrice;
  const isInsufficient = newBalance < 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-zinc-950 border border-zinc-800 rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-zinc-900 bg-zinc-900/40 relative">
              <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">
                Confirm <span className="text-purple-500">Purchase</span>
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2">
                Unlock Premium Content
              </p>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="flex flex-col items-center justify-center p-6 bg-purple-500/5 rounded-2xl border border-purple-500/10">
                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 mb-2">Item</span>
                <span className="text-sm font-bold text-white text-center break-words w-full px-2 leading-tight">{itemName}</span>
                <div className="mt-4 text-3xl font-black text-white tracking-tighter shadow-purple-500/20 drop-shadow-lg">
                  <span className="text-purple-500 text-xl mr-1">$</span>
                  {(itemPrice / 100).toFixed(2)}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-zinc-900/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={14} className="text-zinc-600" /> Current Balance
                  </span>
                  <span className="text-white font-black">${(currentBalance / 100).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-bold uppercase tracking-widest">
                    Cost
                  </span>
                  <span className="text-red-400 font-black">-${(itemPrice / 100).toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-zinc-900 border-dashed">
                  <span className="font-black uppercase tracking-widest text-[10px] text-zinc-400">
                    New Balance
                  </span>
                  <span className={`text-xl font-black ${isInsufficient ? 'text-red-500' : 'text-emerald-400'}`}>
                    ${(newBalance / 100).toFixed(2)}
                  </span>
                </div>
              </div>

              {isInsufficient && (
                <div className="flex flex-col items-center gap-2 mt-4 p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <AlertCircle size={20} className="text-red-500" />
                  <span className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center">
                    Insufficient funds. Please top up your wallet.
                  </span>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-zinc-900/50 flex gap-3 border-t border-zinc-900">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-4 bg-zinc-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-colors disabled:opacity-50 active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading || isInsufficient}
                className={`flex-1 flex justify-center py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  isInsufficient 
                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed border border-zinc-800/50' 
                  : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20 active:scale-95'
                }`}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirm Buy"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
