"use client";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "./globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarPaths = ["/", "/auth"]; 
  const shouldHideNavbar = hideNavbarPaths.includes(pathname);

  return (
    <html lang="en">
      <body className="antialiased bg-black text-white overflow-x-hidden">
        {!shouldHideNavbar && <Navbar />}

        {/* md:pl-20 / lg:pl-64: Responsive padding to prevent sidebar overlap on desktop.
            pb-24: Ensures mobile content isn't covered by the bottom navbar.
        */}
        <div className={shouldHideNavbar ? "" : "min-h-screen pb-24 md:pb-0 md:pl-20 lg:pl-64"}>
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {/* REMOVED max-w-2xl here to allow full-screen width */}
              <div className="w-full">
                {children}
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </body>
    </html>
  );
}