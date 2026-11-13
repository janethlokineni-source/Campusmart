import { NextRequest, NextResponse } from 'next/server';
import { DataStore } from '@/lib/dataStore';
import { getUserFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin authorization required' }, { status: 403 });
    }

    const orders = await DataStore.getOrders();
    const { products } = await DataStore.getProducts({ limit: 500 });
    const settings = await DataStore.getStoreSettings();
    const alertDemandStats = await DataStore.getAlertDemandStats();

    const totalRevenue = orders
      .filter((o) => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.orderStatus === 'delivered').length;
    const activeOrders = orders.filter((o) => ['placed', 'confirmed', 'packed', 'out_for_delivery'].includes(o.orderStatus)).length;
    const lowStockProducts = products.filter((p) => p.stock < 10);

    // Sales by day (recent)
    const salesByDay: Record<string, number> = {};
    for (const ord of orders) {
      if (ord.orderStatus !== 'cancelled') {
        const day = ord.createdAt.split('T')[0];
        salesByDay[day] = (salesByDay[day] || 0) + ord.totalAmount;
      }
    }

    const users = await DataStore.getUsers();
    const registeredStudents = users.filter((u) => u.role !== 'admin').length;
    const totalActivePriceAlerts = Object.values(alertDemandStats).reduce(
      (sum, item) => sum + item.activeAlertsCount,
      0
    );

    return NextResponse.json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        deliveredOrders,
        activeOrders,
        totalProducts: products.length,
        lowStockCount: lowStockProducts.length,
        registeredStudents,
        totalActivePriceAlerts,
        alertDemandStats,
        salesByDay,
        recentOrders: orders.slice(0, 5),
        lowStockProducts: lowStockProducts.slice(0, 5),
      },
      settings,
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}

