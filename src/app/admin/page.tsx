"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Shield, TrendingUp, Users, Zap } from 'lucide-react';

const STATS = [
  { label: 'Pending Requests', value: '12', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { label: 'Active Creators', value: '142', icon: Zap, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { label: 'Total Users', value: '2.4k', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Avg. Revenue', value: '$12k', icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-10">
      <header>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-black italic uppercase tracking-tighter"
        >
          Command <span className="text-purple-500">Center</span>
        </motion.h1>
        <p className="text-zinc-500 font-medium mt-2 uppercase tracking-widest text-xs">Platform performance & management</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS.map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label}
            className="p-8 bg-zinc-950 border border-zinc-900 rounded-[2rem] group hover:border-purple-500/50 transition-all"
          >
            <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-4xl font-black italic uppercase tracking-tighter mb-1">{stat.value}</h3>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10">
        <h2 className="text-xl font-black italic uppercase tracking-tighter mb-8">Recent Activity Stream</h2>
        <div className="space-y-6">
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-black border border-zinc-900/50">
              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
              <p className="text-sm text-zinc-400 font-medium">
                New creator application received from <span className="text-white font-bold italic">@user_{i}99</span>
              </p>
              <span className="ml-auto text-[10px] font-bold text-zinc-600 uppercase">2m ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}