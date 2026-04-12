"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { SocketProvider } from "@/hooks/useSocket";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define paths where the standard navbar and its padding should be hidden
  const hideMainNavbar = pathname.startsWith("/admin") || pathname === "/" || pathname === "/auth";

  return (
    <SocketProvider>
      {/* Only show main Navbar if we are NOT in Admin or Auth paths */}
      {!hideMainNavbar && <Navbar />}

      <div 
        onContextMenu={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('.no-right-click')) {
            e.preventDefault();
          }
        }}
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target.tagName === 'IMG' || target.tagName === 'VIDEO') {
            e.preventDefault();
          }
        }}
        className={
          hideMainNavbar 
            ? "w-full min-h-[100dvh]" // Admin gets full width with 0 padding-left
            : "min-h-[100dvh] md:pl-[80px] lg:pl-[256px] w-full" // Standard user pages
        }
      >
        <main className="w-full h-full pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
          {children}
        </main>
      </div>
    </SocketProvider>
  );
}
