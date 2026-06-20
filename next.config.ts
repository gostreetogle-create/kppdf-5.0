import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Кеширование статики
  headers: async () => [
    {
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    }
  ],

  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
