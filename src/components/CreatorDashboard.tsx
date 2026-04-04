"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Calendar, Filter, 
  Eye, EyeOff, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  BarChart3, LayoutDashboard, Settings as SettingsIcon,
  ChevronDown, Download, Share2, Wallet, Crown, Loader2
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import Image from 'next/image';
import Link from 'next/link';
import { toggleContentVisibility } from '@/app/actions/user-actions';
import FollowersPanel from './FollowersPanel';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface Revenue {
  id: string;
  amount: number;
  type: string;
  createdAt: string | Date;
}

interface CreatorDashboardProps {
  user: {
    id: string;
    username: string;
    image: string | null;
    _count: { posts: number; reels: number; followers: number };
    posts: any[];
    reels: any[];
    revenues: Revenue[];
    walletBalance: number;
    followersCount: number;
    subscribersCount: number;
    creatorProfile: {
      tier1Price: number;
      tier2Price: number;
      tier3Price: number;
    } | null;
  };
  platformFee?: number;
  onToggleVisibility?: (id: string, type: 'post' | 'reel', isPrivate: boolean) => void;
}

const CreatorDashboard = ({ user, platformFee = 20, onToggleVisibility }: CreatorDashboardProps) => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [mounted, setMounted] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'followers' | 'subscribers'>('followers');

  const openPanel = (tab: 'followers' | 'subscribers') => {
    setPanelTab(tab);
    setPanelOpen(true);
  };

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats with platform fee deduction
  const totalEarnings = useMemo(() => {
    const gross = user.revenues
      .filter(rev => rev.type !== 'WALLET_TOPUP')
      .reduce((acc, rev) => acc + rev.amount, 0);
    return Math.floor(gross * (1 - platformFee / 100));
  }, [user.revenues, platformFee]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const gross = user.revenues
      .filter(rev => rev.type !== 'WALLET_TOPUP')
      .filter(rev => new Date(rev.createdAt) >= startOfMonth)
      .reduce((acc, rev) => acc + rev.amount, 0);
    return Math.floor(gross * (1 - platformFee / 100));
  }, [user.revenues, platformFee]);

  const earningsDeducted = useMemo(() => {
    const gross = user.revenues.reduce((acc, rev) => acc + rev.amount, 0);
    return Math.floor(gross * (platformFee / 100));
  }, [user.revenues, platformFee]);


  // Chart Data preparation
  const chartData = useMemo(() => {
    const labels: string[] = [];
    const points: number[] = [];

    const earningRevenues = user.revenues.filter(rev => rev.type !== 'WALLET_TOPUP');

    if (timeFilter === 'daily') {
      // Last 7 days — one bar per day
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleString('default', { weekday: 'short' }));

        const dayEarnings = earningRevenues
          .filter(rev => {
            const rd = new Date(rev.createdAt);
            return (
              rd.getDate() === d.getDate() &&
              rd.getMonth() === d.getMonth() &&
              rd.getFullYear() === d.getFullYear()
            );
          })
          .reduce((acc, rev) => acc + rev.amount, 0);

        points.push(parseFloat((dayEarnings / 100).toFixed(2)));
      }
    } else if (timeFilter === 'weekly') {
      // Last 8 weeks — one bar per week
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date();
        // Go back i weeks (start of that week = Monday)
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1 - i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const label = `W${weekStart.toLocaleString('default', { month: 'short' })} ${weekStart.getDate()}`;
        labels.push(label);

        const weekEarnings = earningRevenues
          .filter(rev => {
            const rd = new Date(rev.createdAt);
            return rd >= weekStart && rd <= weekEnd;
          })
          .reduce((acc, rev) => acc + rev.amount, 0);

        points.push(parseFloat((weekEarnings / 100).toFixed(2)));
      }
    } else if (timeFilter === 'monthly') {
      // Last 6 months — one bar per month
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('default', { month: 'short' }));

        const monthEarnings = earningRevenues
          .filter(rev => {
            const rd = new Date(rev.createdAt);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
          })
          .reduce((acc, rev) => acc + rev.amount, 0);

        points.push(parseFloat((monthEarnings / 100).toFixed(2)));
      }
    } else if (timeFilter === 'yearly') {
      // Last 12 months (rolling year) — one bar per month
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));

        const monthEarnings = earningRevenues
          .filter(rev => {
            const rd = new Date(rev.createdAt);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
          })
          .reduce((acc, rev) => acc + rev.amount, 0);

        points.push(parseFloat((monthEarnings / 100).toFixed(2)));
      }
    }

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Revenue ($)',
          data: points,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          borderWidth: 3,
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
        },
      ],
    };
  }, [timeFilter, user.revenues]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#18181b',
        titleColor: '#a1a1aa',
        bodyColor: '#fff',
        bodyFont: { weight: 'bold' as const },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
        callbacks: {
          label: (ctx: any) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a' },
      },
      y: {
        grid: { color: 'rgba(39, 39, 42, 0.5)' },
        ticks: {
          color: '#71717a',
          callback: (value: any) => `$${Number(value).toFixed(2)}`,
        },
      },
    },
  };

  return (
    <React.Fragment>
      <div className="w-full space-y-10 animate-in fade-in duration-700">
      
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2 text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground text-sm font-medium">Monitoring your success and content performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <Link 
              href="/settings"
              className="p-3 bg-card-bg hover:bg-card-hover rounded-2xl border border-border-theme transition-all group"
            >
              <SettingsIcon size={20} className="text-muted-foreground group-hover:rotate-90 transition-transform duration-500" />
            </Link>
            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-purple-500/20">
              <Download size={14} /> Export Report
            </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Followers" 
          value={(user.followersCount || 0).toLocaleString()} 
          trend="Community" 
          trendUp={true} 
          icon={<Users className="text-blue-500" />}
          onClick={() => openPanel('followers')}
        />
        <StatCard 
          title="Total Subscribers" 
          value={(user.subscribersCount || 0).toLocaleString()} 
          trend="Paying Members" 
          trendUp={true} 
          icon={<Crown className="text-amber-500" />}
          onClick={() => openPanel('subscribers')}
        />
        <StatCard 
          title="Total Earnings" 
          value={`$${(totalEarnings / 100).toLocaleString()}`} 
          trend={`Excl. ${platformFee}% Platform Fee`} 
          trendUp={true} 
          icon={<DollarSign className="text-emerald-500" />} 
        />
        <StatCard 
          title="Monthly Revenue" 
          value={`$${(monthlyEarnings / 100).toLocaleString()}`} 
          trend="Calculated Net" 
          trendUp={true} 
          icon={<TrendingUp className="text-purple-500" />} 
        />
        <StatCard 
          title="Wallet Balance" 
          value={`$${(user.walletBalance / 100).toFixed(2)}`} 
          trend="Available for payout" 
          trendUp={true} 
          icon={<Wallet className="text-emerald-400" />} 
        />
      </div>

      {/* Graph Section */}
      <div className="bg-card-bg border border-border-theme rounded-[2.5rem] p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <BarChart3 size={20} className="text-purple-500" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Revenue Analytics</h3>
               <p className="text-muted-foreground text-xs">Real-time revenue performance over time</p>
             </div>
          </div>
          
          <div className="flex items-center bg-background/50 p-1.5 rounded-2xl border border-border-theme">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === period ? 'bg-foreground text-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          {mounted && <Line data={chartData} options={chartOptions} />}
        </div>
      </div>

      {/* Content Management Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
               <div className="p-3 bg-zinc-900 rounded-2xl border border-border-theme">
                  <LayoutDashboard size={20} className="text-zinc-400" />
               </div>
               <div>
                 <h3 className="text-lg font-black uppercase tracking-tight text-foreground">Manage Content</h3>
                 <p className="text-muted-foreground text-xs">Visibility and performance of your posts & reels</p>
               </div>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
            View All <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts List */}
          <div className="bg-card-bg border border-border-theme rounded-[2.5rem] p-6 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Recent Posts
              </h4>
              <div className="space-y-4">
                {user.posts.slice(0, 3).map((post) => (
                  <ContentItem key={post.id} item={post} type="post" userId={user.id} onToggle={onToggleVisibility} />
                ))}
                {user.posts.length === 0 && <p className="text-muted-foreground text-xs italic">No posts found.</p>}
              </div>
          </div>

          {/* Recent Reels List */}
          <div className="bg-card-bg border border-border-theme rounded-[2.5rem] p-6 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Recent Reels
              </h4>
              <div className="space-y-4">
                {user.reels.slice(0, 3).map((reel) => (
                  <ContentItem key={reel.id} item={reel} type="reel" userId={user.id} onToggle={onToggleVisibility} />
                ))}
                {user.reels.length === 0 && <p className="text-muted-foreground text-xs italic">No reels found.</p>}
              </div>
          </div>
        </div>
      </div>
      </div>

      <FollowersPanel
        isOpen={panelOpen}
        defaultTab={panelTab}
        creatorId={user.id}
        onClose={() => setPanelOpen(false)}
      />
    </React.Fragment>
  );
};

