"use client";
import React from 'react';
import { AdminSidebar } from "./components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    // We use w-full because the main Navbar is now hidden via the RootLayout
    <div className="flex min-h-screen w-full bg-[#050505] text-white">
      <AdminSidebar />
      
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-12">
          {children}
        </div>
      </main>
    </div>
  );
}