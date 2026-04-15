"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  Cake, 
  ShieldAlert, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { FcGoogle } from "react-icons/fc";
import { login, register, verifyTwoFactor } from "@/app/lib/actions";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', dob: '' });
  const [ageError, setAgeError] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 2FA State
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [twoFactorQuestion, setTwoFactorQuestion] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  const [twoFactorAnswer, setTwoFactorAnswer] = useState("");

  const router = useRouter();

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleGoogleSignIn = () => {
    setLoading(true);
    // In production, this would trigger a real OAuth redirect
    setTimeout(() => router.push('/feed'), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Age check for Join mode
    if (!isLogin && calculateAge(formData.dob) < 18) {
      setAgeError(true);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("email", formData.email);
      data.append("password", formData.password);

      if (isLogin) {
        const res = await login(data) as any;
        if (res?.requiresTwoFactor) {
          setRequiresTwoFactor(true);
          setTwoFactorQuestion(res.question);
          setTempUserId(res.userId);
          setLoading(false);
          return;
        }
      } else {
        data.append("dob", formData.dob);
        await register(data);
      }
    } catch (err: any) {
      // Next.js redirect() throws with err.digest in Next.js 15+, err.message in older versions
      const isRedirect = err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT');
      if (!isRedirect) {
        alert(err.message || "Authentication failed. Please check your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await verifyTwoFactor(tempUserId, twoFactorAnswer);
    } catch (err: any) {
      const isRedirect = err?.digest?.startsWith('NEXT_REDIRECT') || err?.message?.includes('NEXT_REDIRECT');
      if (!isRedirect) {
        alert(err.message || "Invalid answer.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dark-forced min-h-screen flex items-center justify-center bg-black p-4 selection:bg-purple-500/30 text-white">
      <div className="w-full max-w-md perspective-1000">
        
        {/* TOGGLE PILL */}
        <div className="flex bg-zinc-900/50 backdrop-blur-md p-1 rounded-full mb-8 relative border border-zinc-800">
          <motion.div 
            className="absolute top-1 bottom-1 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            initial={false}
            animate={{ x: isLogin ? '0%' : '100%', width: '50%' }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
          <button 
            onClick={() => {setIsLogin(true); setAgeError(false);}} 
            className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-black z-10 transition-colors duration-300 ${isLogin ? 'text-black' : 'text-zinc-400'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => {setIsLogin(false); setAgeError(false);}} 
            className={`flex-1 py-2.5 text-xs uppercase tracking-widest font-black z-10 transition-colors duration-300 ${!isLogin ? 'text-black' : 'text-zinc-400'}`}
          >
            Join
          </button>
        </div>

        <AnimatePresence mode="wait">
          {ageError ? (
            <motion.div key="restricted" initial={{ rotateY: 180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ rotateY: -180, opacity: 0 }} className="bg-zinc-900 p-10 rounded-[2.5rem] border-2 border-red-500/50 text-center">
               <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="inline-block p-4 bg-red-500/10 rounded-full mb-4">
                 <ShieldAlert className="text-red-500" size={48} />
               </motion.div>
               <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
               <p className="text-zinc-400 text-sm mb-8 leading-relaxed">You must be 18+ to enter X-SOCIAL.</p>
               <button onClick={() => setAgeError(false)} className="w-full py-3 bg-zinc-800 text-white rounded-xl font-bold hover:bg-zinc-700 transition">Try Again</button>
            </motion.div>
          ) : requiresTwoFactor ? (
            <motion.div key="twofactor" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-zinc-900 p-10 rounded-[2.5rem] border border-zinc-800 text-center shadow-2xl relative">
               <h2 className="text-2xl font-black text-white mb-2 uppercase">Security Question</h2>
               <p className="text-zinc-400 text-xs mb-8 font-bold tracking-widest">{twoFactorQuestion}</p>
               <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
                 <input 
                   type="text" placeholder="Your Answer" required
                   className="w-full px-6 py-4 rounded-2xl bg-black border border-zinc-800 focus:border-purple-500 outline-none transition text-sm text-white placeholder:text-zinc-600"
                   value={twoFactorAnswer}
                   onChange={(e) => setTwoFactorAnswer(e.target.value)}
                 />
                 <button 
                   type="submit" disabled={loading} 
                   className="w-full py-4 bg-purple-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center hover:bg-purple-600 transition-all active:scale-95 disabled:opacity-50"
                 >
                   {loading ? "Verifying..." : "Verify Identity"}
                 </button>
               </form>
               <button onClick={() => setRequiresTwoFactor(false)} className="mt-6 text-xs text-zinc-500 uppercase font-black hover:text-white transition">Cancel</button>
            </motion.div>
          ) : (
            <motion.div
              key={isLogin ? "login" : "signup"}
              initial={{ rotateY: isLogin ? -90 : 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: isLogin ? 90 : -90, opacity: 0 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="bg-zinc-900/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-zinc-800 shadow-2xl relative"
            >
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-1 text-white">{isLogin ? "Welcome" : "Get Started"}</h1>
                <p className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold leading-none">The Future of Premium Connection</p>
              </div>

              <button 
                onClick={handleGoogleSignIn} 
                disabled={loading} 
                className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-white/5 border border-zinc-800 rounded-2xl text-sm font-bold text-white hover:bg-white/10 transition-all mb-6 active:scale-95 disabled:opacity-50"
              >
                <FcGoogle size={22} /> Continue with Google
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] flex-1 bg-zinc-800" />
                <span className="text-[10px] uppercase text-zinc-500 font-black">OR</span>
                <div className="h-[1px] flex-1 bg-zinc-800" />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-purple-400 transition" size={18} />
                  <input 
                    type="email" placeholder="Email Address" required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black border border-zinc-800 focus:border-purple-500/50 outline-none transition text-sm text-white placeholder:text-zinc-600"
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-4 text-zinc-600 group-focus-within:text-purple-400 transition" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Password" required
                    className="w-full pl-12 pr-12 py-4 rounded-2xl bg-black border border-zinc-800 focus:border-purple-500/50 outline-none transition text-sm text-white placeholder:text-zinc-600"
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-zinc-600 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {!isLogin && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="relative group">
                    <input 
                      type="date" required
                      className="w-full p-4 rounded-2xl bg-black border border-zinc-800 focus:border-purple-500/50 outline-none transition text-zinc-400 text-sm uppercase [color-scheme:dark]"
                      onChange={(e) => setFormData({...formData, dob: e.target.value})}
                    />
                    <Cake className="absolute right-4 top-4 text-zinc-600 pointer-events-none" size={18} />
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full py-4 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-purple-500 hover:text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-white/10"
                >
                  {loading ? "Processing..." : isLogin ? "Login Now" : "Create Account"} 
                  {!loading && <ChevronRight size={18} />}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;