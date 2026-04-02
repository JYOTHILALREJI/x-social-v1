"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Users, 
  UserRoundCheck, 
  LayoutDashboard, 
  Image as ImageIcon, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  LogOut,
  Palette,
  DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "@/app/lib/store";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/creators", label: "Creators", icon: UserRoundCheck },
  { href: "/admin/content", label: "Content", icon: ImageIcon },
  { href: "/admin/revenue", label: "Revenue Logs", icon: DollarSign },
  { href: "/admin/theme", label: "Theme", icon: Palette },
  { href: "/admin/settings", label: "General Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, setSidebarCollapsed } = useAdminStore();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
      else setSidebarCollapsed(false);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarCollapsed]);

  return (
    <motion.aside
      animate={{ width: isSidebarCollapsed ? "80px" : "280px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="fixed left-0 top-0 h-screen bg-zinc-950 border-r border-border-theme z-50 flex flex-col"
    >
      {/* Header / Logo */}
      <div className="p-6 flex items-center justify-between border-b border-border-theme">
        <AnimatePresence mode="wait">
          {!isSidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-pink-600 rounded-lg flex items-center justify-center font-black text-lg">
                X
              </div>
              <span className="font-bold text-xl tracking-tight">ADMIN PANEL</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-white"
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/admin" && pathname.startsWith(link.href));
          
          return (
            <Link key={link.href} href={link.href}>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${isActive 
                    ? "bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                  }`}
              >
                <Icon size={22} className={`${isActive ? "text-purple-400" : "group-hover:text-purple-400"}`} />
                <AnimatePresence mode="wait">
                  {!isSidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border-theme">
        <Link href="/feed">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-900/50 transition-all duration-300"
          >
            <LogOut size={22} />
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="font-medium whitespace-nowrap"
                >
                  Exit Admin
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </Link>
      </div>
    </motion.aside>
  );
}
