import test from 'node:test';
import assert from 'node:assert/strict';

function isValidSupabaseUrl(url) {
  const lower = (url || '').trim().toLowerCase();
  if (
    !lower ||
    lower.includes('your_supabase') ||
    lower.includes('your-project-ref') ||
    lower.includes('example.supabase.co')
  ) {
    return false;
  }
  try {
    const parsed = new URL(url.trim());
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function mapProductRowRoundTrip(product) {
  const row = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    discount_percent: product.discountPercent,
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    review_count: product.reviewCount,
    images: product.images,
    model3d_url: product.model3dUrl ?? null,
    model3d_type: product.model3dType ?? null,
    stock: product.stock,
    specs: product.specs,
    tags: product.tags,
    is_cafeteria: product.isCafeteria ?? false,
    is_veg: product.isVeg ?? null,
    badge: product.badge ?? null,
    created_at: product.createdAt,
  };

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: Number(row.price),
    mrp: Number(row.mrp),
    discountPercent: Number(row.discount_percent ?? 0),
    category: row.category,
    brand: row.brand,
    rating: Number(row.rating ?? 4.5),
    reviewCount: Number(row.review_count ?? 0),
    images: Array.isArray(row.images) ? row.images : [],
    model3dUrl: row.model3d_url ?? undefined,
    model3dType: row.model3d_type ?? undefined,
    stock: Number(row.stock ?? 0),
    specs: row.specs ?? {},
    tags: Array.isArray(row.tags) ? row.tags : [],
    isCafeteria: row.is_cafeteria ?? undefined,
    isVeg: row.is_veg ?? undefined,
    badge: row.badge ?? undefined,
    createdAt: row.created_at,
  };
}

test('Supabase URL validator rejects placeholders and accepts real Supabase HTTPS URLs', () => {
  assert.equal(isValidSupabaseUrl(''), false);
  assert.equal(isValidSupabaseUrl('https://your-project-ref.supabase.co'), false);
  assert.equal(isValidSupabaseUrl('not-a-url'), false);
  assert.equal(isValidSupabaseUrl('https://abcdefghijklmno.supabase.co'), true);
});

test('Supabase Product row mapper preserves camelCase domain fields and numeric types cleanly', () => {
  const sample = {
    id: 'prod-1',
    name: 'Campus Flask',
    slug: 'campus-flask',
    description: 'Insulated steel bottle',
    price: 599,
    mrp: 799,
    discountPercent: 25,
    category: 'dorm-living',
    brand: 'Solimo',
    rating: 4.7,
    reviewCount: 12,
    images: ['https://example.com/a.jpg'],
    model3dType: 'procedural-bottle',
    stock: 15,
    specs: { Capacity: '1L' },
    tags: ['flask', 'hostel'],
    isCafeteria: false,
    badge: 'Campus Choice',
    createdAt: '2026-11-11T00:00:00.000Z',
  };

  const mapped = mapProductRowRoundTrip(sample);
  assert.equal(mapped.id, sample.id);
  assert.equal(mapped.price, 599);
  assert.equal(mapped.discountPercent, 25);
  assert.equal(mapped.model3dType, 'procedural-bottle');
  assert.deepEqual(mapped.specs, { Capacity: '1L' });
  assert.deepEqual(mapped.tags, ['flask', 'hostel']);
  assert.equal(mapped.badge, 'Campus Choice');
});

