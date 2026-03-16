import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from "@/app/lib/prisma";
import { Settings, MapPin, Link as LinkIcon, Heart, MessageSquare, PlusCircle } from 'lucide-react';

const ProfilePage = async () => {
  // Logic to get the current user session would go here in Phase 2
  // For now, we fetch the 'Fan' user created in your seed file to demonstrate
  const user = await prisma.user.findUnique({
    where: { email: "fan@xsocial.com" }, // Replace with session-based email later
    include: {
      posts: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: { posts: true }
      }
    }
  });

  if (!user) return <div className="p-20 text-center">User not found</div>;

  const isCreator = user.role === 'CREATOR';

  return (
    <div className="w-full min-h-screen bg-black text-white px-4 md:px-10 lg:px-16 pt-10">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12 mb-12 border-b border-zinc-900 pb-12">
        {/* Profile Image with caching optimization */}
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-950 flex-shrink-0 border border-zinc-800 flex items-center justify-center relative overflow-hidden">
           {user.image ? (
             <Image src={user.image} alt="Profile" fill className="object-cover" />
           ) : (
             <span className="text-4xl font-black text-zinc-700">
               {user.username.substring(0, 2).toUpperCase()}
             </span>
           )}
        </div>
        
        <div className="flex-1 w-full space-y-6 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <h1 className="text-3xl font-bold tracking-tight">{user.username}</h1>
            <div className="flex gap-3">
              <button className="px-8 py-2 bg-white text-black rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors">
                Edit Profile
              </button>
              
              <Link href="/settings">
                <button className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 hover:bg-zinc-800 transition-colors">
                  <Settings size={22} />
                </button>
              </Link>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-start gap-12 text-lg">
            <span><strong className="text-white">{user._count.posts}</strong> <span className="text-zinc-500 text-sm ml-1">posts</span></span>
            <span><strong className="text-white">0</strong> <span className="text-zinc-500 text-sm ml-1">followers</span></span>
            <span><strong className="text-white">0</strong> <span className="text-zinc-500 text-sm ml-1">following</span></span>
          </div>

          <div className="max-w-lg">
            <p className="font-bold text-xl text-zinc-100">{user.username}</p>
            <p className="text-zinc-400 mt-2 leading-relaxed">{user.bio || "No bio yet."}</p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 mt-4 text-zinc-500 text-xs">
              <span className="flex items-center gap-2"><MapPin size={16} /> Dubai, UAE</span>
              <a href="#" className="flex items-center gap-2 text-blue-400 hover:underline"><LinkIcon size={16} /> x-social.ai</a>
            </div>
          </div>
        </div>
      </div>

      {/* Logic for Non-Creators */}
      {!isCreator ? (
        <div className="w-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-950/50">
          <PlusCircle size={48} className="text-zinc-700 mb-4" />
          <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Ready to earn?</h2>
          <p className="text-zinc-500 text-sm mb-8 text-center px-4">Start sharing exclusive content and monetizing your profile.</p>
          <button className="px-10 py-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl font-black italic tracking-tighter uppercase hover:scale-105 transition-transform">
            Become a Creator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-6 lg:gap-8 pb-32">
          {user.posts.length > 0 ? (
            user.posts.map((post) => (
              <div key={post.id} className="group relative aspect-square bg-zinc-900/50 rounded-2xl overflow-hidden cursor-pointer border border-zinc-800/50 transition-all hover:scale-[1.02]">
                <Image 
                  src={post.imageUrl} 
                  alt="Post" 
                  fill 
                  className="object-cover" 
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-8">
                  <span className="flex items-center gap-2 font-bold text-lg"><Heart fill="white" size={24} /> 0</span>
                  <span className="flex items-center gap-2 font-bold text-lg"><MessageSquare fill="white" size={24} /> 0</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-20 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs italic">
              No posts yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;