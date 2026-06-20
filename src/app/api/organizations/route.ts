import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError, apiPaginated, parseSearchParams } from '@/lib/api-response';
import { CreateOrganizationSchema } from '@/lib/validations/organization';
import { validateBody } from '@/lib/validations';
import { getCached, invalidateByPrefix } from '@/lib/cache';

const CACHE_PREFIX = 'organizations';
const LIST_TTL = 30 * 1000;

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const { page, limit, search, sortField, sortOrder } = parseSearchParams(searchParams);
    const roleSlug = searchParams.get('role');

    const orderBy: Record<string, string> = {};
    if (sortField) orderBy[sortField] = sortOrder;
    else orderBy.createdAt = 'desc';

    const baseWhere: Record<string, unknown> = roleSlug
      ? { roles: { some: { slug: roleSlug } } }
      : {};

    if (search) {
      const where = {
        ...baseWhere,
        OR: ['name', 'shortName', 'inn'].map((f) => ({ [f]: { contains: search } })),
      };
      const [items, total] = await Promise.all([
        prisma.organization.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit, include: { roles: true } }),
        prisma.organization.count({ where }),
      ]);
      return apiPaginated(items, total, page, limit);
    }

    const cacheKey = `${CACHE_PREFIX}_list_${roleSlug || 'all'}_p${page}_l${limit}_s${sortField || 'createdAt'}_${sortOrder || 'desc'}`;
    const result = await getCached(cacheKey, async () => {
      const [items, total] = await Promise.all([
        prisma.organization.findMany({ where: baseWhere, orderBy, skip: (page - 1) * limit, take: limit, include: { roles: true } }),
        prisma.organization.count({ where: baseWhere }),
      ]);
      return { items, total };
    }, LIST_TTL);

    return apiPaginated(result.items, result.total, page, limit);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();
    const validation = validateBody(body, CreateOrganizationSchema);
    if (!validation.success) return validation.error;
    const { roleIds, ...orgData } = validation.data;
    const item = await prisma.organization.create({
      data: {
        ...orgData,
        roles: roleIds?.length ? { connect: roleIds.map((id: string) => ({ id })) } : undefined,
      },
      include: { roles: true },
    });
    invalidateByPrefix(CACHE_PREFIX);
    return apiOk(item);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
