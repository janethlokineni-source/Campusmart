import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const sort = searchParams.get('sort') || undefined;
    const isCafeteriaParam = searchParams.get('isCafeteria');
    const isCafeteria = isCafeteriaParam !== null ? isCafeteriaParam === 'true' : undefined;
    const inStockOnly = searchParams.get('inStockOnly') === 'true';
    const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
    const rating = searchParams.get('rating') ? Number(searchParams.get('rating')) : undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : 1;
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 24;

    const result = await DataStore.getProducts({
      category,
      search,
      sort,
      isCafeteria,
      inStockOnly,
      minPrice,
      maxPrice,
      rating,
      page,
      limit,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch products' }, { status: 500 });
  }
}

const ProductSchema = z.object({
  name: z.string().min(3),
  slug: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  mrp: z.number().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
  category: z.string().min(1),
  brand: z.string().default('CampusMart'),
  rating: z.number().min(0).max(5).default(4.5),
  reviewCount: z.number().default(0),
  images: z.array(z.string()).min(1),
  model3dUrl: z.string().optional(),
  model3dType: z.enum(['glb', 'procedural-headphones', 'procedural-laptop', 'procedural-bottle', 'procedural-backpack', 'procedural-cup']).optional(),
  stock: z.number().int().min(0).default(10),
  specs: z.record(z.string()).default({}),
  tags: z.array(z.string()).default([]),
  isCafeteria: z.boolean().default(false),
  isVeg: z.boolean().default(true),
  badge: z.enum(['Best Seller', 'Deal of the Day', 'Campus Choice', 'Trending', 'Fresh Arrival']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
    }

    const body = await req.json();
    const validated = ProductSchema.parse(body);

    const newProduct = await DataStore.createProduct(validated);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.errors || err?.message || 'Invalid product payload' }, { status: 400 });
  }
}

