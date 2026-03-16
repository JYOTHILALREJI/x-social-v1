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
      {/* suppressHydrationWarning fixes the body attribute mismatch 
          caused by browser extensions (like the one in your error log).
      */}
      <body 
        className="antialiased bg-black text-white overflow-x-hidden"
        suppressHydrationWarning
      >
        {!shouldHideNavbar}

        {/* We use flex and h-screen here to ensure the children (like Messages) 
            can fill the remaining space without creating double scrollbars.
        */}
        <div className={shouldHideNavbar ? "" : "min-h-screen pb-24 md:pb-0 md:pl-20 lg:pl-64 flex flex-col"}>
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full flex-1"
            >
              <div className="w-full h-full">
                {children}
              </div>
            </motion.main>
          </AnimatePresence>
        </div>
      </body>
    </html>
  );
}