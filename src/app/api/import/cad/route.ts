import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { apiOk, apiError } from '@/lib/api-response';
import { z } from 'zod';
import { validateBody } from '@/lib/validations';

/**
 * POST /api/import/cad — Импорт данных из CAD-систем (Inventor/AutoCAD/SolidWorks)
 *
 * Формат запроса:
 * {
 *   "products": [
 *     {
 *       "sku": "ST0001",           // Артикул (обязательно)
 *       "name": "Токарный станок",  // Название (обязательно)
 *       "productType": "manufactured", // purchased | manufactured
 *       "basePrice": 450000,        // Базовая цена (опционально)
 *       "unit": "шт",              // Ед. измерения (опционально)
 *       "weightKg": 1200,          // Вес (опционально)
 *       "material": "Сталь",       // Материал (опционально)
 *       "categoryId": "...",       // ID категории (опционально)
 *       "modules": [
 *         {
 *           "name": "Столешница",   // Название модуля (обязательно)
 *           "article": "СТ-001",   // Артикул (опционально)
 *           "width": 1200,         // Ширина мм (опционально)
 *           "height": 50,          // Высота мм (опционально)
 *           "depth": 600,          // Глубина мм (опционально)
 *           "weight": 25,          // Вес кг (опционально)
 *           "workTypes": [
 *             {
 *               "workTypeName": "Токарная обработка", // Имя или ID
 *               "estimatedHours": 2                   // Часы
 *             }
 *           ],
 *           "materials": [
 *             {
 *               "name": "ДСП 1200x600",
 *               "quantity": 1,
 *               "unit": "шт",
 *               "isPurchased": true
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * Возвращает: { imported: number, errors: string[] }
 */

const CadMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unit: z.string().default('шт'),
  isPurchased: z.boolean().default(true),
});

const CadWorkTypeSchema = z.object({
  workTypeName: z.string().min(1),
  estimatedHours: z.number().min(0.5),
});

const CadModuleSchema = z.object({
  name: z.string().min(1),
  article: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  depth: z.number().optional(),
  weight: z.number().optional(),
  workTypes: z.array(CadWorkTypeSchema).optional(),
  materials: z.array(CadMaterialSchema).optional(),
});

const CadProductSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  productType: z.enum(['purchased', 'manufactured']).default('manufactured'),
  basePrice: z.number().min(0).optional(),
  unit: z.string().default('шт'),
  weightKg: z.number().optional(),
  material: z.string().optional(),
  categoryId: z.string().cuid().optional(),
  modules: z.array(CadModuleSchema).optional(),
});

const CadImportSchema = z.object({
  products: z.array(CadProductSchema).min(1, 'Хотя бы один товар обязателен'),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth();
    const body = await request.json();

    const validation = validateBody(body, CadImportSchema);
    if (!validation.success) return validation.error;

    const { products } = validation.data;
    const errors: string[] = [];
    let imported = 0;

    for (const productData of products) {
      try {
        const { modules, ...productFields } = productData;

        // Ищем или создаём продукт
        const existing = await prisma.product.findUnique({ where: { sku: productFields.sku } });

        let product;
        if (existing) {
          product = await prisma.product.update({
            where: { id: existing.id },
            data: productFields,
          });
        } else {
          product = await prisma.product.create({
            data: productFields,
          });
        }

        // Если есть модули — обновляем их
        if (modules && modules.length > 0) {
          // Удаляем старые модули
          await prisma.moduleMaterial.deleteMany({ where: { module: { productId: product.id } } });
          await prisma.moduleWorkType.deleteMany({ where: { module: { productId: product.id } } });
          await prisma.productModule.deleteMany({ where: { productId: product.id } });

          // Создаём новые модули
          for (let i = 0; i < modules.length; i++) {
            const mod = modules[i];

            // Ищем или создаём виды работ
            const workTypeIds: string[] = [];
            if (mod.workTypes) {
              for (const wt of mod.workTypes) {
                let workType = await prisma.workType.findFirst({
                  where: { name: wt.workTypeName },
                });
                if (!workType) {
                  workType = await prisma.workType.create({
                    data: { name: wt.workTypeName, description: wt.workTypeName, hourlyRate: 0 },
                  });
                }
                workTypeIds.push(workType.id);
              }
            }

            await prisma.productModule.create({
              data: {
                productId: product.id,
                name: mod.name,
                article: mod.article,
                width: mod.width,
                height: mod.height,
                depth: mod.depth,
                weight: mod.weight,
                sortOrder: i,
                workTypes: workTypeIds.length > 0 ? {
                  create: mod.workTypes!.map((wt, j) => ({
                    workTypeId: workTypeIds[j],
                    estimatedHours: wt.estimatedHours,
                    sortOrder: j,
                  })),
                } : undefined,
                materials: mod.materials ? {
                  create: mod.materials.map(m => ({
                    name: m.name,
                    quantity: m.quantity,
                    unit: m.unit,
                    isPurchased: m.isPurchased,
                  })),
                } : undefined,
              },
            });
          }
        }

        imported++;
      } catch (err) {
        errors.push(`${productData.sku}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return apiOk({ imported, errors }, `Импортировано ${imported} из ${products.length} товаров`);
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') return apiError('Не авторизован', 401);
    return apiError(String(error), 500);
  }
}
