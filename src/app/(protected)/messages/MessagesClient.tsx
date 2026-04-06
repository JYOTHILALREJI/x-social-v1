"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MoreVertical, Edit, CheckCheck, Send, 
  Paperclip, Smile, Mic, Video, Camera, Info, 
  Check, X, Loader2, ArrowLeft, Lock, Wallet, Plus, Eye, Volume2, VolumeX, Trash2,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToCreator } from '@/app/actions/user-actions';
import { Sparkles, Crown, Star, Heart, RotateCw } from 'lucide-react';
import PurchaseConfirmationModal from '@/components/PurchaseConfirmationModal';
import { 
  getMessages, sendMessage, respondToRequest, 
  getConversations, getMessageRequests, getConversationAccess, markChatAsRead,
  markMessageSeen
} from '@/app/actions/message-actions';
import { formatDistanceToNow } from 'date-fns';

interface MessagesClientProps {
  currentUser: any;
  initialConversations: any[];
  initialRequests: any[];
}

const VoiceMessagePlayer = ({ url, duration, isMine }: { url: string, duration?: number, isMine: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            setProgress((audio.currentTime / audio.duration) * 100);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', onEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', onEnded);
        };
    }, []);

    return (
        <div className="flex items-center gap-3 py-1">
            <button 
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isMine ? 'bg-black/10 text-black' : 'bg-purple-500/10 text-purple-400'}`}
            >
                {isPlaying ? <Volume2 size={18} className="animate-pulse" /> : <Mic size={18} />}
            </button>
            <audio ref={audioRef} src={url} className="hidden" />
            <div className="w-32 h-2 bg-zinc-800/20 rounded-full overflow-hidden relative">
                <div className={`absolute inset-0 ${isMine ? 'bg-black/5' : 'bg-purple-500/10'}`} />
                <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${progress}%` }} 
                    className={`h-full ${isMine ? 'bg-black' : 'bg-purple-500'}`} 
                />
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">
                {duration ? `0:${duration.toString().padStart(2, '0')}` : '0:03'}
            </span>
        </div>
    );
};

const isVideo = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().includes('.mp4') || 
           url.toLowerCase().includes('.mov') || 
           url.toLowerCase().includes('.webm') || 
           url.startsWith('data:video');
};

