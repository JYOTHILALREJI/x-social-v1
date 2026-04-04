"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

import { deletePost, deleteReel } from '@/app/actions/content';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
  type: 'post' | 'reel';
  onDelete: (id: string, type: 'post' | 'reel') => void;
}

export default function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  itemId,
  type,
  onDelete
}: DeleteConfirmationModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    const res = type === 'post' ? await deletePost(itemId) : await deleteReel(itemId);
    
    if (res.success) {
      onDelete(itemId, type);
      onClose();
    } else {
      alert(res.error || "Failed to delete content");
    }
    setIsDeleting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="absolute inset-0" 
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-zinc-950 border border-white/10 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(239,68,68,0.15)] flex flex-col z-[210]"
          >
            {/* Header / Icon */}
            <div className="pt-12 pb-8 flex flex-col items-center text-center px-10">
              <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-4 leading-none">
                Delete Permanently?
              </h3>
              <p className="text-xs font-medium text-white/40 leading-relaxed uppercase tracking-wider">
                This action cannot be undone. All data associated with this {type} will be removed from our servers forever.
              </p>
            </div>

            {/* Actions */}
            <div className="p-10 bg-white/5 border-t border-white/5 flex flex-col gap-3">
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(239,68,68,1)" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirm}
                disabled={isDeleting}
                className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20"
              >
                {isDeleting ? <Loader2 size={16} className="animate-spin text-white" /> : (
                  <>
                    <Trash2 size={16} />
                    Confirm Deletion
                  </>
                )}
              </motion.button>
              
              <motion.button 
                whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                disabled={isDeleting}
                className="w-full py-5 bg-transparent text-white/40 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl border border-white/10 transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
