"use client";

import { useEffect, useState } from "react";
import { getAllUsers, deleteUser, updateUserRole } from "@/app/actions/admin-actions";
import { 
  Users, 
  Trash2, 
  Edit3, 
  Search, 
  MoreVertical,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  PlusCircle,
  Eye
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  async function fetchUsers() {
    setLoading(true);
    const res = await getAllUsers(page, 10);
    if (res.success) {
      setUsers(res.users || []);
      setTotal(res.total || 0);
    }
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this user? This action is irreversible.")) {
      setIsDeleting(id);
      const res = await deleteUser(id);
      if (res.success) fetchUsers();
      setIsDeleting(null);
    }
  };

  const handleRoleUpdate = async (id: string, role: string) => {
    const res = await updateUserRole(id, role);
    if (res.success) fetchUsers();
  };

  const filteredUsers = users.filter((user: any) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "USER" });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    // Assuming we have an action for this. For now, let's just log.
    console.log("Add User:", newUser);
    alert("User addition is simulated. Logic can be implemented in admin-actions.ts");
    setIsAddingUser(false);
  };

  return (
    <div className="space-y-8 pb-12 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-950 p-8 rounded-3xl border border-border-theme shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
            <Users size={200} />
        </div>
        <div className="space-y-1 relative z-10">
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-zinc-500 font-medium">Manage existing users, edit roles, and delete accounts.</p>
        </div>
        <div className="flex gap-4 relative z-10">
            <button 
                onClick={() => setIsAddingUser(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-2 hover:shadow-lg shadow-purple-500/20 active:scale-95 transition-all"
            >
                <PlusCircle size={18} />
                Add User
            </button>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors" size={20} />
                <input 
                    type="text" 
                    placeholder="Search users..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-6 py-3.5 bg-black border border-border-theme rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all w-full md:w-64 backdrop-blur-xl"
                />
            </div>
        </div>
      </header>

      {/* Add User Modal */}
      <AnimatePresence>
        {isAddingUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-zinc-950 border border-border-theme rounded-3xl p-10 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <PlusCircle size={150} />
              </div>
              <h2 className="text-3xl font-black mb-1">Create New User</h2>
              <p className="text-zinc-500 mb-8 font-medium">Add a new user manually to the database.</p>
              
              <form onSubmit={handleAddUser} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Username</label>
                  <input 
                    type="text" 
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="john_doe"
                    className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="john@example.com"
                    className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Password</label>
                    <input 
                      type="password" 
                      required
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest ml-1">Initial Role</label>
                    <select 
                      value={newUser.role}
                      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                      className="w-full px-6 py-4 bg-black border border-border-theme rounded-2xl focus:outline-none focus:border-purple-500 transition-all appearance-none"
                    >
                      <option value="USER">User</option>
                      <option value="CREATOR">Creator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingUser(false)}
                    className="flex-1 py-4 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                  >
                    Create Account
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


      {/* Users Table */}
      <div className="bg-zinc-950 border border-border-theme rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-theme text-zinc-500 text-xs font-black uppercase tracking-widest bg-zinc-900/10">
                <th className="py-6 px-8">User Info</th>
                <th className="py-6 px-8">Status / Role</th>
                <th className="py-6 px-8">Wallet Balance</th>
                <th className="py-6 px-8">Joined Date</th>
                <th className="py-6 px-8 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/50">
              <AnimatePresence mode="popLayout">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="p-8">
                        <div className="h-12 bg-zinc-900/50 rounded-2xl" />
                      </td>
                    </tr>
                  ))
                ) : filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    layout
                    className="hover:bg-zinc-900/30 group transition-all duration-300"
                  >
                    <td className="py-6 px-8 flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center font-bold text-lg shadow-xl shadow-purple-500/10">
                          {user.username[0].toUpperCase()}
                        </div>
                        {user.role === "ADMIN" && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-[10px] p-1 rounded-full border-2 border-border-theme shadow-xl">
                                <ShieldCheck size={12} className="text-white" />
                            </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{user.username}</p>
                        <p className="text-sm text-zinc-500 font-mono">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <select 
                        value={user.role} 
                        onChange={(e) => handleRoleUpdate(user.id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border appearance-none text-center focus:outline-none transition-all cursor-pointer
                          ${user.role === "ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/20" : 
                            user.role === "CREATOR" ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" : 
                            "bg-blue-500/10 text-blue-500 border-blue-500/20"}`}
                      >
                        <option value="USER">User</option>
                        <option value="CREATOR">Creator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-6 px-8">
                        <span className="font-mono font-bold text-white">${(user.walletBalance / 100).toFixed(2)}</span>
                    </td>
                    <td className="py-6 px-8 text-sm text-zinc-500">
                        {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/users/${user.id}`} className="p-2.5 bg-zinc-900 rounded-xl text-zinc-500 hover:text-white hover:bg-zinc-800 transition-all border border-border-theme">
                          <Eye size={18} />
                        </Link>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting === user.id}
                          className="p-2.5 bg-red-500/5 rounded-xl text-red-500 hover:text-white hover:bg-red-500 transition-all border border-red-500/20 disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-8 border-t border-border-theme bg-zinc-900/10">
          <p className="text-zinc-500 text-sm font-medium">
            Showing <span className="text-white">{(page - 1) * 10 + 1}</span> to <span className="text-white">{Math.min(page * 10, total)}</span> of <span className="text-white">{total}</span> users
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
              className="p-3 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
