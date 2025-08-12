import api from './api';

export type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RouteEntity {
  id: number;
  distanceKm: number;
  trafficLevel: TrafficLevel;
  baseTimeMin: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoutesListParams {
  page?: number;
  limit?: number;
  trafficLevel?: TrafficLevel;
  sortBy?: 'distanceKm' | 'baseTimeMin' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

class RoutesService {
  async list(params: RoutesListParams = {}) {
    const { page = 1, limit = 10, trafficLevel, sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const url = new URL('/routes', window.location.origin);
    url.searchParams.set('page', String(page));
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('sortBy', sortBy);
    url.searchParams.set('sortOrder', sortOrder);
    if (trafficLevel) url.searchParams.set('trafficLevel', trafficLevel);

    const response = await api.get(url.pathname + url.search);
    const raw = response.data ?? {};
    const routes: RouteEntity[] = (raw.data ?? []).map((r: any) => ({
      id: Number(r.id),
      distanceKm: Number(r.distanceKm ?? 0),
      trafficLevel: (r.trafficLevel ?? 'LOW') as TrafficLevel,
      baseTimeMin: Number(r.baseTimeMin ?? 0),
      isActive: Boolean(r.isActive ?? true),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
    }));
    const pagination: PaginationMeta = raw.pagination ?? {
      page,
      limit,
      total: routes.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: page > 1,
    };
    return { routes, pagination };
  }

  async get(id: number): Promise<RouteEntity> {
    const response = await api.get(`/routes/${id}`);
    const r = response.data?.data ?? {};
    return {
      id: Number(r.id),
      distanceKm: Number(r.distanceKm ?? 0),
      trafficLevel: (r.trafficLevel ?? 'LOW') as TrafficLevel,
      baseTimeMin: Number(r.baseTimeMin ?? 0),
      isActive: Boolean(r.isActive ?? true),
      createdAt: String(r.createdAt ?? new Date().toISOString()),
    };
  }

  async create(body: { distanceKm: number; trafficLevel: TrafficLevel; baseTimeMin: number }): Promise<RouteEntity> {
    const response = await api.post('/routes', body);
    return response.data?.data;
  }

  async update(id: number, body: Partial<{ distanceKm: number; trafficLevel: TrafficLevel; baseTimeMin: number; isActive: boolean }>): Promise<RouteEntity> {
    const response = await api.put(`/routes/${id}`, body);
    return response.data?.data;
  }

  async remove(id: number): Promise<void> {
    await api.delete(`/routes/${id}`);
  }
}

export default new RoutesService();


