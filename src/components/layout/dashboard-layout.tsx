'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { AppGuide } from '@/components/ui/app-guide';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, setUser } = useAuthStore();
  const { setTheme } = useThemeStore();
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setUser(data.data);
        } else {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [setUser, router]);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) setTheme(stored as 'light' | 'dark');
  }, [setTheme]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--background)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="lg:pl-64">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="p-4 lg:p-6">
          <Breadcrumbs />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
      <AppGuide />
    </div>
  );
}
