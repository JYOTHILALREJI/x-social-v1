"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import StoryUploadModal from "./StoryUploadModal";
import StoryViewer, { StoryData } from "./StoryViewer";

interface StoriesBarProps {
  stories: StoryData[];
  currentUserId: string;
  isCreator: boolean;
  onStoryCreated?: () => void;
}

// SVG-based segmented ring for the story avatar
function StoryRing({
  totalSegments,
  isViewed,
  size = 64,
}: {
  totalSegments: number;
  isViewed: boolean;
  size?: number;
}) {
  const radius = (size - 6) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = totalSegments > 1 ? 3 : 0; // gap between segments in degrees
  const segmentAngle = 360 / totalSegments;

  const segments = Array.from({ length: totalSegments }, (_, i) => {
    const startAngle = i * segmentAngle - 90; // start from top
    const endAngle = startAngle + segmentAngle - gap;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);
    const largeArc = segmentAngle - gap > 180 ? 1 : 0;

    return {
      d: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
    };
  });

  return (
    <svg width={size} height={size} className="absolute inset-0 pointer-events-none">
      {segments.map((seg, i) => (
        <path
          key={i}
          d={seg.d}
          fill="none"
          stroke={isViewed ? "rgba(168,85,247,0.3)" : "url(#storyGradient)"}
          strokeWidth={3}
          strokeLinecap="round"
        />
      ))}
      <defs>
        <linearGradient id="storyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function StoriesBar({ stories, currentUserId, isCreator, onStoryCreated }: StoriesBarProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStoryIndex, setViewerStoryIndex] = useState(0);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const openStory = (idx: number) => {
    setViewerStoryIndex(idx);
    setViewerOpen(true);
  };

  // My own story (if exists)
  const myStory = stories.find(s => s.author.id === currentUserId);
  // Other stories (not mine)
  const otherStories = stories.filter(s => s.author.id !== currentUserId);
  // All in sorted order for viewer
  const allStories = [...(myStory ? [myStory] : []), ...otherStories];

  const getStoryIndex = (storyId: string) => allStories.findIndex(s => s.id === storyId);

  // Prevent hydration mismatch by only rendering the dynamic story list after mount
  if (!mounted) {
    return <div className="w-full pb-6 border-b border-border-theme mb-8 h-[104px]" />;
  }

  return (
    <>
      <div className="w-full pb-6 border-b border-border-theme mb-8">
        <div className="flex gap-5 overflow-x-auto no-scrollbar py-2 px-1">

          {/* --- CREATOR: ADD STORY logic --- */}
          {isCreator && !myStory && (
            <div className="flex flex-col items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setUploadOpen(true)}
                  className="w-16 h-16 rounded-full bg-card-bg border-2 border-dashed border-purple-500/50 flex items-center justify-center hover:border-purple-500 hover:bg-card-bg/80 transition-all group"
                >
                  <Plus size={24} className="text-purple-500 group-hover:scale-110 transition-transform" />
                </button>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-full border border-purple-500/20 animate-ping pointer-events-none" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground w-16 text-center truncate">
                Add Story
              </span>
            </div>
          )}

          {/* --- CREATOR'S OWN STORY (REPLACES + ICON IF EXISTS) --- */}
          {myStory && (
            <div className="relative">
              <StoryCircle
                story={myStory}
                label="Your Story"
                onClick={() => openStory(getStoryIndex(myStory.id))}
              />
              {/* Creator can still add new media to their streak */}
              <button
                onClick={(e) => { e.stopPropagation(); setUploadOpen(true); }}
                className="absolute bottom-6 right-0 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center border-2 border-background hover:scale-110 transition-all"
              >
                <Plus size={12} className="text-white" />
              </button>
            </div>
          )}

          {/* --- FOLLOWED CREATOR STORIES --- */}
          {otherStories.map(story => (
            <StoryCircle
              key={story.id}
              story={story}
              onClick={() => openStory(getStoryIndex(story.id))}
            />
          ))}
        </div>
      </div>

      <StoryUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        currentUserId={currentUserId}
        isUpdating={!!myStory}
        onSuccess={onStoryCreated}
      />

      {/* Viewer */}
      <AnimatePresence>
        {viewerOpen && (
          <StoryViewer
            stories={allStories}
            initialStoryIndex={viewerStoryIndex}
            currentUserId={currentUserId}
            onClose={() => {
              setViewerOpen(false);
              router.refresh();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ---- Story Circle Avatar ----
function StoryCircle({
  story,
  label,
  onClick,
}: {
  story: StoryData;
  label?: string;
  onClick: () => void;
}) {
  const totalSegments = story.media.length;
  // Use isViewed from the story data (indicates all media items are seen)
  const isViewed = story.isViewed;

  return (
    <div
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
    >
      <div className="relative w-16 h-16">
        <StoryRing totalSegments={totalSegments} isViewed={isViewed} size={64} />
        {/* Avatar */}
        <div className="absolute inset-[5px] rounded-full overflow-hidden border-2 border-background">
          <Image
            src={story.author.image || "/default_user_profile/default-avatar.png"}
            alt={story.author.username}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </div>
      <span className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground group-hover:text-foreground transition-colors text-center w-16 truncate">
        {label || story.author.name || story.author.username}
      </span>
    </div>
  );
}