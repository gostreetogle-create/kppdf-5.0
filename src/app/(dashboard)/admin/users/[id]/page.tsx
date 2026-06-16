'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, UserCheck, UserX, Mail, Phone, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  production: 'Производство',
  storekeeper: 'Кладовщик',
  accountant: 'Бухгалтер',
  viewer: 'Наблюдатель',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  production: 'bg-orange-100 text-orange-700',
  storekeeper: 'bg-green-100 text-green-700',
  accountant: 'bg-purple-100 text-purple-700',
  viewer: 'bg-gray-100 text-gray-600',
};

export default function UserViewPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`/api/users/${params.id}`);
        const data = await res.json();
        if (data.success) {
          setUser(data.data);
        } else {
          setError(data.message || 'Пользователь не найден');
        }
      } catch (e) {
        setError('Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [params.id]);

  const toggleActive = async () => {
    if (!user) return;
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      setUser({ ...user, isActive: !user.isActive });
    } catch (e) {
      console.error('Toggle active error:', e);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 text-center">
          <p className="text-[var(--destructive)]">{error || 'Пользователь не найден'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Назад к списку
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleActive}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              user.isActive
                ? 'bg-[var(--destructive)]/10 text-[var(--destructive)] hover:bg-[var(--destructive)]/20'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            {user.isActive ? 'Заблокировать' : 'Активировать'}
          </button>
          <button
            onClick={() => router.push(`/admin/users?edit=${user.id}`)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </button>
        </div>
      </div>

      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--primary)]">
                {user.displayName?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">{user.displayName || user.username}</h1>
              <p className="text-[var(--muted-foreground)]">@{user.username}</p>
            </div>
            <div className="ml-auto">
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.isActive ? 'Активен' : 'Заблокирован'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Роль</label>
              <div className="mt-1">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                  {ROLE_LABELS[user.role] || user.role}
                </span>
              </div>
            </div>

            {user.email && (
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Email</label>
                <div className="mt-1 flex items-center gap-2 text-[var(--foreground)]">
                  <Mail className="h-4 w-4 text-[var(--muted-foreground)]" />
                  {user.email}
                </div>
              </div>
            )}

            {user.phone && (
              <div>
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Телефон</label>
                <div className="mt-1 flex items-center gap-2 text-[var(--foreground)]">
                  <Phone className="h-4 w-4 text-[var(--muted-foreground)]" />
                  {user.phone}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Создан</label>
              <div className="mt-1 flex items-center gap-2 text-[var(--foreground)]">
                <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                {new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Обновлён</label>
              <div className="mt-1 flex items-center gap-2 text-[var(--foreground)]">
                <Calendar className="h-4 w-4 text-[var(--muted-foreground)]" />
                {new Date(user.updatedAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">ID</label>
              <div className="mt-1 text-[var(--foreground)] font-mono text-sm">{user.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
