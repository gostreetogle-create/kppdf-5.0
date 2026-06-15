'use client';

import { useAuthStore } from '@/stores/auth-store';
import { useThemeStore } from '@/stores/theme-store';
import { Menu, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-sm px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          aria-label="Меню"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
          aria-label="Переключить тему"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-[var(--muted-foreground)]" />
          ) : (
            <Moon className="h-5 w-5 text-[var(--muted-foreground)]" />
          )}
        </button>

        {/* User menu */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--muted)] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-sm font-medium text-[var(--primary)]">
                {user.displayName?.charAt(0) || user.username.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{user.displayName || user.username}</span>
              <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-1">
                  <div className="px-3 py-2 border-b border-[var(--border)]">
                    <p className="text-sm font-medium">{user.displayName || user.username}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{user.role}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--destructive)] hover:bg-[var(--muted)]"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
