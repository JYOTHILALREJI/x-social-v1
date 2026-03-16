// components/Navbar.tsx
"use client";
import { Home, Search, PlayCircle, User, MessageCircle, Heart, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/auth') return null;

  const navItems = [
    { href: '/feed', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/reels', icon: PlayCircle, label: 'Reels' },
    { href: '/dating', icon: Heart, label: 'Dating' }, // New Dating Section
    { href: '/ai-companion', icon: Sparkles, label: 'AI Companion' }, // New AI Section
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-800 bg-black/90 backdrop-blur-lg px-2 py-3 
                    md:top-0 md:left-0 md:h-screen md:w-20 md:flex-col md:border-t-0 md:border-r md:py-8 lg:w-64">
      <div className="flex w-full items-center justify-around md:h-full md:flex-col md:justify-start md:gap-8 lg:items-start lg:px-6">
        
        <div className="hidden mb-10 lg:block">
          <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">X-Social</h1>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="group flex items-center gap-4 p-2 md:p-0">
              <Icon 
                className={`transition-all duration-300 group-hover:scale-110 
                ${isActive ? 'text-white' : 'text-zinc-500'}`} 
                size={28} 
              />
              <span className={`hidden lg:block text-lg transition-colors ${isActive ? 'font-bold text-white' : 'text-zinc-500 group-hover:text-white'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navbar;