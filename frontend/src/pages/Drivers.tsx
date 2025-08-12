import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from '../contexts/ToastContext';
import driversService, { type Driver, type PaginationMeta } from '../services/driversService';

// Removed unused constant

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState({ name: '', shiftHours: '', pastWeekHours: '' });
  const { showToast } = useToast();

  const canSubmit = useMemo(() => {
    const shiftHours = parseInt(form.shiftHours) || 0;
    const pastWeekHours = form.pastWeekHours.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
    return form.name.trim().length > 0 && shiftHours >= 1 && shiftHours <= 24 && pastWeekHours.length === 7;
  }, [form]);

  const fetchDrivers = async () => {
    setIsLoading(true);
    try {
      const currentPage = pagination.page;
      const currentLimit = pagination.limit;
      const { drivers: fetchedDrivers, pagination: meta } = await driversService.list({
        page: currentPage,
        limit: currentLimit,
        search,
      });
      setDrivers(fetchedDrivers);
      setPagination(meta);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, search]);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: '', shiftHours: '', pastWeekHours: '' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const submitData = {
        name: form.name.trim(),
        shiftHours: parseInt(form.shiftHours) || 0,
        pastWeekHours: form.pastWeekHours.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n))
      };
      
      if (editing) {
        await driversService.update(editing.id, submitData);
        showToast('Driver updated', 'success');
      } else {
        await driversService.create(submitData);
        showToast('Driver created', 'success');
      }
      setShowForm(false);
      resetForm();
      fetchDrivers();
    } finally {
      setIsLoading(false);
    }
  };

  const onEdit = (d: Driver) => {
    setEditing(d);
    setForm({ 
      name: d.name, 
      shiftHours: d.shiftHours.toString(), 
      pastWeekHours: d.pastWeekHours.join(', ') 
    });
    setShowForm(true);
  };

  const onDelete = async (id: number) => {
    if (!confirm('Delete this driver?')) return;
    await driversService.remove(id);
    showToast('Driver deactivated', 'warning');
    fetchDrivers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
          <p className="text-gray-600">Manage driver information and availability</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>Add Driver</button>
      </div>

      <div className="flex items-center gap-3">
        <input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field max-w-sm"
        />
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shift (hrs)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Past 7 days (hrs)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.shiftHours}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{d.pastWeekHours.join(', ')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-3">
                      <button className="text-primary-600 hover:text-primary-900" onClick={() => onEdit(d)}>Edit</button>
                      <button className="text-red-600 hover:text-red-900" onClick={() => onDelete(d.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {drivers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">{isLoading ? 'Loading...' : 'No drivers found'}</td>
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">{editing ? 'Edit Driver' : 'Add Driver'}</h3>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name <span className="text-red-500">*</span></label>
                <input className="input-field mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Shift Hours (1-24) <span className="text-red-500">*</span></label>
                <input type="number" min={1} max={24} className="input-field mt-1" value={form.shiftHours} onChange={(e) => setForm({ ...form, shiftHours: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Past 7 Days Hours (comma separated) <span className="text-red-500">*</span></label>
                <input
                  className="input-field mt-1"
                  value={form.pastWeekHours}
                  onChange={(e) => {
                    setForm({ ...form, pastWeekHours: e.target.value });
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Exactly 7 numbers expected, e.g., 8, 8, 8, 8, 8, 0, 0</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!canSubmit || isLoading || !form.name.trim() || !form.shiftHours || !form.pastWeekHours.trim()}>{editing ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
