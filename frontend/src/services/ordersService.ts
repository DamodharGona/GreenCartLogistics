import api from './api';

export type OrderStatus = 'PENDING' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

export interface OrderEntity {
  id: number;
  orderId: string;
  valueRs: number;
  routeId: number;
  deliveryTime: string; // HH:MM
  isActive: boolean;
  createdAt: string;
  route?: { id: number } & Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface OrdersListParams {
  page?: number;
  limit?: number;
  routeId?: number;
  minValue?: number;
  maxValue?: number;
  sortBy?: 'valueRs' | 'deliveryTime' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

class OrdersService {
  async list(params: OrdersListParams = {}) {
    const { page = 1, limit = 10, routeId, minValue, maxValue, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const url = new URL('/orders', window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);
    if (routeId) url.searchParams.set('routeId', String(routeId));
    if (minValue !== undefined) url.searchParams.set('minValue', String(minValue));
    if (maxValue !== undefined) url.searchParams.set('maxValue', String(maxValue));

    const response = await api.get(url.pathname + url.search);
    const raw = response.data ?? {};
    const orders: OrderEntity[] = (raw.data ?? []).map((o: any) => ({
      id: Number(o.id),
      orderId: String(o.orderId ?? ''),
      valueRs: Number(o.valueRs ?? 0),
      routeId: Number(o.routeId ?? 0),
      deliveryTime: String(o.deliveryTime ?? '00:00'),
      isActive: Boolean(o.isActive ?? true),
      createdAt: String(o.createdAt ?? new Date().toISOString()),
      route: o.route,
    }));
    const pagination: PaginationMeta = raw.pagination ?? { page, limit, total: orders.length, totalPages: 1 };
    return { orders, pagination };
  }

  async get(id: number): Promise<OrderEntity> {
    const response = await api.get(`/orders/${id}`);
    const o = response.data?.data ?? {};
    return {
      id: Number(o.id),
      orderId: String(o.orderId ?? ''),
      valueRs: Number(o.valueRs ?? 0),
      routeId: Number(o.routeId ?? 0),
      deliveryTime: String(o.deliveryTime ?? '00:00'),
      isActive: Boolean(o.isActive ?? true),
      createdAt: String(o.createdAt ?? new Date().toISOString()),
      route: o.route,
    };
  }

  async create(body: { orderId: string; valueRs: number; routeId: number; deliveryTime: string }): Promise<OrderEntity> {
    const response = await api.post('/orders', body);
    return response.data?.data;
  }

  async update(id: number, body: Partial<{ orderId: string; valueRs: number; routeId: number; deliveryTime: string; isActive: boolean }>): Promise<OrderEntity> {
    const response = await api.put(`/orders/${id}`, body);
    return response.data?.data;
  }

  async remove(id: number): Promise<void> {
    await api.delete(`/orders/${id}`);
  }
}

export default new OrdersService();


