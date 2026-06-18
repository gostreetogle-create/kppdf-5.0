import { NextRequest } from 'next/server';
import { requireEditor } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(request: NextRequest) {
  try {
    await requireEditor();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('Файл не передан', 400);
    }

    if (file.size > MAX_SIZE) {
      return apiError('Файл слишком большой (максимум 10MB)', 400);
    }

    // Валидация расширения файла
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'dwg', 'dxf'];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return apiError(`Недопустимый тип файла. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`, 400);
    }

    // Дополнительная проверка MIME-типа
    const ALLOWED_MIME_TYPES = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      '',  // браузер может не передавать MIME
    ];
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return apiError(`Недопустимый MIME-тип: ${file.type}`, 400);
    }

    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    await writeFile(filepath, buffer);

    return apiOk({
      url: `/uploads/${filename}`,
      filename,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    if (error instanceof Error && error.message === 'FORBIDDEN') return apiError('Доступ запрещён', 403);
    return apiError(String(error), 500);
  }
}
