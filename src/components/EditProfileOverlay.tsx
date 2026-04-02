"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, User, AtSign, FileText, Calendar, Ghost, AlertTriangle, CheckCircle2, Loader2, Trash2
} from 'lucide-react';
import { checkUsernameAvailability, updateUserProfile } from '@/app/actions/user-actions';

interface EditProfileOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    username: string;
    name: string | null;
    bio: string | null;
    image: string | null;
    dob: string | Date;
    role: string;
    isGhost: boolean;
  };
  onUpdate: (updatedUser: any) => void;
}

export default function EditProfileOverlay({ isOpen, onClose, user, onUpdate }: EditProfileOverlayProps) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username,
    bio: user.bio || "",
    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
    image: user.image || "",
    isGhost: user.isGhost
  });

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isCreator = user.role === 'CREATOR';

  // Sync state with props when opening
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: user.name || "",
        username: user.username,
        bio: user.bio || "",
        dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : "",
        image: user.image || "",
        isGhost: user.isGhost
      });
      setFileError(null);
      setUsernameStatus('idle');
    }
  }, [isOpen, user]);

  // Debounced Username Check
  useEffect(() => {
    if (formData.username === user.username) {
      setUsernameStatus('idle');
      return;
    }

    if (formData.username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    const timer = setTimeout(async () => {
      const res = await checkUsernameAvailability(formData.username);
      setUsernameStatus(res.available ? 'available' : 'taken');
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, user.username]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    // 1. Validate File Type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setFileError("Invalid image type. Please select a JPG or PNG only.");
      return;
    }

    // 2. Validate File Size (MAX 2MB)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      setFileError("File too large. Maximum size allowed is 2MB.");
      return;
    }

    // 3. Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus === 'taken') return;
    
    setIsSaving(true);
    const res = await updateUserProfile(user.id, {
      ...formData,
      dob: formData.dob ? new Date(formData.dob) : undefined
    });

    if (res.success) {
      onUpdate(res.user);
      onClose();
    } else {
      alert(res.error || "Failed to update profile.");
    }
    setIsSaving(false);
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
            className="fixed inset-y-0 right-0 w-full max-w-xl bg-zinc-950 border-l border-border-theme z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between border-b border-border-theme bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  Edit <span className="text-purple-500">Profile</span>
                </h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Refine your digital identity</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-border-theme transition-all group"
              >
                <X size={20} className="text-zinc-500 group-hover:text-white group-hover:rotate-90 transition-all duration-300" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
              
              {/* Profile Picture */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Profile Aesthetic</label>
                <div className="flex items-center gap-8 p-6 bg-zinc-900/30 border border-border-theme rounded-[2.5rem]">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    <div className="w-24 h-24 rounded-full bg-zinc-800 border-2 border-border-theme overflow-hidden relative shadow-lg group-hover:border-purple-600 transition-all">
                      {formData.image ? (
                        <img src={formData.image} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          <User size={40} />
                        </div>
                      )}
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera size={20} className="text-white" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/jpg"
                      className="hidden"
                    />
                    
                    <div className="flex flex-col gap-2">
                       <button 
                         type="button"
                         onClick={() => fileInputRef.current?.click()}
                         className="w-full py-3 bg-zinc-900 text-[10px] font-black uppercase rounded-xl border border-border-theme hover:bg-zinc-800 transition-all text-zinc-300 flex items-center justify-center gap-2"
                       >
                         <Camera size={14} className="text-purple-500" />
                         Select Image File
                       </button>
                       {formData.image && (
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, image: ""})}
                           className="w-full py-2 bg-red-500/5 text-red-500/60 border border-red-500/10 rounded-lg hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase flex items-center justify-center gap-2"
                         >
                           <Trash2 size={12} />
                           Remove Current
                         </button>
                       )}
                    </div>

                    {fileError && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2"
                      >
                         <AlertTriangle size={14} className="text-red-500 shrink-0" />
                         <span className="text-[9px] font-bold text-red-400 leading-none">{fileError}</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Identity Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">
                    {isCreator ? "Creator Username" : "Username"}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                      <AtSign size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s+/g, '').toLowerCase()})}
                      className={`w-full pl-12 pr-12 py-4 bg-zinc-900/50 border rounded-2xl text-sm font-bold text-white focus:outline-none transition-all ${
                        usernameStatus === 'taken' ? 'border-red-500' : 
                        usernameStatus === 'available' ? 'border-emerald-500' : 'border-border-theme focus:border-purple-600'
                      }`}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {usernameStatus === 'checking' && <Loader2 size={16} className="animate-spin text-purple-500" />}
                      {usernameStatus === 'taken' && <AlertTriangle size={16} className="text-red-500" />}
                      {usernameStatus === 'available' && <CheckCircle2 size={16} className="text-emerald-500" />}
                    </div>
                  </div>
                  {usernameStatus === 'taken' && (
                    <p className="text-[10px] text-red-500 font-bold ml-1 uppercase tracking-tighter italic">This username is already claimed.</p>
                  )}
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">
                    {isCreator ? "Creator Name" : "Legal Name"}
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                      <User size={16} />
                    </div>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-border-theme rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-purple-600 transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Biography</label>
                <div className="relative">
                  <div className="absolute left-4 top-5 text-zinc-600">
                    <FileText size={16} />
                  </div>
                  <textarea 
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-border-theme rounded-2xl text-sm font-medium text-white focus:outline-none focus:border-purple-600 transition-all no-scrollbar resize-none"
                    placeholder="Tell your story..."
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Birth Date</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                    <Calendar size={16} />
                  </div>
                  <input 
                    type="date" 
                    value={formData.dob}
                    onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-border-theme rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-purple-600 transition-all [color-scheme:dark]"
                  />
                </div>
              </div>

              {/* Ghost Account Option (Only for regular users) */}
              {!isCreator && (
                <div className="space-y-4">
                  <div className="p-8 bg-zinc-900/20 border border-border-theme rounded-[2.5rem] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl transition-all ${formData.isGhost ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30' : 'bg-zinc-800 text-zinc-500'}`}>
                          <Ghost size={20} />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase italic tracking-tighter text-white">Ghost Presence</h4>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Enhanced Privacy Mode</p>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, isGhost: !formData.isGhost})}
                        className={`w-14 h-8 rounded-full relative transition-all duration-300 ${formData.isGhost ? 'bg-purple-600' : 'bg-zinc-800'}`}
                      >
                        <motion.div 
                          animate={{ x: formData.isGhost ? 28 : 4 }}
                          className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-md"
                        />
                      </button>
                    </div>

                    {formData.isGhost && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex gap-3 italic"
                      >
                        <AlertTriangle size={18} className="text-purple-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-purple-300/80 leading-relaxed font-medium">
                          If turned on your account will be invisible to other users, and you can't like or comment on any posts or reels also you will be restricted from following anyone.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Spacer for Submit */}
              <div className="h-24" />
            </form>

            {/* Footer / Action */}
            <div className="p-8 border-t border-border-theme bg-zinc-950/80 backdrop-blur-xl absolute bottom-0 inset-x-0">
               <button 
                 disabled={isSaving || usernameStatus === 'taken'}
                 onClick={handleSubmit}
                 className="w-full py-5 bg-white text-black font-black uppercase italic tracking-widest rounded-2xl hover:bg-purple-600 hover:text-white transition-all shadow-xl shadow-black/20 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
               >
                 {isSaving ? <Loader2 className="animate-spin" size={20} /> : "Update Identity"}
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
