"use client";

import { useEffect, useState } from "react";
import { getTransactionLogs } from "@/app/actions/admin-actions";
import { 
  DollarSign, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronLeft, 
  ChevronRight,
  User,
  CreditCard,
  History,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function AdminRevenuePage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, [page]);

  async function fetchLogs() {
    setLoading(true);
    const res = await getTransactionLogs(page, 15);
    if (res.success) {
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    }
    setLoading(false);
  }

  const filteredLogs = logs.filter((log: any) => {
    const matchesSearch = 
      log.creator?.username?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.sender?.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === "ALL") return matchesSearch;
    return matchesSearch && log.type === filterType;
  });

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-10 rounded-[2.5rem] border border-zinc-900 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-emerald-500">
            <DollarSign size={200} />
        </div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent italic uppercase">
            Revenue Intelligence
          </h1>
          <p className="text-zinc-500 font-medium tracking-wide">Monitor every single penny flowing through the platform.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full md:w-auto">
            <div className="relative group flex-1 sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search users or creators..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-4 bg-black border border-zinc-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all w-full backdrop-blur-xl font-bold text-xs"
                />
            </div>
            <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
                {["ALL", "SUBSCRIPTION", "POST_PURCHASE", "TIP"].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        {type === "ALL" ? "All" : type.split('_')[0]}
                    </button>
                ))}
            </div>
        </div>
      </header>

      {/* Transaction Table */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-zinc-900/20">
                <th className="py-8 px-10">Sender (User)</th>
                <th className="py-8 px-10">Receiver (Creator)</th>
                <th className="py-8 px-10">Type & Reference</th>
                <th className="py-8 px-10 text-center">Amount</th>
                <th className="py-8 px-10">Timestamp</th>
                <th className="py-8 px-10 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="p-10">
                        <div className="h-12 bg-zinc-900/50 rounded-2xl" />
                      </td>
                    </tr>
                  ))
                ) : filteredLogs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="hover:bg-zinc-900/30 group transition-all duration-300"
                  >
                    <td className="py-8 px-10">
                      <Link href={`/admin/users/${log.senderId}`} className="flex items-center gap-3 group/link">
                         <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xs text-zinc-400 group-hover/link:text-emerald-400 group-hover/link:border-emerald-500/30 transition-all">
                            {log.sender?.username[0].toUpperCase() || "?"}
                         </div>
                         <span className="font-black text-sm group-hover/link:text-emerald-400 transition-all">{log.sender?.username || "System/Unknown"}</span>
                      </Link>
                    </td>
                    <td className="py-8 px-10">
                      <Link href={`/admin/users/${log.creatorId}`} className="flex items-center gap-3 group/link">
                         <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-black text-xs text-zinc-400 group-hover/link:text-purple-400 group-hover/link:border-purple-500/30 transition-all">
                            {log.creator?.username[0].toUpperCase() || "?"}
                         </div>
                         <span className="font-black text-sm group-hover/link:text-purple-400 transition-all">{log.creator?.username}</span>
                      </Link>
                    </td>
                    <td className="py-8 px-10">
                      <div className="space-y-1">
                        <span className={`text-[9px] font-black uppercase p-1.5 rounded-lg border
                            ${log.type === 'SUBSCRIPTION' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' : 
                              log.type === 'TIP' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                            {log.type}
                        </span>
                        <p className="text-[10px] text-zinc-600 font-mono italic">#{log.id.substring(0, 8)}</p>
                      </div>
                    </td>
                    <td className="py-8 px-10 text-center">
                        <span className="font-black text-lg text-white">${(log.amount / 100).toFixed(2)}</span>
                    </td>
                    <td className="py-8 px-10">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-zinc-300">{new Date(log.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-tighter">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                    </td>
                    <td className="py-8 px-10 text-right">
                        <button className="p-3 bg-zinc-900 rounded-2xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-zinc-800 hover:border-emerald-500/30">
                            <ExternalLink size={16} />
                        </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-10 border-t border-zinc-900 bg-zinc-900/10">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">
            Audit <span className="text-white">{(page - 1) * 15 + 1} - {Math.min(page * 15, total)}</span> of {total}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-4 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white hover:bg-emerald-600 disabled:opacity-20 transition-all shadow-xl"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * 15 >= total}
              className="p-4 bg-zinc-900 rounded-2xl text-zinc-400 hover:text-white hover:bg-emerald-600 disabled:opacity-20 transition-all shadow-xl"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
