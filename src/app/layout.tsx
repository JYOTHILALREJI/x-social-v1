"use client";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import "./globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarPaths = ["/", "/auth"]; 
  const isAdminPath = pathname.startsWith("/admin"); 
  const shouldHideNavbar = hideNavbarPaths.includes(pathname) || isAdminPath;

  return (
    <html lang="en">
      <body 
        className="antialiased bg-black text-white overflow-x-hidden min-h-screen"
        suppressHydrationWarning
      >
        {/* Render Navbar only if not on hidden paths  */}
        {!shouldHideNavbar && <Navbar />}

        <div className={shouldHideNavbar ? "w-full min-h-screen" : "min-h-screen md:pl-20 lg:pl-64 flex flex-col w-full"}>
          <AnimatePresence mode="popLayout"> {/* Changed to popLayout to maintain width during transitions */}
            <motion.main
              key={pathname}
              initial={{ opacity: 0 }} // Removed y: 10 to prevent vertical jumping
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="w-full flex-1"
            >
              {/* Ensure this inner div forces full width immediately */}
              <div className="w-full h-full min-w-full">
                {children}
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </body>
    </html>
  );
}