"use client";

import { useEffect, useState, use } from "react";
import { getUserDetail, updateUserInfo, updateUserWallet, deleteUser } from "@/app/actions/admin-actions";
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Wallet, 
  TrendingUp, 
  DollarSign,
  History, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Plus, 
  Minus,
  ArrowLeft,
  CheckCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  Settings,
  Sparkles,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const userId = resolvedParams.id;
  const router = useRouter();

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ username: "", email: "", role: "" });
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [updating, setUpdating] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    amount: number;
    type: 'ADD' | 'DEDUCT';
  }>({ show: false, amount: 0, type: 'ADD' });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  async function fetchUser() {
    setLoading(true);
    const res = await getUserDetail(userId);
    if (res.success && res.user) {
      setUserData(res.user);
      setEditForm({ 
        username: res.user.username || "", 
        email: res.user.email || "", 
        role: res.user.role || "USER"
      });
    }
    setLoading(false);
  }

  const handleUpdateInfo = async () => {
    setUpdating(true);
    const res = await updateUserInfo(userId, editForm);
    if (res.success) {
      setIsEditing(false);
      fetchUser();
    }
    setUpdating(false);
  };

  const handleWalletUpdate = async () => {
    const { amount, type } = confirmModal;
    if (amount === 0) return;
    
    setUpdating(true);
    const adjustment = type === 'ADD' ? amount : -amount;
    const res = await updateUserWallet(userId, adjustment * 100); // converting to cents
    
    if (res.success && res.user) {
      setUserData((prev: any) => ({
        ...prev,
        walletBalance: res.user.walletBalance
      }));
      setWalletAmount(0);
      setConfirmModal({ ...confirmModal, show: false });
    }
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (confirm("Are you sure? This delete is permanent.")) {
      const res = await deleteUser(userId);
      if (res.success) router.push("/admin/users");
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!userData) return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
          <h1 className="text-4xl font-black opacity-20 italic underline decoration-purple-600">User Not Found</h1>
          <Link href="/admin/users" className="text-purple-400 font-bold hover:underline">Back to Users</Link>
      </div>
  );

  return (
    <div className="space-y-10 pb-20">
      {/* Header / Nav */}
      <Link href="/admin/users" className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all w-fit">
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold text-xs uppercase tracking-widest">Back to Directory</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 bg-zinc-950 border border-zinc-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-purple-500">
                <User size={200} />
            </div>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center font-black text-5xl shadow-2xl shadow-purple-500/20 group-hover:scale-105 transition-transform duration-500">
                    {userData.username[0].toUpperCase()}
                </div>
                
                <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">{userData.username}</h2>
                    <p className="text-zinc-500 font-mono text-xs">{userData.email}</p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
                        ${userData.role === 'ADMIN' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                          userData.role === 'CREATOR' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                          'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                        {userData.role}
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 text-[10px] font-black uppercase tracking-widest">
                        ID: {userData.id.substring(0, 8)}...
                    </span>
                </div>
            </div>

            <div className="mt-10 pt-10 border-t border-zinc-900 space-y-6">
                <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[10px] font-black uppercase tracking-widest">User Balance</span>
                    <div className="flex items-center gap-1.5 text-white font-black text-xl">
                        <Wallet size={16} className="text-emerald-500" />
                        ${(userData.walletBalance / 100).toFixed(2)}
                    </div>
                </div>
                {userData.role === 'CREATOR' && (
                    <div className="flex items-center justify-between text-zinc-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Commission (20%)</span>
                        <div className="flex items-center gap-1.5 text-purple-400 font-black text-xl">
                            <Sparkles size={16} className="text-purple-500" />
                            ${((userData.platformCharge || 0) / 100).toFixed(2)}
                        </div>
                    </div>
                )}
            </div>
          </motion.div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Followers</p>
                <p className="text-2xl font-black">{userData.followersCount || 0}</p>
             </div>
             <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Subscribers</p>
                <p className="text-2xl font-black">{userData.subscribersCount || 0}</p>
             </div>
             <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Following</p>
                <p className="text-2xl font-black">{userData.followingCount || 0}</p>
             </div>
             <div className="p-6 bg-zinc-900/30 border border-zinc-900 rounded-3xl text-center">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">Content</p>
                <p className="text-2xl font-black">{(userData._count.posts || 0) + (userData._count.reels || 0)}</p>
             </div>
          </div>
        </div>

        {/* Right Column: Editing & Activity */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Action Center Tabs */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-10 shadow-2xl">
             <div className="flex items-center justify-between mb-10">
                <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                   <Settings size={22} className="text-purple-500" />
                   Admin Control Center
                </h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        className={`p-3 rounded-2xl border transition-all ${isEditing ? 'bg-purple-600 border-purple-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
                    >
                        {isEditing ? <X size={20} /> : <Edit2 size={20} />}
                    </button>
                    <button 
                        onClick={handleDelete}
                        className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
             </div>

             <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Username Override</label>
                                <input 
                                    type="text" 
                                    value={editForm.username}
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                    className="w-full px-6 py-4 bg-black border border-zinc-800 rounded-2xl focus:outline-none focus:border-purple-500 transition-all font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Account Email</label>
                                <input 
                                    type="email" 
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                    className="w-full px-6 py-4 bg-black border border-zinc-800 rounded-2xl focus:outline-none focus:border-purple-500 transition-all font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Global Permissions / Role</label>
                            <select 
                                value={editForm.role}
                                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                className="w-full px-6 py-4 bg-black border border-zinc-800 rounded-2xl focus:outline-none focus:border-purple-500 transition-all font-bold appearance-none"
                            >
                                <option value="USER">Standard User</option>
                                <option value="CREATOR">Verified Creator</option>
                                <option value="ADMIN">System Administrator</option>
                            </select>
                        </div>
                        <button 
                            onClick={handleUpdateInfo}
                            disabled={updating}
                            className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                        >
                            {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                            Commit Changes to Database
                        </button>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="view"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-10"
                    >
                        {/* Wallet Management Area */}
                        <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-3xl space-y-6">
                            <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <Wallet size={16} className="text-emerald-500" />
                                Balance Adjustment
                            </h4>
                            <div className="flex gap-4">
                                <input 
                                    type="number" 
                                    value={walletAmount} 
                                    onChange={(e) => setWalletAmount(Number(e.target.value))}
                                    placeholder="Enter amount..."
                                    className="flex-1 bg-black border border-zinc-800 px-6 py-4 rounded-2xl focus:outline-none focus:border-emerald-500 transition-all font-black"
                                />
                            </div>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setConfirmModal({ show: true, amount: walletAmount, type: 'ADD' })}
                                    disabled={updating || walletAmount <= 0}
                                    className="flex-1 py-4 bg-emerald-600/10 border border-emerald-500/30 text-emerald-500 font-bold rounded-2xl hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} /> Add
                                </button>
                                <button 
                                    onClick={() => setConfirmModal({ show: true, amount: walletAmount, type: 'DEDUCT' })}
                                    disabled={updating || walletAmount <= 0}
                                    className="flex-1 py-4 bg-red-600/10 border border-red-500/30 text-red-500 font-bold rounded-2xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 text-sm"
                                >
                                    <Minus size={18} /> Deduct
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity Mini-List */}
                        <div className="space-y-6">
                            <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
                                <TrendingUp size={16} className="text-blue-500" />
                                Account Pulse
                            </h4>
                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl bg-black border border-zinc-900 flex items-center justify-between group hover:border-zinc-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                        <p className="text-sm font-bold">Posts Published</p>
                                    </div>
                                    <span className="text-zinc-500 font-mono text-xs font-bold">{userData._count.posts}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-black border border-zinc-900 flex items-center justify-between group hover:border-zinc-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <p className="text-sm font-bold">Reels Created</p>
                                    </div>
                                    <span className="text-zinc-500 font-mono text-xs font-bold">{userData._count.reels}</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-black border border-zinc-900 flex items-center justify-between group hover:border-zinc-800 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <p className="text-sm font-bold">Transactions</p>
                                    </div>
                                    <span className="text-zinc-500 font-mono text-xs font-bold">{userData.revenues.length}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
             </AnimatePresence>
          </div>

          {/* Activity Stream Section */}
          <div className="space-y-6">
             <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                <History size={22} className="text-blue-500" />
                Live User Activity Feed
             </h3>

             <div className="space-y-4">
                {userData.purchases.length === 0 && userData.posts.length === 0 && (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[2.5rem] text-zinc-600 bg-zinc-950/20">
                        <Clock size={48} className="mb-4 opacity-20" />
                        <p className="font-bold tracking-widest uppercase text-xs">No Recent Activity Detected</p>
                    </div>
                )}

                {/* Combined Activity Feed */}
                <div className="grid gap-4">
                    {userData.posts.map((post: any) => (
                        <div key={post.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between group hover:border-purple-500/30 transition-all shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                    <ImageIcon size={24} />
                                </div>
                                <div>
                                    <p className="font-bold flex items-center gap-2">
                                        Published a new post
                                        {post.isPremium && <span className="text-[10px] px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full border border-yellow-500/20">Premium</span>}
                                    </p>
                                    <p className="text-xs text-zinc-500 lowercase mt-0.5 line-clamp-1 italic opacity-70">
                                        "{post.caption || 'No caption'}"
                                    </p>
                                </div>
                            </div>
                            <div className="text-right flex items-center gap-4">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-tighter">{new Date(post.createdAt).toLocaleDateString()}</p>
                                <ChevronRight className="text-zinc-800 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" size={20} />
                            </div>
                        </div>
                    ))}

                    {userData.purchases.map((purchase: any) => (
                        <div key={purchase.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <p className="font-bold">UNLOCKED: {purchase.post ? 'POST' : 'REEL'}</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1 flex items-center gap-1.5">
                                        Transferred from wallet <ChevronRight size={10} /> {purchase.id.substring(0,6)}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-tighter">{new Date(purchase.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="pt-20 border-t border-zinc-900 space-y-20">
         {userData.revenues?.length > 0 && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <TrendingUp size={28} className="text-emerald-500" />
                        Revenue Stream (Earnings)
                    </h3>
                    <span className="text-[10px] font-black uppercase text-zinc-500 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                        Total Records: {userData.revenues.length}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.revenues.map((rev: any) => (
                        <div key={rev.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                                    +
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        Received from 
                                        {rev.sender ? (
                                            <Link 
                                                href={`/admin/users/${rev.sender.id}`}
                                                className="text-emerald-400 hover:text-emerald-300 underline decoration-emerald-500/30 underline-offset-4 decoration-2 transition-colors italic"
                                            >
                                                {rev.sender.username}
                                            </Link>
                                        ) : (
                                            <span className="text-zinc-500 italic">System</span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{rev.type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-emerald-500 italic">${(rev.amount / 100).toFixed(2)}</p>
                                <p className="text-xs text-zinc-600 font-mono tracking-tighter mt-1 opacity-70">{new Date(rev.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         )}

         {/* Spendings section */}
         {userData.spendings?.length > 0 && (
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <DollarSign size={28} className="text-rose-500" />
                        Spending History (Outgoing)
                    </h3>
                    <span className="text-[10px] font-black uppercase text-zinc-500 bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                        Total Records: {userData.spendings.length}
                    </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.spendings.map((spend: any) => (
                        <div key={spend.id} className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl flex items-center justify-between group hover:border-rose-500/30 transition-all shadow-xl">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 font-black text-xs">
                                    -
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white flex items-center gap-2">
                                        Paid to 
                                        {spend.creator ? (
                                            <Link 
                                                href={`/admin/users/${spend.creator.id}`}
                                                className="text-rose-400 hover:text-rose-300 underline decoration-rose-500/30 underline-offset-4 decoration-2 transition-colors italic"
                                            >
                                                {spend.creator.username}
                                            </Link>
                                        ) : (
                                            <span className="text-zinc-500 italic">User</span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{spend.type.replace('_', ' ')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black text-rose-500 italic">-${(spend.amount / 100).toFixed(2)}</p>
                                <p className="text-xs text-zinc-600 font-mono tracking-tighter mt-1 opacity-70">{new Date(spend.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         )}
      </div>
      {/* Wallet Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.show && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-zinc-950 border border-zinc-900 rounded-[3rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 text-emerald-500">
                        <Wallet size={120} />
                    </div>

                    <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Confirm Adjustment</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-10">Verification required for financial changes.</p>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-6 bg-zinc-900/50 rounded-3xl border border-zinc-900">
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter mb-1">Current Balance</p>
                                <p className="text-2xl font-black text-white">${(userData.walletBalance / 100).toFixed(2)}</p>
                            </div>
                            <ChevronRight className="text-zinc-800" />
                            <div className="text-right">
                                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-tighter mb-1">New Balance</p>
                                <p className={`text-2xl font-black ${confirmModal.type === 'ADD' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    ${((userData.walletBalance + (confirmModal.type === 'ADD' ? confirmModal.amount : -confirmModal.amount) * 100) / 100).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                             <p className="text-[10px] font-bold text-center text-zinc-400">
                                You are {confirmModal.type === 'ADD' ? 'adding' : 'deducting'} <span className="text-white font-black">${confirmModal.amount.toFixed(2)}</span> {confirmModal.type === 'ADD' ? 'to' : 'from'} this user's wallet.
                             </p>
                        </div>

                        <div className="flex gap-4">
                             <button 
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="flex-1 py-4 bg-zinc-900 text-zinc-400 font-bold rounded-2xl hover:bg-zinc-800 hover:text-white transition-all shadow-lg"
                             >
                                Cancel
                             </button>
                             <button 
                                onClick={handleWalletUpdate}
                                disabled={updating}
                                className={`flex-[2] py-4 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2
                                    ${confirmModal.type === 'ADD' ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-red-600 text-white shadow-red-600/20'}`}
                             >
                                {updating ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={18} />}
                                Confirm & Update
                             </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
}
