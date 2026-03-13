"use client";
import { motion } from "framer-motion";
import Link from "next/link";

const LandingNavbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-[100] px-6 py-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-md bg-black/20 border border-white/10 rounded-full px-6 py-3">
        {/* Logo */}
        <div className="text-xl font-black tracking-tighter">
          X<span className="text-[var(--primary)]">SOCIAL</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <Link href="#features" className="hover:text-white transition">Features</Link>
          <Link href="#creators" className="hover:text-white transition">Creators</Link>
          <Link href="#safety" className="hover:text-white transition">Safety</Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-sm font-bold hover:text-[var(--primary)] transition">
            Sign In
          </Link>
          <Link href="/auth" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-[var(--primary)] hover:text-white transition-all active:scale-95">
            Join Now
          </Link>
        </div>
      </div>
    </motion.nav>
  );
};

export default LandingNavbar;