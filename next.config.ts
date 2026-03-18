import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // remotePatterns is the modern, secure way to allow external images
    // Setting to ** allows images from any external domain which is required for arbitrary user input URLs
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // This allows Next.js to cache optimized images for up to 60 seconds 
    // before checking if a newer version exists
    minimumCacheTTL: 60,
  },
};

export default nextConfig;