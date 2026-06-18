import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './db';

// В production JWT_SECRET обязан быть задан через process.env
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}
const JWT_SECRET_FINAL = JWT_SECRET || 'kppdf-dev-secret-key-change-in-production';
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface JwtPayload {
  userId: string;
  username: string;
  role: string;
  tokenVersion?: number;
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET_FINAL, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): string {
  // Включаем tokenVersion для возможности инвалидации старых refresh-токенов
  return jwt.sign({ ...payload, tokenVersion: payload.tokenVersion || 0 }, JWT_SECRET_FINAL, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET_FINAL) as JwtPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, displayName: true, email: true, phone: true, role: true, isActive: true },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function requireRole(roles: string[]) {
  const user = await requireAuth();
  if (!roles.includes(user.role) && user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user;
}

/** Блокирует мутирующие операции (DELETE/PUT/POST) для роли viewer */
export async function requireEditor() {
  const user = await requireAuth();
  if (user.role === 'viewer') {
    throw new Error('FORBIDDEN');
  }
  return user;
}
