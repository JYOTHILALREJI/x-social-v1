"use client";
import React, { useState } from 'react';
import { ShieldCheck, Upload, AlertCircle } from 'lucide-react';

const CreatorOnboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    idType: 'passport',
    baseSubscription: 0,
  });

  const isAdult = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 18;
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-6 text-pink-600">
        <ShieldCheck size={28} />
        <h2 className="text-2xl font-bold">Creator Application</h2>
      </div>

      <form className="space-y-4">
        {/* Step 1: Identity */}
        <div>
          <label className="block text-sm font-medium mb-1">Full Legal Name</label>
          <input 
            type="text" 
            className="w-full p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-pink-500 transition"
            placeholder="As shown on ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date of Birth</label>
          <input 
            type="date" 
            onChange={(e) => setFormData({...formData, dob: e.target.value})}
            className="w-full p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border-none outline-none focus:ring-2 focus:ring-pink-500"
          />
          {formData.dob && !isAdult(formData.dob) && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle size={12} /> You must be 18+ to become a creator.
            </p>
          )}
        </div>

        {/* ID Upload Placeholder */}
        <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-8 text-center hover:border-pink-500 cursor-pointer transition">
          <Upload className="mx-auto mb-2 text-zinc-400" />
          <p className="text-sm font-medium text-zinc-500">Upload Government ID</p>
          <p className="text-xs text-zinc-400 mt-1">Passport, Driver's License, or National ID</p>
        </div>

        <button 
          disabled={!isAdult(formData.dob)}
          type="button"
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-zinc-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95"
        >
          Submit for Verification
        </button>
      </form>
    </div>
  );
};

export default CreatorOnboarding;