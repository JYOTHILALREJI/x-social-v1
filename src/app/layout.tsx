"use client";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";
import { AnimatePresence, motion } from "framer-motion";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define paths where the standard navbar and its padding should be hidden
  const hideMainNavbar = pathname.startsWith("/admin") || pathname === "/" || pathname === "/auth";

  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className="antialiased bg-black text-white min-h-screen overflow-x-hidden"
        suppressHydrationWarning
      >
        {/* Only show main Navbar if we are NOT in Admin or Auth paths */}
        {!hideMainNavbar && <Navbar />}

        <div className={
          hideMainNavbar 
            ? "w-full min-h-screen" // Admin gets full width with 0 padding-left
            : "min-h-screen md:pl-[80px] lg:pl-[256px] w-full" // Standard user pages
        }>
          <main className="w-full h-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}