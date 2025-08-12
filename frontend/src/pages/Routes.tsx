import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import routesService, { type PaginationMeta, type RouteEntity, type TrafficLevel } from '../services/routesService';

const Routes: React.FC = () => {
  const [items, setItems] = useState<RouteEntity[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<{ trafficLevel?: TrafficLevel; sortBy: 'createdAt' | 'distanceKm' | 'baseTimeMin'; sortOrder: 'asc' | 'desc' }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RouteEntity | null>(null);
  const [form, setForm] = useState<{ distanceKm: string; trafficLevel: TrafficLevel; baseTimeMin: string }>({ distanceKm: '', trafficLevel: 'MEDIUM', baseTimeMin: '' });
  const { showToast } = useToast();

  const canSubmit = useMemo(() => {
    const distanceKm = parseFloat(form.distanceKm) || 0;
    const baseTimeMin = parseInt(form.baseTimeMin) || 0;
    return distanceKm > 0 && baseTimeMin > 0;
  }, [form]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { routes, pagination: meta } = await routesService.list({
        page: pagination.page,
        limit: pagination.limit,
        trafficLevel: filters.trafficLevel,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setItems(routes);
      setPagination(meta);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.trafficLevel, filters.sortBy, filters.sortOrder]);

  const resetForm = () => {
    setEditing(null);
    setForm({ distanceKm: '', trafficLevel: 'MEDIUM', baseTimeMin: '' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const submitData = {
        distanceKm: parseFloat(form.distanceKm) || 0,
        trafficLevel: form.trafficLevel,
        baseTimeMin: parseInt(form.baseTimeMin) || 0
      };
      
      if (editing) {
        await routesService.update(editing.id, submitData);
        showToast('Route updated', 'success');
      } else {
        await routesService.create(submitData);
        showToast('Route created', 'success');
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = (r: RouteEntity) => {
    setEditing(r);
    setForm({ 
      distanceKm: r.distanceKm.toString(), 
      trafficLevel: r.trafficLevel, 
      baseTimeMin: r.baseTimeMin.toString() 
    });
    setShowForm(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this route?')) return;
    await routesService.remove(id);
    showToast('Route deactivated', 'warning');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Routes</h1>
          <p className="text-gray-600">Manage transportation routes</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>Add Route</button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Traffic</label>
          <select className="input-field mt-1" value={filters.trafficLevel ?? ''} onChange={(e) => setFilters((f) => ({ ...f, trafficLevel: (e.target.value || undefined) as TrafficLevel | undefined }))}>
            <option value="">All</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sort by</label>
          <select className="input-field mt-1" value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}>
            <option value="createdAt">Created</option>
            <option value="distanceKm">Distance</option>
            <option value="baseTimeMin">Base time</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Order</label>
          <select className="input-field mt-1" value={filters.sortOrder} onChange={(e) => setFilters((f) => ({ ...f, sortOrder: e.target.value as any }))}>
            <option value="desc">DESC</option>
            <option value="asc">ASC</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance (km)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Traffic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Time (min)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.distanceKm.toFixed(1)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.trafficLevel}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{r.baseTimeMin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button className="text-primary-600 hover:text-primary-900" onClick={() => onEdit(r)}>Edit</button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(r.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{isLoading ? 'Loading...' : 'No routes found'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination.totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={!pagination.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="relative top-20 mx-auto p-5 border w-[32rem] shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editing ? 'Edit Route' : 'Add Route'}</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Distance (km) <span className="text-red-500">*</span></label>
                <input type="number" min={0.1} step={0.1} className="input-field mt-1" value={form.distanceKm} onChange={(e) => setForm({ ...form, distanceKm: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Traffic</label>
                <select className="input-field mt-1" value={form.trafficLevel} onChange={(e) => setForm({ ...form, trafficLevel: e.target.value as TrafficLevel })}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Base Time (minutes) <span className="text-red-500">*</span></label>
                <input type="number" min={1} className="input-field mt-1" value={form.baseTimeMin} onChange={(e) => setForm({ ...form, baseTimeMin: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!canSubmit || isLoading || !form.distanceKm || !form.baseTimeMin}>{editing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Routes;
