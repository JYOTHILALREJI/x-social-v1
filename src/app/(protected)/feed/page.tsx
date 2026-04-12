import MainFeed from '@/components/MainFeed';

// Cache the feed for 60 seconds to avoid re-fetching on every navigation.
// The feed is a server component, so this prevents redundant DB queries
// when users rapidly navigate between pages.
export const revalidate = 60;

export default function FeedPage() { return <MainFeed />; }