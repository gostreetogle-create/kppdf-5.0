import { NextRequest, NextResponse } from 'next/server';
import { requireEditor } from '@/lib/auth';
import { apiError } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = 'public/uploads';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    await requireEditor();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('Файл не выбран', 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return apiError('Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF, SVG', 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError('Файл слишком большой. Максимум 10MB', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.name.split('.').pop() || 'png';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const uploadsDir = path.join(process.cwd(), UPLOAD_DIR);

    await mkdir(uploadsDir, { recursive: true });
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    const url = `/uploads/${filename}`;

    return NextResponse.json({ success: true, data: { url, filename } });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
