import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { signAccessToken, signRefreshToken } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { checkRateLimit, recordFailure, resetAttempts } from '@/lib/rate-limit';
import { isProd } from '@/lib/env';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return apiError('Введите логин и пароль');
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!(await checkRateLimit(ip, username))) {
      return apiError('Слишком много попыток. Попробуйте через 5 минут.', 429);
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !user.isActive) {
      await recordFailure(ip, username);
      return apiError('Неверный логин или пароль', 401);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      await recordFailure(ip, username);
      return apiError('Неверный логин или пароль', 401);
    }

    await resetAttempts(ip, username);

    const payload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ ...payload, tokenVersion: user.refreshTokenVersion });

    const response = apiOk({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
      accessToken,
    });

    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    });

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch {
    return apiError('Ошибка сервера', 500);
  }
}

export async function DELETE() {
  const response = apiOk(null);
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  return response;
}
