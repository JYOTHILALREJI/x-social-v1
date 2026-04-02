"use client";

import { useEffect, useState } from "react";
import { getAdminStats } from "@/app/actions/admin-actions";
import { 
  Users, 
  UserRoundCheck, 
  Image as ImageIcon, 
  TrendingUp, 
  Clock,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const res = await getAdminStats();
      if (res.success) setStats(res.stats);
      setLoading(false);
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(168,85,247,0.4)]"
      />
    </div>
  );

  const cards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "from-blue-500/20 to-indigo-500/20", border: "border-blue-500/30", text: "text-blue-400" },
    { label: "Total Creators", value: stats?.totalCreators || 0, icon: UserRoundCheck, color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30", text: "text-purple-400" },
    { label: "Total Content", value: stats?.totalContent || 0, icon: ImageIcon, color: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30", text: "text-pink-400" },
    { label: "Revenue", value: `$${stats?.totalRevenue.toFixed(2) || "0.00"}`, icon: TrendingUp, color: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30", text: "text-emerald-400" },
  ];

  return (
    <div className="space-y-8 pb-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Dashboard Overview
        </h1>
        <p className="text-zinc-500">Manage your application and view key metrics at a glance.</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              className={`p-6 rounded-3xl bg-gradient-to-br ${card.color} border ${card.border} backdrop-blur-xl flex items-center justify-between shadow-2xl overflow-hidden relative group`}
            >
              <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon size={120} />
              </div>
              <div className="space-y-1">
                <p className="text-zinc-400 font-medium">{card.label}</p>
                <div className="flex items-baseline gap-2">
                   <h3 className={`text-4xl font-black ${card.text}`}>{card.value}</h3>
                   <span className="text-xs text-zinc-500">+12% this week</span>
                </div>
              </div>
              <div className={`p-4 rounded-2xl bg-black/40 backdrop-blur-md ${card.text}`}>
                <Icon size={24} />
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Users Table */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 p-8 rounded-3xl bg-zinc-950 border border-border-theme shadow-xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="text-purple-500" />
              Recent Users
            </h2>
            <Link href="/admin/users" className="text-purple-400 hover:text-purple-300 text-sm font-semibold flex items-center gap-1 transition-colors">
              View All <ExternalLink size={14} />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-500 border-b border-border-theme">
                  <th className="pb-4 font-semibold uppercase tracking-wider text-xs">User</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-xs">Email</th>
                  <th className="pb-4 font-semibold uppercase tracking-wider text-xs">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/50">
                {stats?.recentUsers.map((user: any, i: number) => (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="hover:bg-zinc-900/30 group transition-all duration-300"
                  >
                    <td className="py-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg">
                        {user.username[0].toUpperCase()}
                      </div>
                      <span className="font-semibold group-hover:text-purple-400 transition-colors">{user.username}</span>
                    </td>
                    <td className="py-5">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide
                        ${user.role === "ADMIN" ? "bg-red-500/10 text-red-400 border border-red-500/20" : 
                          user.role === "CREATOR" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : 
                          "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-5 text-zinc-500 font-mono text-sm">{user.email}</td>
                    <td className="py-5 text-zinc-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions / Activity Feed */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ delay: 0.4 }}
           className="p-8 rounded-3xl bg-zinc-950 border border-border-theme shadow-xl space-y-6"
        >
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="text-emerald-500" />
            Quick Actions
          </h2>
          
          <div className="grid gap-4">
            <Link href="/admin/creators">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-border-theme hover:border-purple-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <p className="font-bold mb-1">Approve Creators</p>
                <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Review pending creator registrations.</p>
              </div>
            </Link>
            <Link href="/admin/content">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-border-theme hover:border-pink-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <p className="font-bold mb-1">Moderate Content</p>
                <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Review and delete reported content.</p>
              </div>
            </Link>
            <Link href="/admin/theme">
              <div className="p-4 rounded-2xl bg-zinc-900/50 border border-border-theme hover:border-indigo-500/50 hover:bg-zinc-900 transition-all duration-300 group">
                <p className="font-bold mb-1">Global Theme</p>
                <p className="text-sm text-zinc-500 group-hover:text-zinc-400">Customize the application aesthetics.</p>
              </div>
            </Link>
          </div>

          <div className="mt-8 pt-8 border-t border-border-theme">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">System Status</h3>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-widest leading-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    All Systems Operational
                </span>
            </div>
            <div className="space-y-4">
                 <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "85%" }}
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600" 
                    />
                 </div>
                 <div className="flex justify-between text-xs text-zinc-500">
                    <span>Server Load</span>
                    <span className="font-bold text-white">85%</span>
                 </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
