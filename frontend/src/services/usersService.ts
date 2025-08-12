import api from './api';

export interface UserEntity {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

class UsersService {
  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    const { page = 1, limit = 10, search = '' } = params;
    const res = await api.get(`/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
    return res.data;
  }

  async create(body: { username: string; email: string; password: string; role?: 'ADMIN' | 'MANAGER' }) {
    const res = await api.post('/users', body);
    return res.data;
  }

  async update(id: number, body: Partial<{ email: string; role: 'ADMIN' | 'MANAGER'; password: string; isActive: boolean }>) {
    const res = await api.put(`/users/${id}`, body);
    return res.data;
  }

  async deactivate(id: number) {
    const res = await api.delete(`/users/${id}`);
    return res.data;
  }
}

export default new UsersService();


