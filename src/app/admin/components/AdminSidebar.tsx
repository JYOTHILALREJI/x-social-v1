"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, ShieldCheck, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { name: 'Overview', icon: LayoutDashboard, href: '/admin' },
  { name: 'Pending Creators', icon: ShieldCheck, href: '/admin/creators' },
  { name: 'User Management', icon: Users, href: '/admin/users' },
  { name: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
];

export const AdminSidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="w-80 border-r border-zinc-900 bg-black p-8 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="mb-12 px-2 text-2xl font-black italic tracking-tighter uppercase">
        X-SOCIAL <span className="text-[10px] bg-purple-600 px-2 py-1 rounded-full not-italic">ADMIN</span>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} className="block">
              <div className="relative px-5 py-4 cursor-pointer group rounded-2xl">
                {isActive && (
                  <motion.div 
                    layoutId="sidebar-accent"
                    className="absolute inset-0 bg-white/5 border border-white/10 rounded-2xl"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className={`relative z-10 flex items-center gap-4 ${isActive ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <item.icon size={20} className={isActive ? "text-purple-400" : ""} />
                  <span className="text-sm font-bold uppercase tracking-widest">{item.name}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};