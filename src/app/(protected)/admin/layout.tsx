"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminStore } from "@/app/lib/store";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isSidebarCollapsed } = useAdminStore();
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black text-white relative">
      <AdminSidebar />
      <main 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isSidebarCollapsed ? "80px" : "280px" }}
      >
        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
