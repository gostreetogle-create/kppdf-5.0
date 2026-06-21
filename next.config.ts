import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone сборка для Docker
  output: 'standalone',

  // Удаление console.log/debug в продакшене, но сохраняем warn/error для мониторинга
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
      ? { exclude: ['error', 'warn'] }
      : false,
  },

  // Tree-shaking для тяжёлых пакетов — только используемые импорты попадают в бандл
  experimental: {
    optimizePackageImports: [
      'lucide-react',       // ~20 KB вместо ~200 KB
      'date-fns',            // только используемые функции
      '@radix-ui/react-slot',
      '@radix-ui/react-accordion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-tooltip',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      'react-resizable-panels',
    ],
  },

  // Кеширование статики
  headers: async () => [
    {
      source: '/uploads/:path*',
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
