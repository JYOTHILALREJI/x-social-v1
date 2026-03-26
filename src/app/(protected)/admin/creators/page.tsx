"use client";

import { useEffect, useState } from "react";
import { getPendingCreators, approveCreator, rejectCreator } from "@/app/actions/admin-actions";
import { 
  UserRoundCheck, 
  Check, 
  X, 
  ExternalLink, 
  Calendar,
  AlertCircle,
  Filter,
  Eye,
  Camera
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CreatorManagementPage() {
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("PENDING");

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    const res = await getPendingCreators();
    if (res.success) setPending(res.creators || []);
    setLoading(false);
  }

  const handleApprove = async (id: string) => {
    if (confirm("Approve this user as a creator?")) {
      const res = await approveCreator(id);
      if (res.success) fetchPending();
    }
  };

  const handleReject = async (id: string) => {
    if (confirm("Reject this creator application?")) {
      const res = await rejectCreator(id);
      if (res.success) fetchPending();
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-8 rounded-3xl border border-zinc-900 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <UserRoundCheck size={200} />
        </div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            Creator Approvals
          </h1>
          <p className="text-zinc-500 font-medium">Review and verify creator applications to maintain quality.</p>
        </div>
        <div className="flex gap-4 relative z-10">
            <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-black border border-zinc-900 rounded-2xl px-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none font-bold text-sm tracking-wide transition-all"
            >
                <option value="PENDING">PENDING REVIEW</option>
                <option value="APPROVED">ACTIVE CREATORS</option>
                <option value="REJECTED">REJECTED</option>
            </select>
            <button className="p-3.5 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white transition-colors border border-zinc-800">
                <Filter size={20} />
            </button>
        </div>
      </header>

      {/* Pending List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
             Array(4).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse bg-zinc-950 rounded-3xl border border-zinc-900 h-64 shadow-xl" />
             ))
          ) : pending.length === 0 ? (
            <motion.div 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="col-span-full flex flex-col items-center justify-center p-20 bg-zinc-950 rounded-3xl border border-zinc-800 border-dashed text-zinc-500"
            >
               <div className="p-6 rounded-full bg-zinc-900 mb-6">
                <Check size={48} className="text-emerald-500" />
               </div>
               <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
               <p className="text-center max-w-xs">There are no pending creator applications to display at this moment.</p>
            </motion.div>
          ) : pending.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ delay: i * 0.1 }}
              className="bg-zinc-950 rounded-3xl border border-zinc-900 p-8 shadow-xl hover:shadow-2xl hover:border-zinc-800 transition-all duration-500 relative group overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 transform translate-y-10 group-hover:translate-y-0 transition-transform flex flex-col gap-2 opacity-0 group-hover:opacity-100">
                   <button className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white border border-zinc-800 shadow-xl transition-all"><Eye size={20} /></button>
                   <button className="p-3 bg-zinc-900/80 backdrop-blur-md rounded-2xl text-zinc-400 hover:text-white border border-zinc-800 shadow-xl transition-all"><ExternalLink size={20} /></button>
              </div>

              <div className="flex items-start gap-6 relative">
                 <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-blue-500 flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-500/20 group-hover:scale-110 transition-transform duration-500">
                    {item.user.username[0].toUpperCase()}
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white">{item.user.username}</h3>
                    <p className="text-zinc-500 flex items-center gap-2 text-sm font-medium">
                        <AlertCircle size={14} className="text-yellow-500" />
                        Pending verification
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {item.categories?.map((cat: string) => (
                            <span key={cat} className="px-3 py-1 bg-zinc-900 rounded-full text-[10px] font-black uppercase text-zinc-400 border border-zinc-800">{cat}</span>
                        ))}
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-8">
                 <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700 transition-all">
                    <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={12} /> Applied On</p>
                    <p className="font-bold text-sm text-white">{new Date(item.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="p-4 bg-black/40 rounded-2xl border border-zinc-800/50 group-hover:border-zinc-700 transition-all">
                    <p className="text-[10px] uppercase font-black text-zinc-500 tracking-widest mb-1 flex items-center gap-1.5"><Camera size={12} /> ID Proof</p>
                    <p className="font-bold text-sm text-purple-400 cursor-pointer hover:underline">View Document</p>
                 </div>
              </div>

              <div className="flex gap-4 mt-8">
                 <button
                   onClick={() => handleApprove(item.id)}
                   className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition-all duration-300"
                 >
                    <Check size={18} /> Approve
                 </button>
                 <button
                    onClick={() => handleReject(item.id)}
                    className="px-6 py-4 bg-zinc-900 text-red-500 hover:text-white hover:bg-red-600 font-bold rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-95"
                 >
                    <X size={20} />
                 </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
