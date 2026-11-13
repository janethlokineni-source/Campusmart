import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';

const ProductUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(200).optional(),
    slug: z.string().trim().min(2).max(200).optional(),
    description: z.string().trim().max(4000).optional(),
    price: z.number().finite().positive().optional(),
    mrp: z.number().finite().positive().optional(),
    discountPercent: z.number().finite().min(0).max(99).optional(),
    category: z.string().trim().min(1).max(80).optional(),
    brand: z.string().trim().min(1).max(80).optional(),
    stock: z.number().int().min(0).optional(),
    images: z.array(z.string().trim().min(1)).max(12).optional(),
    model3dUrl: z.string().trim().optional(),
    model3dType: z
      .enum([
        'glb',
        'procedural-headphones',
        'procedural-laptop',
        'procedural-bottle',
        'procedural-backpack',
        'procedural-cup',
        'procedural-jacket',
      ])
      .optional(),
    isCafeteria: z.boolean().optional(),
    isVeg: z.boolean().optional(),
    badge: z
      .enum([
        'Best Seller',
        'Deal of the Day',
        'Campus Choice',
        'Trending',
        'Fresh Arrival',
        'Amazon Choice',
        'Flipkart Assured',
      ])
      .optional(),
    tags: z.array(z.string().trim().max(50)).max(25).optional(),
    specs: z.record(z.string(), z.string()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one product field must be provided for update.',
  });

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await DataStore.getProductByIdOrSlug(params.id);
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    // Related products from same category
    const relatedResult = await DataStore.getProducts({
      category: product.category,
      limit: 6,
    });
    const related = relatedResult.products.filter((p) => p.id !== product.id).slice(0, 4);

    return NextResponse.json({
      success: true,
      product,
      related,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load product';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const rawBody: unknown = await req.json();
    const parsed = ProductUpdateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || 'Invalid product update payload.',
        },
        { status: 400 }
      );
    }

    const updated = await DataStore.updateProduct(params.id, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update failed';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const deleted = await DataStore.deleteProduct(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Delete failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

