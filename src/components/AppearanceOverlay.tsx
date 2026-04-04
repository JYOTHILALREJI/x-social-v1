import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Moon, Sun, Monitor, Palette } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface AppearanceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppearanceOverlay({ isOpen, onClose }: AppearanceOverlayProps) {
  const { theme, setTheme } = useTheme();

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
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-background/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-foreground">
                  Visual <span className="text-muted-foreground">Settings</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Customize your experience</p>
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
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Theme Mode</label>
                <div className="grid grid-cols-3 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all ${theme === 'light' ? 'bg-zinc-100 border-zinc-300 text-black shadow-lg shadow-white/10' : 'bg-card-bg/30 border-border-theme text-muted-foreground hover:bg-card-bg'}`}
                  >
                    <Sun size={24} className={theme === 'light' ? 'text-black' : ''} />
                    <span className="text-xs font-bold uppercase tracking-tight">Light</span>
                  </button>
                  
                  <button 
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all ${theme === 'dark' ? 'bg-zinc-800 border-zinc-600 text-white shadow-lg shadow-black/50' : 'bg-card-bg/30 border-border-theme text-muted-foreground hover:bg-card-bg'}`}
                  >
                    <Moon size={24} className={theme === 'dark' ? 'text-white' : ''} />
                    <span className="text-xs font-bold uppercase tracking-tight">Dark</span>
                  </button>

                  <button 
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-3 p-4 rounded-[2rem] border transition-all ${theme === 'system' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-lg shadow-blue-500/10' : 'bg-card-bg/30 border-border-theme text-muted-foreground hover:bg-card-bg'}`}
                  >
                    <Monitor size={24} className={theme === 'system' ? 'text-blue-400' : ''} />
                    <span className="text-xs font-bold uppercase tracking-tight">System</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Accent Colors</label>
                <div className="p-6 bg-card-bg/30 border border-border-theme rounded-[2.5rem] group hover:bg-card-bg/50 transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-card-bg text-muted-foreground group-hover:text-purple-400 transition-colors">
                        <Palette size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Brand Colors</h4>
                         <p className="text-[10px] text-muted-foreground font-medium mt-1">Change main app color accent</p>
                      </div>
                    </div>
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
