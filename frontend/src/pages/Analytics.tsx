import React, { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import analyticsService from '../services/analyticsService';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Analytics: React.FC = () => {
  const [rangeDays, setRangeDays] = useState(30);
  const [trends, setTrends] = useState<any[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const [t, stats] = await Promise.all([
        analyticsService.getProfitTrends(rangeDays),
        analyticsService.getDeliveryStats(),
      ]);
      setTrends(t.map((d) => ({ date: d.date, profit: Number(d.profit ?? 0) })));
      setDeliveryStats(stats);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  const valuePieData = useMemo(() => deliveryStats?.valueDistribution ?? [], [deliveryStats]);

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows?.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600">Insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-700">Range</label>
          <select className="input-field" value={rangeDays} onChange={(e) => setRangeDays(Number(e.target.value))}>
            <option value={7}>7 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
      </div>

      <div className="card">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Order Value Distribution</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={valuePieData} dataKey="count" nameKey="range" cx="50%" cy="50%" outerRadius={100} label>
                  {valuePieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-secondary" onClick={() => exportCSV(valuePieData, 'order-value-distribution.csv')}>Export CSV</button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-4">Daily Delivered vs. Delayed</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(deliveryStats?.daily ?? []).map((d: any) => ({ date: d.date, delivered: Number(d.delivered || 0), delayed: Number(d.delayed || 0) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="delayed" stroke="#EF4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="btn-secondary" onClick={() => exportCSV(deliveryStats?.daily ?? [], 'delivery-stats.csv')}>Export CSV</button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-gray-500">Loading analytics…</div>
      )}
    </div>
  );
};

export default Analytics;
