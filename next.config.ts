import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SQLite (better-sqlite3) — предотвращает ошибки сборки в Next.js 16
  serverExternalPackages: ['better-sqlite3'],

  // Кеширование статики
  headers: async () => [
    {
      source: '/uploads/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ],

  // Оптимизация изображений
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
