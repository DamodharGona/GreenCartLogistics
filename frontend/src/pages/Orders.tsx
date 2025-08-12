import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import ordersService, { type OrderEntity, type PaginationMeta } from '../services/ordersService';
import routesService from '../services/routesService';

const Orders: React.FC = () => {
  const [items, setItems] = useState<OrderEntity[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<{ routeId?: string; minValue?: number; maxValue?: number; sortBy: 'createdAt' | 'valueRs' | 'deliveryTime'; sortOrder: 'asc' | 'desc' }>({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrderEntity | null>(null);
  const [routeOptions, setRouteOptions] = useState<{ id: number; label: string }[]>([]);
  const [form, setForm] = useState<{ orderId: string; valueRs: string; routeId: string; deliveryTime: string }>({ orderId: '', valueRs: '', routeId: '', deliveryTime: '' });
  const { showToast } = useToast();

  const canSubmit = useMemo(() => {
    const valueRs = parseFloat(form.valueRs) || 0;
    const routeId = parseInt(form.routeId) || 0;
    return form.orderId.trim().length > 0 && valueRs > 0 && routeId > 0 && /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(form.deliveryTime);
  }, [form]);

  const fetchRoutesOptions = async () => {
    const { routes } = await routesService.list({ limit: 50 });
    setRouteOptions(routes.map((r) => ({ id: r.id, label: `${r.id} • ${r.distanceKm.toFixed(1)} km (${r.trafficLevel})` })));
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { orders, pagination: meta } = await ordersService.list({
        page: pagination.page,
        limit: pagination.limit,
        routeId: filters.routeId ? parseInt(filters.routeId) : undefined,
        minValue: filters.minValue,
        maxValue: filters.maxValue,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });
      setItems(orders);
      setPagination(meta);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutesOptions();
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filters.routeId, filters.minValue, filters.maxValue, filters.sortBy, filters.sortOrder]);

  const resetForm = () => {
    setEditing(null);
    setForm({ orderId: '', valueRs: '', routeId: '', deliveryTime: '' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const submitData = {
        orderId: form.orderId.trim(),
        valueRs: parseFloat(form.valueRs) || 0,
        routeId: parseInt(form.routeId) || 0,
        deliveryTime: form.deliveryTime
      };
      
      if (editing) {
        await ordersService.update(editing.id, submitData);
        showToast('Order updated', 'success');
      } else {
        await ordersService.create(submitData);
        showToast('Order created', 'success');
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = (o: OrderEntity) => {
    setEditing(o);
    setForm({ 
      orderId: o.orderId, 
      valueRs: o.valueRs.toString(), 
      routeId: o.routeId.toString(), 
      deliveryTime: o.deliveryTime 
    });
    setShowForm(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this order?')) return;
    await ordersService.remove(id);
    showToast('Order deactivated', 'warning');
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage orders and deliveries</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>Add Order</button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Route</label>
          <select className="input-field mt-1" value={filters.routeId ?? ''} onChange={(e) => setFilters((f) => ({ ...f, routeId: e.target.value || undefined }))}>
            <option value="">All</option>
            {routeOptions.map((r) => (
              <option key={r.id} value={r.id.toString()}>{r.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Min Value</label>
          <input type="number" min={0} className="input-field mt-1" value={filters.minValue ?? ''} onChange={(e) => setFilters((f) => ({ ...f, minValue: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Max Value</label>
          <input type="number" min={0} className="input-field mt-1" value={filters.maxValue ?? ''} onChange={(e) => setFilters((f) => ({ ...f, maxValue: e.target.value === '' ? undefined : Number(e.target.value) }))} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sort by</label>
          <select className="input-field mt-1" value={filters.sortBy} onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as any }))}>
            <option value="createdAt">Created</option>
            <option value="valueRs">Value</option>
            <option value="deliveryTime">Delivery time</option>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (₹)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.orderId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.valueRs.toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.routeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{o.deliveryTime}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button className="text-primary-600 hover:text-primary-900" onClick={() => onEdit(o)}>Edit</button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(o.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{isLoading ? 'Loading...' : 'No orders found'}</td>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editing ? 'Edit Order' : 'Add Order'}</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Order ID <span className="text-red-500">*</span></label>
                <input className="input-field mt-1" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Value (₹) <span className="text-red-500">*</span></label>
                <input type="number" min={0.01} step={0.01} className="input-field mt-1" value={form.valueRs} onChange={(e) => setForm({ ...form, valueRs: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Route <span className="text-red-500">*</span></label>
                <select className="input-field mt-1" value={form.routeId} onChange={(e) => setForm({ ...form, routeId: e.target.value })}>
                  <option value="">Select route</option>
                  {routeOptions.map((r) => (
                    <option key={r.id} value={r.id.toString()}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Delivery Time (HH:MM) <span className="text-red-500">*</span></label>
                <input className="input-field mt-1" value={form.deliveryTime} onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!canSubmit || isLoading || !form.orderId.trim() || !form.valueRs || !form.routeId || !form.deliveryTime}>{editing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
