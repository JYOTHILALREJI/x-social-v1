"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MoreVertical, Edit, CheckCheck, Send, 
  Paperclip, Smile, Mic, Video, Camera, Info, 
  Check, X, Loader2, ArrowLeft, Lock, Wallet, Plus
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToCreator } from '@/app/actions/user-actions';
import { Sparkles, Crown, Star, Heart } from 'lucide-react';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';
import { 
  getMessages, sendMessage, respondToRequest, 
  getConversations, getMessageRequests, getConversationAccess, markChatAsRead 
} from '@/app/actions/message-actions';
import { formatDistanceToNow } from 'date-fns';

interface MessagesClientProps {
  currentUser: any;
  initialConversations: any[];
  initialRequests: any[];
}

const MessagesClient = ({ currentUser, initialConversations, initialRequests }: MessagesClientProps) => {
  const [conversations, setConversations] = useState(initialConversations);
  const [requests, setRequests] = useState(initialRequests);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'requests'>('chats');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userAccess, setUserAccess] = useState<any>({ tier: 0, recipientRole: "USER", messagesSent: 0, creatorProfile: null });
  const [subscribing, setSubscribing] = useState(false);
  const [pendingSub, setPendingSub] = useState<any>(null);
  const [showSubPlans, setShowSubPlans] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling for new messages and conversations
  useEffect(() => {
    const interval = setInterval(async () => {
      // Refresh current chat messages if any
      if (selectedChat) {
        const res = await getMessages(selectedChat.id);
        if (res.success && res.messages) setMessages(res.messages);
      }
      
      // Refresh lists
      const convRes = await getConversations(currentUser.id);
      if (convRes.success && convRes.conversations) setConversations(convRes.conversations);
      
      if (currentUser.role === 'CREATOR') {
        const reqRes = await getMessageRequests(currentUser.id);
        if (reqRes.success && reqRes.requests) setRequests(reqRes.requests);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedChat, currentUser.id, currentUser.role]);

  const handleSelectChat = async (chat: any) => {
    setSelectedChat(chat);
    setLoadingMessages(true);

    // Optimistically mark this chat as read in the sidebar
    setConversations(prev => prev.map(c => {
        if (c.id === chat.id && c.messages && c.messages.length > 0) {
            return { ...c, messages: [{ ...c.messages[0], isRead: true }] };
        }
        return c;
    }));

    const [msgRes, accessRes] = await Promise.all([
      getMessages(chat.id),
      getConversationAccess(chat.id, currentUser.id),
      markChatAsRead(chat.id, currentUser.id)
    ]);
    
    if (msgRes.success && msgRes.messages) setMessages(msgRes.messages);
    if (accessRes) setUserAccess(accessRes);
    setLoadingMessages(false);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sending) return;

    setSending(true);
    const res = await sendMessage(selectedChat.id, currentUser.id, { text: newMessage, type: "TEXT" });
    if (res.success) {
      setNewMessage("");
      // Optimistic update or wait for poll
      setMessages(prev => [...prev, res.message]);
      // Need to re-check access if it was the 6th message
      const accessRes = await getConversationAccess(selectedChat.id, currentUser.id);
      if (accessRes) setUserAccess(accessRes);

    } else {
      alert(res.error || "Failed to send message: " + (res.error ? res.error : "Unknown error"));
    }
    setSending(false);
  };

  const handleSubscribe = async (tier: 1 | 2 | 3, amount: number) => {
      if (currentUser.isGhost) return;
      if (!currentUser.walletBalance || currentUser.walletBalance < amount) {
          alert("Insufficient wallet balance. Please top up your wallet.");
          return;
      }

      setSubscribing(true);
      const res = await subscribeToCreator(currentUser.id, getOtherUser(selectedChat).id, tier, amount);
      if (res.success) {
          // Update local access
          const accessRes = await getConversationAccess(selectedChat.id, currentUser.id);
          if (accessRes) setUserAccess(accessRes);
          setPendingSub(null);
      } else {
          alert(res.error || "Failed to subscribe.");
      }
      setSubscribing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    const res = await respondToRequest(requestId, "ACCEPTED");
    if (res.success) {
      // Move from requests to conversations
      const accepted = requests.find(r => r.id === requestId);
      if (accepted) {
        setRequests(prev => prev.filter(r => r.id !== requestId));
        // Force refresh conversations list
        const convRes = await getConversations(currentUser.id);
        if (convRes.success && convRes.conversations) setConversations(convRes.conversations);
      }
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    const res = await respondToRequest(requestId, "REJECTED");
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const getOtherUser = (chat: any) => {
    return chat.user1Id === currentUser.id ? chat.user2 : chat.user1;
  };

  const filteredConversations = conversations.filter(c => {
    const other = getOtherUser(c);
    return other.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (other.name && other.name.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  return (
    <div className="w-full h-[calc(100vh-6rem)] md:h-screen bg-black text-white flex overflow-hidden">
      
      {/* 1. LEFT SIDEBAR: Chat List */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] border-r border-border-theme flex-col bg-black relative z-10`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">Messages</h1>
            <div className="flex items-center gap-2">
               {currentUser.role === 'CREATOR' && (
                 <button 
                   onClick={() => setSidebarTab(sidebarTab === 'chats' ? 'requests' : 'chats')}
                   className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'requests' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-900 text-zinc-500 border border-border-theme'}`}
                 >
                   Requests {requests.length > 0 && <span className="ml-1 bg-white text-purple-600 px-1 rounded-full">{requests.length}</span>}
                 </button>
               )}
               <Edit size={18} className="text-zinc-500 hover:text-white cursor-pointer ml-2" />
            </div>
          </div>

          <div className="relative group mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full bg-zinc-900/30 border border-border-theme rounded-2xl py-3 pl-10 pr-4 text-xs focus:outline-none focus:border-zinc-500 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
          {sidebarTab === 'chats' ? (
            filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const other = getOtherUser(chat);
                const lastMsg = chat.messages[0];
                return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={chat.id} 
                    onClick={() => handleSelectChat(chat)}
                    className={`px-6 py-5 flex items-center gap-4 cursor-pointer transition-all border-b border-border-theme/50 last:border-0 group ${selectedChat?.id === chat.id ? 'bg-zinc-900/80 border-l-4 border-l-purple-500' : (lastMsg?.senderId !== currentUser.id && lastMsg?.isRead === false) ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'hover:bg-zinc-900/30'}`}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-zinc-900 border border-border-theme flex items-center justify-center font-black text-zinc-600 text-lg overflow-hidden shrink-0">
                        {other.image ? <Image src={other.image} alt={other.username} fill className="object-cover" /> : other.username[0].toUpperCase()}
                      </div>
                      {other.isActivityStatusEnabled && (
                        <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-black rounded-full ${new Date().getTime() - new Date(other.lastSeen).getTime() < 300000 ? 'bg-green-500' : 'bg-zinc-600'}`} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className={`font-black text-xs uppercase tracking-tight truncate ${selectedChat?.id === chat.id ? 'text-white' : 'text-zinc-300 group-hover:text-white'}`}>
                          {other.name || other.username}
                        </h3>
                        <span suppressHydrationWarning className="text-[10px] text-zinc-600 font-bold uppercase tracking-tighter shrink-0">{formatDistanceToNow(new Date(chat.lastMessageAt), { addSuffix: false })}</span>
                      </div>
                      <p className={`text-xs truncate ${selectedChat?.id === chat.id ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {lastMsg ? (lastMsg.type === 'TEXT' ? lastMsg.text : lastMsg.type === 'VOICE' ? '🎤 Voice message' : '📷 Image/Video') : "Start chatting..."}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            ) : (
                <div className="px-6 py-20 text-center space-y-3">
                    <p className="text-zinc-600 text-xs font-black uppercase tracking-widest italic">No conversations found</p>
                    <p className="text-[10px] text-zinc-700 font-medium">Follow your favorite creators to start chatting.</p>
                </div>
            )
          ) : (
            requests.length > 0 ? (
              requests.map((req) => {
                const requester = getOtherUser(req);
                return (
                <div key={req.id} className="px-6 py-6 border-b border-border-theme/50 last:border-0 bg-purple-500/5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-900 border border-border-theme relative overflow-hidden shrink-0">
                        {requester.image ? <Image src={requester.image} alt={requester.username} fill className="object-cover" /> : <div className="flex items-center justify-center h-full font-black text-zinc-600">{requester.username[0].toUpperCase()}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-black text-xs uppercase tracking-tight text-white truncate">{requester.name || requester.username}</h4>
                        <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mt-0.5">Wants to message you</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                        onClick={() => handleAcceptRequest(req.id)}
                        className="flex-1 bg-white text-black py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={14} /> Accept
                    </button>
                    <button 
                        onClick={() => handleDeclineRequest(req.id)}
                        className="flex-1 bg-zinc-900 text-zinc-500 border border-border-theme py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                        <X size={14} /> Decline
                    </button>
                  </div>
                </div>
              )})
            ) : (
                <div className="px-6 py-20 text-center space-y-3">
                    <p className="text-zinc-600 text-xs font-black uppercase tracking-widest italic">No pending requests</p>
                </div>
            )
          )}
        </div>
      </div>

      {/* 2. MIDDLE SECTION: Messaging / Chat Window */}
      <div className={`flex-1 flex flex-col bg-zinc-950/20 relative ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-border-theme flex items-center justify-between backdrop-blur-md bg-black/40 relative z-20">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 hover:bg-zinc-900 rounded-xl transition-all"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 border border-border-theme relative overflow-hidden">
                        {getOtherUser(selectedChat).image ? <Image src={getOtherUser(selectedChat).image} alt="Avatar" fill className="object-cover" /> : <div className="flex items-center justify-center h-full font-black text-zinc-600 uppercase text-xs">{getOtherUser(selectedChat).username[0]}</div>}
                    </div>
                </div>
                <div>
                  <h2 className="font-black text-xs md:text-sm uppercase tracking-tighter italic">{getOtherUser(selectedChat).name || getOtherUser(selectedChat).username}</h2>
                  <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${new Date().getTime() - new Date(getOtherUser(selectedChat).lastSeen).getTime() < 300000 ? 'bg-green-500' : 'bg-zinc-600'}`} />
                      <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">
                        {new Date().getTime() - new Date(getOtherUser(selectedChat).lastSeen).getTime() < 300000 ? 'Active Now' : 'Offline'}
                      </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {userAccess.recipientRole === 'CREATOR' && (
                    <div className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.2em] ${userAccess.tier === 0 ? 'border-zinc-800 text-zinc-600' : userAccess.tier === 1 ? 'border-amber-600/30 text-amber-600' : userAccess.tier === 2 ? 'border-zinc-400/30 text-zinc-400' : 'border-yellow-400/30 text-yellow-400'}`}>
                        Tier {userAccess.tier}
                    </div>
                )}
                <MoreVertical size={20} className="text-zinc-500 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar pb-10 bg-[url('/mesh-gradient.png')] bg-no-repeat bg-cover bg-fixed">
              {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                      <Loader2 size={32} className="animate-spin text-zinc-700" />
                  </div>
              ) : (
                <AnimatePresence initial={false}>
                 {messages.map((msg, idx) => {
                  const isMine = msg.senderId === currentUser.id;
                  return (
                    <motion.div 
                      key={msg.id || idx}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 20 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] md:max-w-[60%] flex gap-3 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                         <div className="w-8 h-8 rounded-full bg-zinc-900 border border-border-theme shrink-0 overflow-hidden relative self-end">
                            {msg.sender.image ? <Image src={msg.sender.image} alt="s" fill /> : <div className="flex items-center justify-center h-full text-[10px] font-black uppercase text-zinc-600">{msg.sender.username[0]}</div>}
                         </div>
                         <div className={`space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`p-4 rounded-2xl text-xs md:text-sm font-medium shadow-2xl ${isMine ? 'bg-white text-black rounded-br-none' : 'bg-zinc-900 text-white border border-border-theme rounded-tl-none backdrop-blur-md'}`}>
                                {msg.type === 'TEXT' ? (
                                    <p className="leading-relaxed">{msg.text}</p>
                                ) : msg.type === 'VOICE' ? (
                                    <div className="flex items-center gap-3 py-1">
                                        <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                                            <Mic size={18} className="text-purple-400" />
                                        </div>
                                        <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="w-2/3 h-full bg-purple-500" />
                                        </div>
                                        <span className="text-[10px] font-black">0:24</span>
                                    </div>
                                ) : (
                                    <div className="relative w-48 aspect-square rounded-xl overflow-hidden mb-2">
                                        <Image src={msg.mediaUrl || "/placeholder.png"} alt="media" fill className="object-cover" />
                                    </div>
                                )}
                            </div>
                            <span suppressHydrationWarning className="text-[8px] text-zinc-600 font-black uppercase tracking-widest px-1">
                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                            </span>
                         </div>
                      </div>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* PAYWALL / Message Input */}
            <div className="p-4 md:p-8 border-t border-border-theme bg-black relative z-20">
              {userAccess.recipientRole === 'CREATOR' && userAccess.tier === 0 && userAccess.messagesSent >= 6 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-4xl mx-auto"
                >
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                        <Lock size={24} className="text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Free Messages Exhausted</h3>
                    <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-md mx-auto">
                    You've used all 6 free messages with {getOtherUser(selectedChat).name || getOtherUser(selectedChat).username}. Subscribe now to instantly unlock unlimited messaging!
                </p>
                <div className="flex justify-center mt-6">
                    <button
                        onClick={() => setShowSubPlans(true)}
                        className="py-4 px-10 bg-purple-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-purple-500 transition-colors shadow-xl shadow-purple-500/20 active:scale-95"
                    >
                        View Subscription Plans
                    </button>
                </div>
              </div>
            </motion.div>
          ) : (
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex flex-col gap-2">
                  {userAccess.recipientRole === 'CREATOR' && userAccess.tier === 0 && (
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center mb-1">
                          {6 - userAccess.messagesSent} Free messages remaining
                      </p>
                  )}
                  <div className="flex items-center gap-4">
                      <div className="flex-1 relative flex items-center">
                        <div className="absolute left-4 flex gap-4 text-zinc-500">
                          <button type="button" className="hover:text-white transition-colors"><Smile size={20}/></button>
                        </div>
                        
                        <input 
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Write your message..."
                          className="w-full bg-zinc-900/50 border border-border-theme rounded-[2rem] py-4 px-14 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-sm font-medium transition-all"
                        />
                        
                        <div className="absolute right-4 flex items-center gap-4">
                          <TierRestrictedIcon icon={<Camera size={20} />} tierRequired={3} currentTier={userAccess.tier} isCreatorRecipient={userAccess.recipientRole === 'CREATOR'} />
                          <TierRestrictedIcon icon={<Mic size={20} />} tierRequired={2} currentTier={userAccess.tier} isCreatorRecipient={userAccess.recipientRole === 'CREATOR'} />
                          <button type="button" className="text-zinc-500 hover:text-white transition-colors">
                            <Paperclip size={20}/>
                          </button>
                        </div>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className={`p-4 rounded-2xl transition-all shadow-xl ${newMessage.trim() ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}
                      >
                        {sending ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />}
                      </button>
                  </div>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 border border-border-theme shadow-2xl rotate-3">
              <Edit size={40} className="text-zinc-800" />
            </div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Select a Conversation</h2>
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest max-w-xs leading-relaxed">
              Pick a chat from the sidebar or request a new one from a creator&apos;s profile to start your journey.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showSubPlans && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-black border border-border-theme rounded-[3rem] p-10 w-full max-w-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-12 opacity-5 text-purple-600 pointer-events-none">
                  <Star size={300} />
              </div>

              <div className="flex justify-between items-start mb-8 relative z-10">
                  <div>
                      <h2 className="text-4xl font-black italic uppercase tracking-tighter">Choose Your <span className="text-purple-500">Tier</span></h2>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Unlock @{getOtherUser(selectedChat).username}&apos;s exclusive content.</p>
                  </div>
                  <button onClick={() => setShowSubPlans(false)} className="p-3 bg-zinc-900 rounded-2xl hover:bg-zinc-800 transition-all">
                      <Plus className="rotate-45 text-zinc-500" />
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                  {/* TIER 1 */}
                  <SubTierCard 
                      tier={1} 
                      title="Bronze Membership" 
                      price={userAccess.creatorProfile?.tier1Price || 500}
                      duration={userAccess.creatorProfile?.tier1Duration || 30}
                      icon={<Heart size={20} className="text-white" />}
                      themeColor="#CD7F32"
                      features={["Access to all Premium Posts", "Text Messaging Access", "Loyalty Badge"]}
                      onSelect={(tier: any, price: any) => { setShowSubPlans(false); setPendingSub({ tier, amount: price, name: 'Bronze Membership' }); }}
                      disabled={subscribing}
                      currentTier={userAccess.tier}
                  />
                  {/* TIER 2 */}
                  <SubTierCard 
                      tier={2} 
                      title="Silver Membership" 
                      price={userAccess.creatorProfile?.tier2Price || 1500}
                      duration={userAccess.creatorProfile?.tier2Duration || 30}
                      icon={<Star size={20} className="text-white" />}
                      themeColor="#C0C0C0"
                      features={["Bronze Access", "Voice Messaging Access", "HD Content Unlock"]}
                      onSelect={(tier: any, price: any) => { setShowSubPlans(false); setPendingSub({ tier, amount: price, name: 'Silver Membership' }); }}
                      disabled={subscribing}
                      currentTier={userAccess.tier}
                      highlight
                  />
                  {/* TIER 3 */}
                  <SubTierCard 
                      tier={3} 
                      title="Gold VIP" 
                      price={userAccess.creatorProfile?.tier3Price || 3500}
                      duration={userAccess.creatorProfile?.tier3Duration || 30}
                      icon={<Crown size={20} className="text-white" />}
                      themeColor="#FFD700"
                      features={["Silver Access", "Camera & Media Messaging", "Private Video Request"]}
                      onSelect={(tier: any, price: any) => { setShowSubPlans(false); setPendingSub({ tier, amount: price, name: 'Gold VIP Membership' }); }}
                      disabled={subscribing}
                      currentTier={userAccess.tier}
                  />
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-border-theme">
                  <Wallet size={16} className="text-emerald-500" />
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                      Your Wallet Balance: <span className="text-white">${(currentUser.walletBalance / 100).toFixed(2)}</span>
                  </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PurchaseConfirmationModal 
        isOpen={!!pendingSub}
        onClose={() => setPendingSub(null)}
        onConfirm={() => {
            if (pendingSub) handleSubscribe(pendingSub.tier, pendingSub.amount);
        }}
        itemName={pendingSub?.name || ""}
        itemPrice={pendingSub?.amount || 0}
        currentBalance={currentUser.walletBalance || 0}
        loading={subscribing}
      />
    </div>
  );
};

// Sub-component for Tier Restricted Icons
const TierRestrictedIcon = ({ icon, tierRequired, currentTier, isCreatorRecipient }: { icon: any, tierRequired: number, currentTier: number, isCreatorRecipient: boolean }) => {
    // Restrictions only apply if messaging a creator
    const isRestricted = isCreatorRecipient && currentTier < tierRequired;
    
    return (
        <div className="relative group flex items-center justify-center">
            <button 
                type="button" 
                className={`transition-colors flex items-center justify-center p-1 rounded-lg ${isRestricted ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-500 hover:text-white'}`}
            >
                {icon}
                {isRestricted && <Lock size={8} className="absolute -top-1 -right-1 text-purple-500" />}
            </button>
            
            {isRestricted && (
                <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50">
                    <div className="bg-zinc-900 border border-border-theme px-3 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest whitespace-nowrap shadow-2xl text-purple-400">
                        Tier {tierRequired} required
                    </div>
                    <div className="w-2 h-2 bg-zinc-900 border-r border-b border-border-theme rotate-45 mx-auto -mt-1" />
                </div>
            )}
        </div>
    );
};

const SubTierCard = ({ tier, title, price, duration, icon, themeColor, features, onSelect, disabled, currentTier, highlight }: any) => {
    const isOwned = currentTier === tier;
    const isUpgrade = tier > currentTier;
    const isDowngrade = tier < currentTier && currentTier > 0;

    const durationLabel = duration > 0 && duration % 30 === 0 
        ? `${duration / 30} ${duration / 30 === 1 ? 'month' : 'months'}`
        : `${duration} days`;

    return (
        <div 
          className={`p-6 rounded-[2rem] border transition-all flex flex-col h-full bg-zinc-900/50 ${highlight ? 'shadow-xl' : ''}`}
          style={{ borderColor: highlight ? themeColor : `${themeColor}40`, boxShadow: highlight ? `0 0 20px ${themeColor}20` : 'none' }}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: themeColor }}>{icon}</div>
                {highlight && <span className="text-[8px] font-black uppercase tracking-widest text-white px-2 py-1 rounded-full" style={{ backgroundColor: themeColor }}>Popular</span>}
            </div>
            
            <div className="flex-1">
                <h4 className="text-sm font-black uppercase tracking-tighter mb-1" style={{ color: themeColor }}>{title}</h4>
                <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black italic tracking-tighter text-white">${(price / 100).toFixed(2)}</span>
                    <span className="text-[10px] font-black uppercase text-zinc-600">/ {durationLabel}</span>
                </div>

                <div className="space-y-3 mb-8">
                    {features.map((f: string, i: number) => (
                        <div key={i} className="flex items-start gap-2">
                            <Sparkles size={10} className="mt-1 shrink-0" style={{ color: themeColor }} />
                            <p className="text-[10px] font-medium text-zinc-400 leading-tight">{f}</p>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => onSelect(tier, price)}
                disabled={disabled}
                className={`w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isOwned ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'text-zinc-900 hover:scale-[1.02]'}`}
                style={{ backgroundColor: !isOwned ? themeColor : undefined }}
            >
                {isOwned ? "Extend Subscription" : isUpgrade ? (currentTier > 0 ? "Upgrade Plan" : "Select Plan") : isDowngrade ? "Downgrade & Extend" : "Select Plan"}
            </button>
        </div>
    );
};

export default MessagesClient;
