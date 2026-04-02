"use client";
import React, { useEffect, useState } from "react";
import LandingNavbar from "../components/LandingNavbar";
import { motion } from "framer-motion";
import FloatingElements from "../components/FloatingElements";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Zap, Star, ArrowRight } from "lucide-react";

const LandingPage = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // AUTH REDIRECT LOGIC
  useEffect(() => {
    // Change "token" to "auth_session" to match your middleware
    const isLoggedIn = document.cookie.includes("auth_session"); 
    
    if (isLoggedIn) {
      router.replace("/feed");
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  // Prevent "flash" of landing content while checking auth
  if (isCheckingAuth) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="relative min-h-screen bg-black selection:bg-[var(--primary)] selection:text-white">
      <LandingNavbar />
      <FloatingElements />

      {/* Hero Section */}
      <section className="h-screen flex flex-col items-center justify-center text-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]">
            X-SOCIAL
          </h1>
        </motion.div>
        
        <motion.p 
          {...fadeIn}
          className="text-xl md:text-2xl text-zinc-400 max-w-2xl mb-10"
        >
          The next generation of premium creator-to-fan connection. 
          Unfiltered. Exclusive. Rewarding.
        </motion.p>

        <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
          {/* Changed Link href to /auth since '/' is the landing page itself */}
          <Link href="/auth" className="group relative px-8 py-4 bg-white text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 inline-block">
            <span className="relative z-10 flex items-center gap-2">
              Enter Platform <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </motion.div>
      </section>

      {/* Info Section 1 */}
      <section className="py-32 px-6 max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div {...fadeIn}>
          <div className="text-[var(--primary)] mb-4"><Shield size={48} /></div>
          <h2 className="text-4xl font-bold mb-4 text-white">Total Privacy, Total Control.</h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            Creators decide exactly who sees what. With multi-tiered subscription packages 
            and advanced blurring technology, your content is always protected.
          </p>
        </motion.div>
        <motion.div 
          className="bg-zinc-900 aspect-video rounded-3xl border border-border-theme shadow-2xl overflow-hidden group"
          {...fadeIn}
          transition={{ delay: 0.3 }}
        >
          <div className="w-full h-full bg-gradient-to-tr from-zinc-800 to-zinc-900 flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
            <span className="text-zinc-700 font-bold tracking-widest uppercase opacity-50">Secure_Vault_UI</span>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="py-32 px-6 bg-zinc-950/50 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: <Zap />, title: "Live Streaming", desc: "Interact with fans in real-time with custom tipping and low-latency interaction." },
            { icon: <Star />, title: "Earn Coins", desc: "Monetize every interaction, from private messages to one-on-one video calls." },
            { icon: <Shield />, title: "Verified Identity", desc: "Safe, secure, and 18+ verified environment for creators and fans alike." }
          ].map((item, idx) => (
            <motion.div 
              key={idx}
              {...fadeIn}
              transition={{ delay: idx * 0.1 }}
              className="p-8 rounded-3xl bg-zinc-900/50 backdrop-blur-sm border border-border-theme hover:border-[var(--primary)] transition-all hover:-translate-y-2"
            >
              <div className="text-[var(--accent)] mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-white">{item.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer Call to Action */}
      <section className="py-40 text-center relative z-10">
        <motion.h2 {...fadeIn} className="text-5xl font-bold mb-8 text-white tracking-tight">Ready to start earning?</motion.h2>
        <motion.div {...fadeIn}>
           <Link href="/auth" className="inline-block text-[var(--accent)] border-2 border-[var(--accent)] px-10 py-4 rounded-full font-bold hover:bg-[var(--accent)] hover:text-white transition-all transform hover:scale-110">
            Become a Creator
          </Link>
        </motion.div>
      </section>

      {/* Footer Branding */}
      <footer className="py-10 border-t border-border-theme text-center">
        <p className="text-zinc-600 text-xs tracking-widest uppercase">© 2024 X-SOCIAL - Premium Creators Network</p>
      </footer>
    </div>
  );
};

export default LandingPage;