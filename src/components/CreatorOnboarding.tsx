"use client";
import React, { useState, useRef } from 'react';
import { ShieldCheck, Upload, X, CheckCircle, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { submitCreatorApplication } from '@/app/lib/creatorActions';

interface CreatorOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

const CONTENT_CATEGORIES = ["Lingerie", "Nudity", "BDSM", "Cosplay", "Fitness", "Foot Fetish", "ASMR", "Artistic"];

export default function CreatorOnboarding({ isOpen, onClose }: CreatorOnboardingProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [files, setFiles] = useState<{ id: File | null; selfie: File | null }>({ id: null, selfie: null });

  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'selfie') => {
    const file = e.target.files?.[0];
    if (file && file.size < 2 * 1024 * 1024) {
      setFiles(prev => ({ ...prev, [type]: file }));
    } else if (file) {
      alert("File must be under 2MB");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    selectedCategories.forEach(cat => formData.append("categories", cat));
    if (files.id) formData.append("idFile", files.id);
    if (files.selfie) formData.append("selfieFile", files.selfie);

    const result = await submitCreatorApplication(formData);
    
    setLoading(false);
    if (result?.success) setStep(2);
    else alert(result?.error || "Submission failed");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-xl rounded-[2.5rem] p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-zinc-500 hover:text-white"><X size={24} /></button>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Creator Access</h2>
              <p className="text-zinc-500 text-sm mt-2">Submit your details for verification.</p>
            </div>

            <input type="file" ref={idInputRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'id')} />
            <input type="file" ref={selfieInputRef} className="hidden" accept=".jpg,.jpeg,.png" onChange={(e) => handleFileChange(e, 'selfie')} />

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-3">Content Types</label>
                <div className="grid grid-cols-2 gap-2">
                  {CONTENT_CATEGORIES.map((cat) => (
                    <button
                      key={cat} type="button"
                      onClick={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                      className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${selectedCategories.includes(cat) ? "bg-purple-500 border-purple-400 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div onClick={() => idInputRef.current?.click()} className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer aspect-video flex flex-col items-center justify-center transition-all ${files.id ? 'border-purple-500 bg-purple-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
                  <Upload className={files.id ? "text-purple-500" : "text-zinc-500"} size={20} />
                  <span className="text-[10px] text-zinc-400 mt-2 uppercase font-bold text-center">{files.id ? files.id.name : "Upload ID"}</span>
                </div>

                <div onClick={() => selfieInputRef.current?.click()} className={`p-4 rounded-2xl border-2 border-dashed cursor-pointer aspect-video flex flex-col items-center justify-center transition-all ${files.selfie ? 'border-purple-500 bg-purple-500/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'}`}>
                  <Camera className={files.selfie ? "text-purple-500" : "text-zinc-500"} size={20} />
                  <span className="text-[10px] text-zinc-400 mt-2 uppercase font-bold text-center">{files.selfie ? files.selfie.name : "Verification Photo"}</span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || selectedCategories.length === 0 || !files.id || !files.selfie}
              className="w-full py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-purple-500 hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </form>
        ) : (
          <div className="text-center py-10">
            <CheckCircle className="text-green-500 mx-auto mb-6" size={60} />
            <h2 className="text-2xl font-black uppercase text-white mb-2">Application Sent</h2>
            <p className="text-zinc-500 text-sm mb-8">We will verify your profile within 24 hours.</p>
            <button onClick={onClose} className="w-full py-4 bg-zinc-900 text-white font-bold rounded-2xl">Return to Profile</button>
          </div>
        )}
      </div>
    </div>
  );
}