import {
  Product,
  Category,
  Coupon,
  User,
  PriceAlert,
  PriceHistoryPoint,
  AppNotification,
  ChatSession,
} from '@/types';
import bcrypt from 'bcryptjs';
import { FLIPKART_AMAZON_CATEGORIES, FLIPKART_AMAZON_PRODUCTS } from './flipkartAmazonProducts';

// Categories: 100% genuine categories with verified items
export const INITIAL_CATEGORIES: Category[] = FLIPKART_AMAZON_CATEGORIES;

// Products: 100% authentic, top-rated products from Flipkart and Amazon India (Zero duplicates)
export const INITIAL_PRODUCTS: Product[] = FLIPKART_AMAZON_PRODUCTS;

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'CAMPUSFIRST',
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 99,
    maxDiscount: 50,
    expiresAt: '2027-12-31T23:59:59.000Z',
    isActive: true,
    description: 'Get 20% OFF on your first campus order (orders > ₹99)',
  },
  {
    id: 'coup-2',
    code: 'HOSTEL50',
    discountType: 'fixed',
    discountValue: 30,
    minOrderValue: 99,
    expiresAt: '2027-12-31T23:59:59.000Z',
    isActive: true,
    description: 'Flat ₹30 OFF on orders above ₹99 for hostel deliveries',
  },
  {
    id: 'coup-3',
    code: 'EXAMFEST',
    discountType: 'percent',
    discountValue: 15,
    minOrderValue: 149,
    maxDiscount: 100,
    expiresAt: '2027-12-31T23:59:59.000Z',
    isActive: true,
    description: '15% OFF on all study supplies, books and electronics above ₹149',
  },
  {
    id: 'coup-4',
    code: 'FREESHIP',
    discountType: 'fixed',
    discountValue: 20,
    minOrderValue: 99,
    expiresAt: '2027-12-31T23:59:59.000Z',
    isActive: true,
    description: 'Free campus delivery coupon on any order above ₹99',
  },
];

export const INITIAL_ADMIN_USER: User & { passwordHash: string } = {
  id: 'user-admin-1',
  name: 'CampusMart Store Admin',
  email: 'admin@gmail.com',
  role: 'admin',
  phone: '+91 98765 43210',
  passwordHash: bcrypt.hashSync('AdminCampus2026!', 10),
  addresses: [
    {
      id: 'addr-admin-1',
      fullName: 'Campus Admin Office',
      phone: '+91 98765 43210',
      hostelBlock: 'Administrative Block A',
      roomNumber: 'Room 102 - Student Affairs',
      campusGate: 'Main Gate 1',
      isDefault: true,
    },
  ],
  createdAt: '2026-08-01T00:00:00.000Z',
};

export const INITIAL_CUSTOMER_USER: User & { passwordHash: string } = {
  id: 'user-janeth-1',
  name: 'Janeth Lokineni',
  email: 'janethlokineni@gmail.com',
  role: 'customer',
  phone: '+91 91009 45993',
  passwordHash: bcrypt.hashSync('Janeth2026!', 10),
  addresses: [
    {
      id: 'addr-janeth-1',
      fullName: 'Janeth Lokineni',
      phone: '+91 91009 45993',
      hostelBlock: 'Ramanujan Hall (Block 2)',
      roomNumber: 'Room 304 - North Wing',
      campusGate: 'Main Gate 1',
      isDefault: true,
    },
  ],
  createdAt: '2026-08-01T00:00:00.000Z',
};

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

export function getInitialPriceHistory(): PriceHistoryPoint[] {
  const featuredCurves: Record<string, Array<{ daysAgo: number; price: number }>> = {
    'prod-stat-1': [
      { daysAgo: 82, price: 1745 },
      { daysAgo: 55, price: 1699 },
      { daysAgo: 28, price: 1649 },
      { daysAgo: 12, price: 1599 },
      { daysAgo: 1, price: 1545 },
    ],
    'prod-stat-2': [
      { daysAgo: 70, price: 549 },
      { daysAgo: 40, price: 499 },
      { daysAgo: 18, price: 449 },
      { daysAgo: 2, price: 399 },
    ],
    'prod-aud-1': [
      { daysAgo: 85, price: 24500 },
      { daysAgo: 50, price: 23990 },
      { daysAgo: 21, price: 22990 },
      { daysAgo: 3, price: 21990 },
    ],
    'prod-mob-1': [
      { daysAgo: 75, price: 134900 },
      { daysAgo: 35, price: 131990 },
      { daysAgo: 16, price: 129990 },
      { daysAgo: 2, price: 127990 },
    ],
    'prod-dorm-1': [
      { daysAgo: 80, price: 999 },
      { daysAgo: 42, price: 899 },
      { daysAgo: 20, price: 849 },
      { daysAgo: 8, price: 749 },
      { daysAgo: 1, price: 699 },
    ],
    'prod-book-1': [
      { daysAgo: 68, price: 649 },
      { daysAgo: 34, price: 599 },
      { daysAgo: 19, price: 579 },
      { daysAgo: 6, price: 529 },
      { daysAgo: 2, price: 499 },
    ],
    'prod-groc-1': [
      { daysAgo: 60, price: 65 },
      { daysAgo: 26, price: 62 },
      { daysAgo: 10, price: 59 },
      { daysAgo: 1, price: 56 },
    ],
    'prod-groc-2': [
      { daysAgo: 62, price: 105 },
      { daysAgo: 24, price: 95 },
      { daysAgo: 4, price: 85 },
    ],
    'prod-home-1': [
      { daysAgo: 78, price: 9499 },
      { daysAgo: 44, price: 8999 },
      { daysAgo: 18, price: 8499 },
      { daysAgo: 2, price: 7999 },
    ],
  };

  const points: PriceHistoryPoint[] = [];
  for (const product of INITIAL_PRODUCTS) {
    const customCurve = featuredCurves[product.id];
    if (customCurve) {
      customCurve.forEach((pt, idx) => {
        points.push({
          id: `ph-${product.id}-${idx + 1}`,
          productId: product.id,
          price: pt.price,
          changedAt: daysAgoIso(pt.daysAgo),
        });
      });
    } else {
      const priorPrice = product.discountPercent >= 35 ? Math.round(product.price * 1.06) : product.price;
      points.push(
        {
          id: `ph-${product.id}-1`,
          productId: product.id,
          price: priorPrice,
          changedAt: daysAgoIso(60),
        },
        {
          id: `ph-${product.id}-2`,
          productId: product.id,
          price: product.price,
          changedAt: daysAgoIso(14),
        }
      );
    }
  }
  return points;
}

