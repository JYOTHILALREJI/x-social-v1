"use client";

import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Users, DollarSign, Calendar, Filter, 
  Eye, EyeOff, MoreHorizontal, ArrowUpRight, ArrowDownRight,
  BarChart3, LayoutDashboard, Settings as SettingsIcon,
  ChevronDown, Download, Share2, Wallet, Crown
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
}

const CreatorDashboard = ({ user, platformFee = 20 }: CreatorDashboardProps) => {
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate stats with platform fee deduction
  const totalEarnings = useMemo(() => {
    const gross = user.revenues.reduce((acc, rev) => acc + rev.amount, 0);
    return Math.floor(gross * (1 - platformFee / 100));
  }, [user.revenues, platformFee]);

  const monthlyEarnings = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const gross = user.revenues
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
    // Generate labels and data based on timeFilter
    // For now, let's group by the relevant unit
    const labels: string[] = [];
    const points: number[] = [];

    if (timeFilter === 'monthly') {
      // Last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleString('default', { month: 'short' });
        labels.push(monthLabel);
        
        const monthEarnings = user.revenues
          .filter(rev => {
            const rd = new Date(rev.createdAt);
            return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
          })
          .reduce((acc, rev) => acc + rev.amount, 0);
        points.push(monthEarnings);
      }
    } else if (timeFilter === 'daily') {
        // Last 7 days
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayLabel = d.toLocaleString('default', { weekday: 'short' });
          labels.push(dayLabel);
          
          const dayEarnings = user.revenues
            .filter(rev => {
              const rd = new Date(rev.createdAt);
              return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth();
            })
            .reduce((acc, rev) => acc + rev.amount, 0);
          points.push(dayEarnings);
        }
    } else {
        // Just show what we have for now
        labels.push("Jan", "Feb", "Mar", "Apr", "May", "Jun");
        points.push(10, 20, 15, 30, 45, 40); // Placeholder for weekly/yearly for now
    }

    return {
      labels,
      datasets: [
        {
          fill: true,
          label: 'Revenue ($)',
          data: points,
          borderColor: 'rgb(168, 85, 247)', // Purple 500
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
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#18181b', // Zinc 900
        titleColor: '#a1a1aa', // Zinc 400
        bodyColor: '#fff',
        bodyFont: { weight: 'bold' as const },
        padding: 12,
        cornerRadius: 12,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#71717a' }, // Zinc 500
      },
      y: {
        grid: { color: 'rgba(39, 39, 42, 0.5)' }, // Zinc 800
        ticks: { 
          color: '#71717a',
          callback: (value: any) => `$${value}`
        },
      },
    },
  };

  return (
    <div className="w-full space-y-10 animate-in fade-in duration-700">
      
      {/* Header with quick stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Creator Dashboard</h1>
          <p className="text-zinc-500 text-sm font-medium">Monitoring your success and content performance.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <Link 
              href="/settings"
              className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all group"
            >
              <SettingsIcon size={20} className="text-zinc-400 group-hover:rotate-90 transition-transform duration-500" />
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
        />
        <StatCard 
          title="Total Subscribers" 
          value={(user.subscribersCount || 0).toLocaleString()} 
          trend="Paying Members" 
          trendUp={true} 
          icon={<Crown className="text-amber-500" />} 
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
      <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-purple-500/10 rounded-2xl border border-purple-500/20">
                <BarChart3 size={20} className="text-purple-500" />
             </div>
             <div>
               <h3 className="text-lg font-black uppercase tracking-tight">Revenue Analytics</h3>
               <p className="text-zinc-500 text-xs">Real-time revenue performance over time</p>
             </div>
          </div>
          
          <div className="flex items-center bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
            {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFilter === period ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
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
               <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                  <LayoutDashboard size={20} className="text-zinc-400" />
               </div>
               <div>
                 <h3 className="text-lg font-black uppercase tracking-tight">Manage Content</h3>
                 <p className="text-zinc-500 text-xs">Visibility and performance of your posts & reels</p>
               </div>
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors flex items-center gap-2">
            View All <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Posts List */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full" /> Recent Posts
              </h4>
              <div className="space-y-4">
                {user.posts.slice(0, 3).map((post) => (
                  <ContentItem key={post.id} item={post} type="post" />
                ))}
                {user.posts.length === 0 && <p className="text-zinc-600 text-xs italic">No posts found.</p>}
              </div>
          </div>

          {/* Recent Reels List */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2.5rem] p-6 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Recent Reels
              </h4>
              <div className="space-y-4">
                {user.reels.slice(0, 3).map((reel) => (
                  <ContentItem key={reel.id} item={reel} type="reel" />
                ))}
                {user.reels.length === 0 && <p className="text-zinc-600 text-xs italic">No reels found.</p>}
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sub-components
const StatCard = ({ title, value, trend, trendUp, icon }: any) => (
  <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-[2.5rem] hover:border-zinc-700 transition-all group overflow-hidden relative">
    <div className="absolute -right-4 -top-4 w-24 h-24 bg-zinc-900/10 rounded-full group-hover:scale-150 transition-transform duration-700" />
    <div className="flex justify-between items-start mb-6">
      <div className="p-3 bg-zinc-900 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div>
      <div className={`flex items-center gap-1 text-[10px] font-black p-1.5 px-3 rounded-full ${trendUp ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
        {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {trend}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-zinc-500 text-[10px] uppercase font-black tracking-widest">{title}</p>
      <p className="text-3xl font-black italic tracking-tighter" suppressHydrationWarning>{value}</p>
    </div>
  </div>
);

const ContentItem = ({ item, type }: { item: any; type: 'post' | 'reel' }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-3xl border border-zinc-900 hover:border-zinc-800 transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 relative rounded-xl overflow-hidden border border-zinc-800">
           {type === 'post' ? (
             <Image src={`/api/media/post/${item.id}`} alt="content" fill className="object-cover" unoptimized />
           ) : (
             <video src={`/api/media/reel/${item.id}`} className="w-full h-full object-cover" />
           )}
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-tight line-clamp-1">{item.caption || "Untiled Content"}</p>
          <div className="flex items-center gap-3 mt-1">
             <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest" suppressHydrationWarning>
               {new Date(item.createdAt).toLocaleDateString()}
             </span>
             {item.isPremium && <span className="text-[9px] text-amber-500 font-black px-1.5 bg-amber-500/10 rounded outline outline-1 outline-amber-500/20">$ {item.price || "Free"}</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
         <button 
           onClick={() => setIsVisible(!isVisible)}
           className={`p-2 rounded-xl border transition-all ${isVisible ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-zinc-800 border-zinc-700 text-zinc-500'}`}
         >
           {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
         </button>
         <button className="p-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded-xl hover:bg-zinc-700 transition-all">
           <MoreHorizontal size={16} />
         </button>
      </div>
    </div>
  );
};

export default CreatorDashboard;
