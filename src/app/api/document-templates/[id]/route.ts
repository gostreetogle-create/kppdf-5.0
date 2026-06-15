import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const item = await prisma.documentTemplate.findUnique({
      where: { id },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    if (!item) return apiError('Не найдено', 404);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const { name, description, docTypeId, pageSize, backgroundOpacity, isDefault, organizationId, blocks } = body;

    if (!name?.trim()) return apiError('Название обязательно', 400);

    await prisma.documentTemplate.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description || null,
        docTypeId: docTypeId || null,
        pageSize: pageSize || 'A4',
        backgroundOpacity: typeof backgroundOpacity === 'number' ? backgroundOpacity : 1,
        isDefault: !!isDefault,
        organizationId: organizationId || null,
      },
    });

    if (blocks) {
      await prisma.templateBlock.deleteMany({ where: { templateId: id } });
      if (blocks.create) {
        await prisma.templateBlock.createMany({
          data: blocks.create.map((b: Record<string, unknown>, i: number) => ({
            templateId: id,
            type: String(b.type || 'text'),
            order: i,
            title: b.title ? String(b.title) : null,
            content: b.content ? String(b.content) : null,
            height: typeof b.height === 'number' ? b.height : null,
            showLine: !!b.showLine,
            settings: b.settings ? JSON.stringify(b.settings) : null,
          })),
        });
      }
    }

    const updated = await prisma.documentTemplate.findUnique({
      where: { id },
      include: { docType: true, blocks: { orderBy: { order: 'asc' } } },
    });

    return apiOk(updated);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAuth();
    const { id } = await params;
    await prisma.documentTemplate.delete({ where: { id } });
    return apiOk({ deleted: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
