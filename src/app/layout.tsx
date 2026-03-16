"use client";
import { usePathname } from "next/navigation";
import "./globals.css";
import Navbar from "../components/Navbar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNavbarPaths = ["/", "/auth"]; 
  const shouldHideNavbar = hideNavbarPaths.includes(pathname);

  /**
   * FLUSH LAYOUT CALCULATION:
   * Left: Matches Navbar Width exactly (no extra gap)
   * md: 80px
   * lg: 256px
   * Right: 0px
   */

  return (
    <html lang="en">
      <body className="antialiased bg-black text-white min-h-screen overflow-x-hidden">
        {!shouldHideNavbar && <Navbar />}

        <div className={shouldHideNavbar 
          ? "w-full" 
          : "min-h-screen md:pl-[80px] lg:pl-[256px] w-full"
        }>
          <main className="w-full">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}