// Sub-components
const StatCard = ({ title, value, trend, trendUp, icon, onClick }: any) => (
  <div
    className={`bg-card-bg border border-border-theme p-8 rounded-[2.5rem] hover:border-border-theme transition-all group overflow-hidden relative ${onClick ? 'cursor-pointer hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5' : ''}`}
    onClick={onClick}
  >
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-card-bg/20 rounded-full group-hover:scale-150 transition-transform duration-700" />
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-background rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div className={`flex items-center gap-1 text-[10px] font-black p-1.5 px-3 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">{title}</p>
      <p className="text-3xl font-black italic tracking-tighter text-foreground" suppressHydrationWarning>{value}</p>
    </div>
  </div>
);

const ContentItem = ({ item, type, userId, onToggle }: { item: any; type: 'post' | 'reel'; userId: string; onToggle?: any }) => {
  const [isVisible, setIsVisible] = useState(!item.isPrivate);
  const [loading, setLoading] = useState(false);

  // Sync state if props change (e.g. after refresh or manual state update)
  React.useEffect(() => {
    setIsVisible(!item.isPrivate);
  }, [item.isPrivate]);

  const handleToggle = async () => {
    setLoading(true);
    const newPrivateStatus = isVisible; // we want to set it to private if it's currently visible
    const res = await toggleContentVisibility(userId, item.id, type, newPrivateStatus);
    if (res.success) {
      setIsVisible(!newPrivateStatus);
      if (onToggle) onToggle(item.id, type, newPrivateStatus);
    } else {
      alert(res.error || "Failed to update visibility");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card-bg/30 rounded-3xl border border-border-theme hover:border-border-theme transition-all group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 relative rounded-xl overflow-hidden border border-border-theme ${!isVisible ? 'opacity-40 grayscale-[0.5]' : ''}`}>
           {type === 'post' ? (
             <Image src={`/api/media/post/${item.id}`} alt="content" fill className="object-cover" unoptimized />
           ) : (
             <video src={`/api/media/reel/${item.id}`} className="w-full h-full object-cover" />
           )}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-tight line-clamp-1 flex items-center gap-2 text-foreground">
            {item.caption || "Untiled Content"}
            {!isVisible && <span className="bg-card-bg text-[8px] px-1.5 py-0.5 rounded text-muted-foreground">Hidden</span>}
          </p>
          <div className="flex items-center gap-3 mt-1">
             <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest" suppressHydrationWarning>
               {new Date(item.createdAt).toLocaleDateString()}
             </span>
             {item.isPremium && <span className="text-[9px] text-amber-500 font-black px-1.5 bg-amber-500/10 rounded outline outline-1 outline-amber-500/20">$ {item.price || "Free"}</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
         <button 
           disabled={loading}
           onClick={handleToggle}
           className={`p-2 rounded-xl border transition-all ${isVisible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-background border-border-theme text-muted-foreground'} ${loading ? 'opacity-50' : ''}`}
         >
           {loading ? <Loader2 size={16} className="animate-spin" /> : isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
         </button>
         <button className="p-2 bg-background border border-border-theme text-muted-foreground rounded-xl hover:bg-card-bg transition-all">
           <MoreHorizontal size={16} />
         </button>
      </div>
    </div>
  );
};

export default CreatorDashboard;
