import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns is the modern, secure way to allow external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'v1.bg.ot7.me', // For your Reels video thumbnails/placeholders
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'share.google',
        pathname: '**',
      },
    ],
    // This allows Next.js to cache optimized images for up to 60 seconds 
    // before checking if a newer version exists
    minimumCacheTTL: 60,
  },
};

export default nextConfig;