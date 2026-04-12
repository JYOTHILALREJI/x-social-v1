// components/Navbar.tsx
"use client";
import { Home, Search, PlayCircle, User, MessageCircle, Heart, Sparkles, BellRing } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getSessionUserId, getUnreadNotificationCount } from '@/app/actions/security-actions';
import { useSocket } from '@/hooks/useSocket';

const Navbar = () => {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const { on, throttleAction } = useSocket();

  useEffect(() => {
    let hasInitiallyChecked = false;
    const checkNotifications = async () => {
      // Avoid redundant checks if we just did one (simple client-side throttle)
      const userId = await getSessionUserId();
      if (userId) {
        const res = await getUnreadNotificationCount(userId);
        if (res.success) {
          setUnreadCount(res.count);
        }
      }
    };

    // Initial check (only once per mount)
    if (!hasInitiallyChecked) {
      checkNotifications();
      hasInitiallyChecked = true;
    }
    
    // Listen for real-time notification events via SSE
    const unsubNotification = on('notification', () => {
      checkNotifications(); 
    });

    const unsubMessage = on('new_message', () => {
      checkNotifications();
    });

    const handleUpdate = () => checkNotifications();
    window.addEventListener('notifications-updated', handleUpdate);
    
    return () => {
      window.removeEventListener('notifications-updated', handleUpdate);
      unsubNotification();
      unsubMessage();
    };
  }, [on]);

  if (pathname === '/' || pathname === '/auth') return null;

  const navItems = [
    { href: '/feed', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/reels', icon: PlayCircle, label: 'Reels' },
    { href: '/dating', icon: Heart, label: 'Dating' },
    { href: '/ai-companion', icon: Sparkles, label: 'AI Companion' },
    { href: '/messages', icon: MessageCircle, label: 'Messages' },
    { href: '/notifications', icon: BellRing, label: 'Notifications' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-[100] w-full border-t border-border-theme bg-nav-bg/90 backdrop-blur-lg px-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 
                    md:top-0 md:left-0 md:h-[100dvh] md:w-20 md:flex-col md:border-t-0 md:border-r md:py-8 lg:w-64 transition-colors duration-300">
      <div className="flex w-full items-center justify-around md:h-full md:flex-col md:justify-start md:gap-8 lg:items-start lg:px-6">
        
        <div className="hidden mb-10 lg:block">
          <h1 className="text-2xl font-black tracking-tighter text-foreground uppercase italic">X-Social</h1>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="group flex items-center gap-4 p-2 md:p-0 relative">
              <div className="relative">
                <Icon 
                  className={`transition-all duration-300 group-hover:scale-110 
                  ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} 
                  size={28} 
                />
                {item.href === '/notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-background animate-pulse shadow-lg shadow-yellow-400/50" />
                )}
              </div>
              <span className={`hidden lg:block text-lg transition-colors ${isActive ? 'font-bold text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
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