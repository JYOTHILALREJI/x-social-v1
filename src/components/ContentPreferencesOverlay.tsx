"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MicOff, PlayCircle, Plus, Trash2, Tag } from 'lucide-react';
import { updateContentPreferences } from '@/app/actions/security-actions';

interface ContentPreferencesOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  defaultAutoplay?: boolean;
  defaultMutedWords?: string[];
}

export default function ContentPreferencesOverlay({
  isOpen,
  onClose,
  userId,
  defaultAutoplay = true,
  defaultMutedWords = [],
}: ContentPreferencesOverlayProps) {
  const [autoplay, setAutoplay] = useState(defaultAutoplay);
  const [mutedWords, setMutedWords] = useState<string[]>(defaultMutedWords);
  const [newWord, setNewWord] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync when overlay opens with fresh props
  useEffect(() => {
    if (isOpen) {
      setAutoplay(defaultAutoplay);
      setMutedWords(defaultMutedWords);
      setNewWord('');
    }
  }, [isOpen, defaultAutoplay, defaultMutedWords]);

  const saveAutoplay = async (val: boolean) => {
    setAutoplay(val);
    if (userId) {
      await updateContentPreferences(userId, { autoplayVideos: val });
    }
  };

  const addMutedWord = async () => {
    const word = newWord.trim().toLowerCase();
    if (!word || mutedWords.includes(word)) {
      setNewWord('');
      return;
    }
    const updated = [...mutedWords, word];
    setMutedWords(updated);
    setNewWord('');
    if (userId) {
      await updateContentPreferences(userId, { mutedWords: updated });
    }
    inputRef.current?.focus();
  };

  const removeMutedWord = async (word: string) => {
    const updated = mutedWords.filter(w => w !== word);
    setMutedWords(updated);
    if (userId) {
      await updateContentPreferences(userId, { mutedWords: updated });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMutedWord();
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
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-background/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                  Content <span className="text-pink-400">Settings</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Control your feed experience</p>
              </div>
              <button
                onClick={onClose}
                className="p-3 bg-card-bg hover:bg-card-hover rounded-full border border-border-theme transition-all group"
              >
                <X size={20} className="text-muted-foreground group-hover:text-foreground group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">

              {/* Autoplay Videos */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Media Controls</label>
                <div className="bg-card-bg/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-2xl transition-colors ${autoplay ? 'bg-pink-500/10 text-pink-500' : 'bg-card-bg text-muted-foreground'}`}>
                        <PlayCircle size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Autoplay Videos</h4>
                        <p className="text-[10px] text-muted-foreground font-medium mt-1">Automatically play videos in feed</p>
                      </div>
                    </div>
                    <button
                      onClick={() => saveAutoplay(!autoplay)}
                      className={`w-14 h-8 rounded-full relative transition-all duration-300 ${autoplay ? 'bg-pink-500' : 'bg-card-bg'}`}
                    >
                      <motion.div
                        animate={{ x: autoplay ? 28 : 4 }}
                        className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Muted Words */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Muted Words</label>
                <div className="bg-card-bg/20 border border-border-theme rounded-[2.5rem] overflow-hidden">
                  
                  {/* Description */}
                  <div className="p-6 border-b border-border-theme flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-card-bg text-muted-foreground">
                      <MicOff size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Muted Words</h4>
                      <p className="text-[10px] text-muted-foreground font-medium mt-1">Posts containing these words will be hidden from your feed</p>
                    </div>
                  </div>

                  {/* Add word input */}
                  <div className="p-6 border-b border-border-theme">
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                        <input
                          ref={inputRef}
                          type="text"
                          value={newWord}
                          onChange={(e) => setNewWord(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Add a word or phrase..."
                          className="w-full pl-9 pr-4 py-3 bg-background border border-border-theme rounded-2xl text-sm text-foreground focus:outline-none focus:border-pink-500/50 transition-all placeholder:text-muted-foreground/40"
                        />
                      </div>
                      <button
                        onClick={addMutedWord}
                        disabled={!newWord.trim()}
                        className="px-4 py-3 bg-pink-500 hover:bg-pink-600 disabled:opacity-40 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-pink-500/20"
                      >
                        <Plus size={16} />
                        Add
                      </button>
                    </div>
                  </div>

                  {/* Word list */}
                  <div className="p-6">
                    {mutedWords.length === 0 ? (
                      <p className="text-center text-[10px] text-muted-foreground/50 font-black uppercase tracking-widest py-4">
                        No muted words yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {mutedWords.map(word => (
                          <motion.div
                            key={word}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-card-bg border border-border-theme rounded-full group"
                          >
                            <span className="text-xs font-bold text-foreground">{word}</span>
                            <button
                              onClick={() => removeMutedWord(word)}
                              className="text-muted-foreground hover:text-red-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                    {mutedWords.length > 0 && (
                      <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-4 text-center">
                        {mutedWords.length} word{mutedWords.length !== 1 ? 's' : ''} muted · Changes save automatically
                      </p>
                    )}
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
