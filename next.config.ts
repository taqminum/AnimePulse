import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL('https://lain.bgm.tv/**'),
      new URL('https://lain.bangumi.tv/**'),
      new URL('https://*.bgm.tv/**'),
      new URL('https://*.bangumi.tv/**'),
    ],
    minimumCacheTTL: 86400,
  },
};

export default nextConfig;