export function getInitialPriceAlerts(): PriceAlert[] {
  return [
    {
      id: 'alert-demo-1',
      userId: 'user-janeth-1',
      productId: 'prod-stat-1',
      priceWhenAdded: 1649,
      targetPrice: 1550,
      active: true,
      lastNotifiedPrice: 1545,
      createdAt: daysAgoIso(25),
      updatedAt: daysAgoIso(1),
    },
    {
      id: 'alert-demo-2',
      userId: 'user-janeth-1',
      productId: 'prod-dorm-1',
      priceWhenAdded: 849,
      targetPrice: 650,
      active: true,
      createdAt: daysAgoIso(18),
      updatedAt: daysAgoIso(18),
    },
    {
      id: 'alert-demo-3',
      userId: 'user-janeth-1',
      productId: 'prod-book-1',
      priceWhenAdded: 579,
      targetPrice: 450,
      active: true,
      createdAt: daysAgoIso(15),
      updatedAt: daysAgoIso(15),
    },
    {
      id: 'alert-demo-4',
      userId: 'user-admin-1',
      productId: 'prod-aud-1',
      priceWhenAdded: 23990,
      targetPrice: 21500,
      active: true,
      createdAt: daysAgoIso(20),
      updatedAt: daysAgoIso(20),
    },
  ];
}

export function getInitialNotifications(): AppNotification[] {
  const prodStat1 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-stat-1');
  const prodDorm1 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-dorm-1');
  return [
    {
      id: 'notif-demo-1',
      userId: 'user-janeth-1',
      type: 'price_drop',
      title: 'Price Drop Alert: 6% OFF!',
      message: `${prodStat1?.name ?? 'Casio fx-991CW ClassWiz'} dropped from ₹1,649 to ₹1,545 (below your ₹1,550 target)!`,
      productId: 'prod-stat-1',
      productSlug: prodStat1?.slug,
      read: false,
      createdAt: daysAgoIso(1),
    },
    {
      id: 'notif-demo-2',
      userId: 'user-janeth-1',
      type: 'price_drop',
      title: 'Watched Item Price Dropped!',
      message: `${prodDorm1?.name ?? 'Wipro Smart 9W Wi-Fi LED Bulb'} dropped from ₹849 to ₹699. Save on your hostel lighting setup!`,
      productId: 'prod-dorm-1',
      productSlug: prodDorm1?.slug,
      read: false,
      createdAt: daysAgoIso(2),
    },
  ];
}

export function getInitialChatSessions(): ChatSession[] {
  const snack1 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-groc-1');
  const snack2 = INITIAL_PRODUCTS.find((p) => p.id === 'prod-groc-2');
  const cards = [snack1, snack2]
    .filter((p): p is Product => Boolean(p))
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      mrp: p.mrp,
      discountPercent: p.discountPercent,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      category: p.category,
      brand: p.brand,
      image: p.images[0] || '',
    }));

  return [
    {
      id: 'chat-demo-janeth',
      userId: 'user-janeth-1',
      sessionKey: 'user:user-janeth-1',
      messages: [
        {
          id: 'msg-demo-1',
          role: 'user',
          content: 'Cheap hostel snacks under ₹150 for late night study?',
          createdAt: daysAgoIso(1),
        },
        {
          id: 'msg-demo-2',
          role: 'assistant',
          content:
            'Here are two top in-stock late-night hostel picks well within your ₹150 budget (bundle total: ₹141):',
          products: cards,
          bundleTotal: cards.reduce((sum, item) => sum + item.price, 0),
          createdAt: daysAgoIso(1),
        },
      ],
      createdAt: daysAgoIso(1),
      updatedAt: daysAgoIso(1),
    },
  ];
}