const MediaViewer = ({ media, onClose }: { media: any, onClose: () => void }) => {
    const [progress, setProgress] = useState(100);
    const videoRef = useRef<HTMLVideoElement>(null);
    const isViewOnce = media.viewLimit && !media.isMine;
    const isVid = isVideo(media.mediaUrl);

    useEffect(() => {
        if (!isViewOnce || isVid) return;

        const duration = 10000; // 10 seconds
        const interval = 100; // Update every 100ms
        const step = (interval / duration) * 100;

        const timer = setInterval(() => {
            setProgress(prev => {
                const next = prev - step;
                if (next <= 0) {
                    clearInterval(timer);
                    setTimeout(() => onClose(), 0); 
                    return 0;
                }
                return next;
            });
        }, interval);

        return () => clearInterval(timer);
    }, [isViewOnce, isVid, onClose]);

    const handleVideoTimeUpdate = () => {
        if (!videoRef.current || !isViewOnce) return;
        const current = videoRef.current.currentTime;
        const total = videoRef.current.duration;
        if (total > 0) {
            setProgress(((total - current) / total) * 100);
        }
    };

    const handleVideoEnded = () => {
        if (isViewOnce) {
            setTimeout(() => onClose(), 0);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-4"
        >
            {/* View Once Progress Bar */}
            {isViewOnce && (
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-900 overflow-hidden z-50">
                    <motion.div 
                        initial={{ width: '100%' }}
                        animate={{ width: `${progress}%` }}
                        transition={{ ease: "linear" }}
                        className="h-full bg-purple-500 shadow-[0_0_10px_#a855f7]"
                    />
                </div>
            )}

            {/* Header Controls */}
            <div className="absolute top-8 right-8 flex items-center gap-4 z-50">
                {isViewOnce && (
                    <div className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center gap-2">
                        <Eye size={12} className="text-purple-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{isVid ? 'Watching' : `${Math.ceil(progress / 10)}s Remaining`}</span>
                    </div>
                )}
                {!isViewOnce && (
                    <button onClick={onClose} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-white hover:bg-white/10 transition-all backdrop-blur-md">
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Media Content */}
            <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative w-full h-full"
                >
                    {isVid ? (
                        <video 
                            ref={videoRef}
                            src={media.mediaUrl}
                            autoPlay
                            playsInline
                            controls={!isViewOnce}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onEnded={handleVideoEnded}
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <Image 
                            src={media.mediaUrl} 
                            alt="Full View" 
                            fill 
                            className="object-contain"
                            priority
                        />
                    )}
                </motion.div>
            </div>

            {/* Bottom Info (Only for standard) */}
            {!isViewOnce && (
                <div className="absolute bottom-8 left-8 right-8 flex justify-center">
                    <div className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl text-white flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Shared By</span>
                            <span className="text-sm font-black italic tracking-tighter uppercase">{media.sender.username}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10 mx-2" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Sent</span>
                            <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">{formatDistanceToNow(new Date(media.createdAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

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
  
  // Media & Ephemeral States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<any>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<'photo' | 'video'>('photo');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isCapturingVideo, setIsCapturingVideo] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<{url: string, type: 'photo' | 'video', isEphemeral: boolean}[]>([]);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMedia, setActiveMedia] = useState<any>(null); // For the full-screen viewer
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesCount = useRef(messages.length);

  const scrollToBottom = (force = false) => {
    if (!messagesContainerRef.current) return;
    
    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    
    if (force || isNearBottom) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (messages.length > prevMessagesCount.current) {
      scrollToBottom(true);
    }
    prevMessagesCount.current = messages.length;
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

  const handleSendMessage = async (e?: React.FormEvent, customData?: any) => {
    if (e) e.preventDefault();
    const dataToUse = customData || { text: newMessage, type: "TEXT" };
    if (!dataToUse.text?.trim() && !dataToUse.mediaUrl && !sending) return;

    setSending(true);
    setUploadProgress(10); // Start progress
    
    // Animate progress
    const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 5;
        });
    }, 200);

    // Add ephemeral metadata if selected
    const payload = { 
      ...dataToUse,
      ...((isEphemeral || customData?.isEphemeral) ? { viewLimit: 1 } : {}) 
    };

    const res = await sendMessage(selectedChat.id, currentUser.id, payload);
    clearInterval(progressInterval);
    setUploadProgress(100);
    
    setTimeout(() => {
        setUploadProgress(0);
        setSending(false);
    }, 500);

    if (res.success) {
      if (!customData) setNewMessage("");
      setIsEphemeral(false); // Reset after send
      
      setMessages(prev => [...prev, res.message]);
      const accessRes = await getConversationAccess(selectedChat.id, currentUser.id);
      if (accessRes) setUserAccess(accessRes);
    } else {
      alert(res.error || "Failed to send message");
    }
    setSending(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPreviews: {url: string, type: 'photo' | 'video', isEphemeral: boolean}[] = [];
    
    for (const file of Array.from(files)) {
      const type: 'photo' | 'video' = file.type.startsWith('video/') ? 'video' : 'photo';
      const reader = new FileReader();
      const result = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      newPreviews.push({ url: result, type, isEphemeral: false });
    }

    setPreviewFiles(prev => [...prev, ...newPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- VOICE RECORDING ---
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
        throw new Error(isSecure 
          ? "MediaDevices not supported in this browser." 
          : "Microphone access requires a Secure Context (HTTPS or localhost). Please use HTTPS to record voice messages.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
      }

      const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported(options.mimeType) ? options : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: options.mimeType });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          // Only send if we didn't cancel
          if ((recorder as any).ignoreStopSend) return;

          handleSendMessage(undefined, { 
            type: "VOICE", 
            mediaUrl: base64Audio,
            duration: recordingSeconds 
          });
        };
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      const interval = setInterval(() => setRecordingSeconds(prev => prev + 1), 1000);
      setRecordingInterval(interval);
    } catch (err: any) {
      alert("Microphone error: " + (err.message || "Access denied"));
    }
  };

  const stopRecording = (cancel = false) => {
    if (mediaRecorder) {
      if (cancel) (mediaRecorder as any).ignoreStopSend = true;
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(recordingInterval);
    }
  };

  // --- CAMERA CAPTURE ---
  const openCamera = async (mode: 'photo' | 'video' = 'photo') => {
    setCameraMode(mode);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode }, 
        audio: mode === 'video' 
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      alert("Camera access denied.");
    }
  };

  const toggleCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    
    if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: nextMode }, 
          audio: true 
        });
        setCameraStream(stream);
        if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
        console.error("Camera toggle error:", err);
    }
  };

  // Ensure video stream attaches reliably after modal opens
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
        videoRef.current.srcObject = cameraStream;
    }
  }, [showCamera, cameraStream]);

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setIsCapturingVideo(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');
      setPreviewFiles(prev => [...prev, { url: dataUrl, type: 'photo', isEphemeral: false }]);
      setActivePreviewIndex(previewFiles.length); // Focus on new
      closeCamera();
    }
  };

  const startVideoRecording = () => {
    if (!cameraStream) return;
    const recorder = new MediaRecorder(cameraStream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = async () => {
      const videoBlob = new Blob(chunks, { type: 'video/webm' });
      const reader = new FileReader();
      reader.readAsDataURL(videoBlob);
      reader.onloadend = async () => {
        setPreviewFiles(prev => [...prev, { url: reader.result as string, type: 'video', isEphemeral: false }]);
        setActivePreviewIndex(previewFiles.length);
        closeCamera();
      };
    };
    setMediaRecorder(recorder);
    recorder.start();
    setIsCapturingVideo(true);
  };

  const stopVideoRecording = () => {
    if (mediaRecorder && isCapturingVideo) {
      mediaRecorder.stop();
      setIsCapturingVideo(false);
    }
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
    <div className="w-full h-[calc(100vh-8rem)] md:h-screen bg-black text-white flex overflow-hidden">
      
      {/* -- CHAT LIST -- */}
      <div className={`${selectedChat ? 'hidden' : 'flex'} md:flex w-full md:w-[350px] lg:w-[400px] border-r border-border-theme flex-col bg-black relative z-10`}>
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

      {/* -- CHAT WINDOW -- */}
      <div className={`flex-1 flex flex-col bg-zinc-950/20 relative ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-border-theme flex items-center justify-between backdrop-blur-md bg-black/80 sticky top-0 z-30">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2.5 bg-zinc-900 border border-border-theme rounded-2xl text-white hover:bg-zinc-800 transition-all flex items-center justify-center"
                >
                  <ArrowLeft size={18} />
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
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 no-scrollbar pb-10 bg-[url('/mesh-gradient.png')] bg-no-repeat bg-cover bg-fixed scroll-smooth"
            >
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
                            <div 
                              onClick={() => {
                                if (msg.mediaUrl) {
                                  setActiveMedia(msg);
                                  if (!isMine && msg.viewLimit && msg.viewCount < msg.viewLimit) {
                                    markMessageSeen(msg.id);
                                    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, viewCount: m.viewCount + 1 } : m));
                                  }
                                }
                              }}
                              className={`p-4 rounded-2xl text-xs md:text-sm font-medium shadow-2xl transition-all cursor-pointer group/bubble ${isMine ? 'bg-white text-black rounded-br-none' : 'bg-zinc-900 text-white border border-border-theme rounded-tl-none backdrop-blur-md'}`}
                            >
                                {msg.type === 'TEXT' ? (
                                    <p className="leading-relaxed">{msg.text}</p>
                                ) : msg.type === 'VOICE' ? (
                                    <VoiceMessagePlayer url={msg.mediaUrl} duration={msg.duration} isMine={isMine} />
                                ) : (
                                    <div className="relative">
                                        {(!isMine && msg.viewLimit && msg.viewCount === 0) ? (
                                          <div className="w-48 aspect-square bg-zinc-800/50 rounded-xl flex flex-col items-center justify-center gap-3 border border-dashed border-zinc-700 hover:bg-zinc-800/80 transition-colors">
                                            <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center ring-4 ring-purple-500/5 group-hover/bubble:scale-110 transition-transform">
                                              <Eye size={24} className="text-purple-400" />
                                            </div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">View Once Media</p>
                                            <p className="text-[8px] font-bold text-purple-500/60 uppercase">Tap to Reveal</p>
                                          </div>
                                        ) : (
                                          <div className="relative w-48 aspect-square rounded-xl overflow-hidden mb-1">
                                              {msg.mediaUrl ? (
                                                <>
                                                    {isVideo(msg.mediaUrl) ? (
                                                       <video src={msg.mediaUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                       <Image src={msg.mediaUrl} alt="media" fill className="object-cover transition-transform group-hover/bubble:scale-105" />
                                                    )}
                                                    <div className="absolute inset-0 bg-black/20 group-hover/bubble:bg-black/0 transition-colors" />
                                                </>
                                              ) : (
                                                <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center gap-2 border border-border-theme">
                                                    <Lock size={16} className="text-zinc-800" />
                                                    <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest italic">Expired</span>
                                                </div>
                                              )}
                                              {msg.viewLimit && msg.mediaUrl && (
                                                <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-[8px] font-black uppercase text-purple-400">
                                                  View Once
                                                </div>
                                              )}
                                          </div>
                                        )}
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
                  <div className="flex items-center gap-2 md:gap-4">
                      <div className="flex-1 relative flex items-center">
                        <input 
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Write message..."
                          className="w-full bg-zinc-900/50 border border-border-theme rounded-[1.5rem] md:rounded-[2rem] py-3 md:py-4 px-4 sm:px-12 md:px-14 lg:pr-48 md:pr-40 pr-32 focus:outline-none focus:ring-1 focus:ring-zinc-600 text-[13px] md:text-sm font-medium transition-all"
                        />
                        
                        <div className="absolute right-2 md:right-4 flex items-center gap-1.5 md:gap-3">
                          {currentUser.role === 'CREATOR' && (
                            <button 
                                type="button" 
                                onClick={() => fileInputRef.current?.click()}
                                className="p-1 rounded-lg text-zinc-500 hover:text-white transition-colors"
                                title="Attach Files"
                            >
                                <Paperclip size={18} />
                            </button>
                          )}

                          <TierRestrictedIcon 
                            icon={<Camera size={18} onClick={() => openCamera('photo')} />} 
                            tierRequired={3} 
                            currentTier={userAccess.tier} 
                            isCreatorRecipient={userAccess.recipientRole === 'CREATOR'} 
                          />
                          
                          {!isRecording ? (
                            <TierRestrictedIcon 
                              icon={<Mic size={18} onClick={startRecording} />} 
                              tierRequired={2} 
                              currentTier={userAccess.tier} 
                              isCreatorRecipient={userAccess.recipientRole === 'CREATOR'} 
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-purple-600 px-3 py-1.5 rounded-full shadow-lg shadow-purple-500/20 border border-purple-400/30">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              <span className="text-[10px] font-black text-white">0:{recordingSeconds.toString().padStart(2, '0')}</span>
                              <button type="button" onClick={() => stopRecording(true)} className="text-white/60 hover:text-white pl-1"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={(!newMessage.trim() && !isRecording) || sending}
                        className={`p-4 rounded-2xl transition-all shadow-xl ${ (newMessage.trim() || isRecording) ? 'bg-white text-black hover:scale-105 active:scale-95' : 'bg-zinc-900 text-zinc-700 cursor-not-allowed'}`}
                        onClick={(e) => {
                          if (isRecording) {
                            e.preventDefault();
                            stopRecording(false);
                          }
                        }}
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
        {showCamera && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl aspect-[3/4] bg-zinc-900 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl"
            >
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover" 
              />
              
              <div className="absolute top-8 left-0 right-0 px-8 flex justify-between items-center z-10">
                <button onClick={closeCamera} className="p-4 bg-black/40 backdrop-blur-md rounded-2xl text-white hover:bg-black/60 transition-all">
                  <X size={24} />
                </button>
                <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/10">
                  {cameraMode === 'photo' ? 'Photo Mode' : 'Video Mode'}
                </div>
              </div>

              <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8">
                <div className="flex items-center gap-12">
                    <button 
                      onClick={toggleCamera}
                      className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"
                    >
                      <RotateCw size={24} />
                    </button>
                    
                    <button 
                      onClick={cameraMode === 'photo' ? capturePhoto : (isCapturingVideo ? stopVideoRecording : startVideoRecording)}
                      className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-all"
                    >
                      <div className={`w-16 h-16 rounded-full ${cameraMode === 'photo' ? 'bg-white' : (isCapturingVideo ? 'bg-zinc-800 scale-75 rounded-lg' : 'bg-red-500')} transition-all group-hover:scale-95`} />
                    </button>

                    <button 
                      onClick={() => setCameraMode(cameraMode === 'photo' ? 'video' : 'photo')}
                      className="p-4 bg-zinc-800 rounded-2xl text-zinc-400 hover:text-white transition-all shadow-xl"
                    >
                      {cameraMode === 'photo' ? <Video size={24} /> : <Camera size={24} />}
                    </button>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                  {cameraMode === 'photo' ? 'Tap to Capture' : (isCapturingVideo ? 'Recording...' : 'Tap to Record')}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSubPlans && (
          <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-xl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              className="bg-black border border-border-theme rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 w-full max-w-2xl shadow-2xl relative overflow-y-auto max-h-[90vh] no-scrollbar"
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

              <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory no-scrollbar pb-6 -mx-2 px-2 relative z-10">
                  {/* TIER 1 */}
                  <div className="flex-shrink-0 w-[280px] md:w-full snap-center">
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
                  </div>
                  {/* TIER 2 */}
                  <div className="flex-shrink-0 w-[280px] md:w-full snap-center">
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
                  </div>
                  {/* TIER 3 */}
                  <div className="flex-shrink-0 w-[280px] md:w-full snap-center">
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
      
      <AnimatePresence>
        {previewFiles.length > 0 && (
          <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-4">
            <div className="relative w-full h-full max-w-4xl flex flex-col">
              {/* Top Bar */}
              <div className="flex items-center justify-between p-6 z-10">
                <div className="flex flex-col">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Media Review</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">
                        Item {activePreviewIndex + 1} of {previewFiles.length}
                    </p>
                </div>
                <button 
                  onClick={() => {
                        setPreviewFiles([]);
                        setActivePreviewIndex(0);
                  }}
                  className="p-4 bg-zinc-900/50 backdrop-blur-md rounded-2xl text-zinc-500 hover:text-white transition-all border border-white/5"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Media Display and Navigation */}
              <div className="flex-1 relative flex items-center justify-center group overflow-hidden bg-zinc-950/50 rounded-[3rem] border border-white/5 my-4">
                 {previewFiles.length > 1 && (
                    <>
                        <button 
                            onClick={() => setActivePreviewIndex(prev => (prev - 1 + previewFiles.length) % previewFiles.length)}
                            className="absolute left-6 z-20 p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button 
                            onClick={() => setActivePreviewIndex(prev => (prev + 1) % previewFiles.length)}
                            className="absolute right-6 z-20 p-4 bg-black/60 backdrop-blur-xl rounded-2xl text-white opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                 )}

                 <AnimatePresence mode="wait">
                    <motion.div 
                        key={activePreviewIndex}
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -20, scale: 0.95 }}
                        className="w-full h-full relative p-8"
                    >
                        {previewFiles[activePreviewIndex].type === 'photo' ? (
                            <Image 
                                src={previewFiles[activePreviewIndex].url} 
                                alt="Preview" 
                                fill 
                                className="object-contain" 
                            />
                        ) : (
                            <video 
                                src={previewFiles[activePreviewIndex].url} 
                                autoPlay 
                                loop 
                                playsInline 
                                className="w-full h-full object-contain" 
                            />
                        )}
                    </motion.div>
                 </AnimatePresence>
              </div>

              {/* Bottom Controls */}
              <div className="p-8 bg-zinc-900/30 backdrop-blur-xl border border-white/5 rounded-[3rem] flex flex-col gap-8 mb-8">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            type="button"
                            onClick={() => {
                                const newFiles = [...previewFiles];
                                newFiles[activePreviewIndex].isEphemeral = !newFiles[activePreviewIndex].isEphemeral;
                                setPreviewFiles(newFiles);
                            }}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all ${previewFiles[activePreviewIndex].isEphemeral ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-900/50 border-border-theme text-zinc-500 hover:text-white'}`}
                        >
                            <Eye size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{previewFiles[activePreviewIndex].isEphemeral ? 'View Once (ON)' : 'Standard View'}</span>
                        </button>

                        <button 
                            onClick={() => {
                                const newFiles = previewFiles.filter((_, i) => i !== activePreviewIndex);
                                if (newFiles.length === 0) {
                                    setPreviewFiles([]);
                                    setActivePreviewIndex(0);
                                } else {
                                    setPreviewFiles(newFiles);
                                    setActivePreviewIndex(prev => Math.min(prev, newFiles.length - 1));
                                }
                            }}
                            className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={() => {
                                // For camera, it might meant 'retake' so we add another button later if needed
                                // But for gallery upload, we just add more
                                fileInputRef.current?.click();
                            }}
                            className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
                        >
                            Add More
                        </button>
                        <button 
                            onClick={async () => {
                                const filesToSend = [...previewFiles];
                                setPreviewFiles([]);
                                setActivePreviewIndex(0);
                                for (const file of filesToSend) {
                                    await handleSendMessage(undefined, { 
                                        type: "MEDIA", 
                                        mediaUrl: file.url,
                                        isEphemeral: file.isEphemeral 
                                    });
                                }
                            }}
                            className="px-10 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                        >
                            Send {previewFiles.length} {previewFiles.length === 1 ? 'Media' : 'Items'} to @{getOtherUser(selectedChat).username}
                        </button>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMedia && (
            <MediaViewer 
                media={activeMedia} 
                onClose={() => {
                    setActiveMedia(null);
                }} 
            />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadProgress > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm px-6 py-4 bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl flex items-center gap-4"
          >
             <div className="flex-1 space-y-2">
                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 italic">Uploading Content...</span>
                    <span className="text-[9px] font-black text-white">{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                </div>
             </div>
             <Loader2 size={16} className="animate-spin text-purple-500" />
          </motion.div>
        )}
      </AnimatePresence>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileSelect} 
        multiple 
        hidden 
        accept="image/*,video/*"
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
          className={`p-4 md:p-6 rounded-[2rem] border transition-all flex flex-col h-full bg-zinc-900/50 ${highlight ? 'shadow-xl' : ''}`}
          style={{ borderColor: highlight ? themeColor : `${themeColor}40`, boxShadow: highlight ? `0 0 20px ${themeColor}20` : 'none' }}
        >
            <div className="flex justify-between items-start mb-4 md:mb-6">
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
