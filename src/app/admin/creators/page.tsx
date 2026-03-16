"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, ExternalLink, Shield } from 'lucide-react';

export default function PendingCreators() {
  // This would be fetched from: prisma.creatorProfile.findMany({ where: { status: 'PENDING' } }) 
  const mockApplications = [
    {
      id: "1",
      user: { username: "scarlett_rose", email: "scarlett@example.com" },
      categories: ["Lingerie", "Nudity"],
      idProofUrl: "/mock-id.jpg",
      selfieUrl: "/mock-selfie.jpg",
      createdAt: "2024-03-20"
    }
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Creator Applications</h1>
        <p className="text-zinc-500 mt-2">Verify identity and age for creator access requests.</p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {mockApplications.map((app, index) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            key={app.id}
            className="bg-zinc-950 border border-zinc-800 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 items-center"
          >
            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center font-black">
                  {app.user.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase tracking-tighter">{app.user.username}</h3>
                  <p className="text-zinc-500 text-xs font-bold">{app.user.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {app.categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-zinc-900 border border-zinc-800 text-[10px] font-bold uppercase rounded-lg text-zinc-400">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Document Previews */}
            <div className="flex gap-4">
              <div className="group relative w-40 aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity cursor-pointer">
                  <ExternalLink className="text-white" size={20} />
                </div>
                <div className="p-2 text-[8px] font-black uppercase text-zinc-600 absolute top-0">Gov ID</div>
              </div>
              <div className="group relative w-40 aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity cursor-pointer">
                  <ExternalLink className="text-white" size={20} />
                </div>
                <div className="p-2 text-[8px] font-black uppercase text-zinc-600 absolute top-0">Selfie</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="p-4 bg-zinc-900 hover:bg-red-500/20 text-zinc-500 hover:text-red-500 border border-zinc-800 hover:border-red-500/50 rounded-2xl transition-all">
                <X size={24} />
              </button>
              <button className="px-8 py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2">
                <Check size={20} /> Approve
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}