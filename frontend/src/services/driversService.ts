import api from './api';

export interface Driver {
  id: number;
  name: string;
  shiftHours: number;
  pastWeekHours: number[];
  isActive: boolean;
  createdAt: string;
}

export interface DriverUpsertRequest {
  name: string;
  shiftHours: number;
  pastWeekHours: number[]; // length 7
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

class DriversService {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: 'name' | 'shiftHours' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = params;
    const response = await api.get(
      `/drivers?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}&sortBy=${sortBy}&sortOrder=${sortOrder}`
    );
    const raw = response.data ?? {};
    const drivers: Driver[] = (raw.data ?? []).map((d: any) => ({
      id: Number(d.id),
      name: String(d.name ?? ''),
      shiftHours: Number(d.shiftHours ?? 0),
      pastWeekHours: Array.isArray(d.pastWeekHours) ? d.pastWeekHours.map((n: any) => Number(n)) : [],
      isActive: Boolean(d.isActive ?? true),
      createdAt: String(d.createdAt ?? new Date().toISOString()),
    }));
    const pagination: PaginationMeta = raw.pagination ?? {
      page,
      limit,
      total: drivers.length,
      totalPages: 1,
      hasNext: false,
      hasPrev: page > 1,
    };
    return { drivers, pagination };
  }

  async get(id: number): Promise<Driver> {
    const response = await api.get(`/drivers/${id}`);
    const d = response.data?.data ?? {};
    return {
      id: Number(d.id),
      name: String(d.name ?? ''),
      shiftHours: Number(d.shiftHours ?? 0),
      pastWeekHours: Array.isArray(d.pastWeekHours) ? d.pastWeekHours.map((n: any) => Number(n)) : [],
      isActive: Boolean(d.isActive ?? true),
      createdAt: String(d.createdAt ?? new Date().toISOString()),
    };
  }

  async create(body: DriverUpsertRequest): Promise<Driver> {
    const response = await api.post('/drivers', body);
    return response.data?.data;
  }

  async update(id: number, body: Partial<DriverUpsertRequest> & { isActive?: boolean }): Promise<Driver> {
    const response = await api.put(`/drivers/${id}`, body);
    return response.data?.data;
  }

  async remove(id: number): Promise<void> {
    await api.delete(`/drivers/${id}`);
  }
}

export default new DriversService();


