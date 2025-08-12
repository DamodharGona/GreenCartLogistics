import {
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapIcon,
  PlayIcon,
  ShoppingBagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import analyticsService, { type DashboardOverview, type DeliveryStats, type ProfitTrend } from '../services/analyticsService';

const Dashboard: React.FC = () => {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [profitTrends, setProfitTrends] = useState<ProfitTrend[]>([]);
  const [deliveryStats, setDeliveryStats] = useState<DeliveryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<{ averageEfficiency: number; onTimeRate: number } | null>(null);
  const [valuePieData, setValuePieData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [overviewData, trendsData, statsData, efficiencyData] = await Promise.all([
          analyticsService.getDashboardOverview(),
          analyticsService.getProfitTrends(7),
          analyticsService.getDeliveryStats(),
          analyticsService.getEfficiencyMetrics(),
        ]);
        
        setOverview(overviewData);
        setProfitTrends(trendsData);
        setDeliveryStats(statsData);
        setMetrics({
          averageEfficiency: Number((efficiencyData as any)?.averageEfficiency ?? 0),
          onTimeRate: Number((efficiencyData as any)?.onTimeRate ?? 0),
        });
        const pie = (statsData?.valueDistribution || []).map((d) => ({ name: (d as any).label ?? (d as any).range ?? 'N/A', value: Number((d as any).count ?? 0) }));
        setValuePieData(pie);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Total Drivers',
      value: overview?.totalDrivers || 0,
      icon: TruckIcon,
      color: 'bg-blue-500',
      link: '/drivers',
    },
    {
      title: 'Total Routes',
      value: overview?.totalRoutes || 0,
      icon: MapIcon,
      color: 'bg-green-500',
      link: '/routes',
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders || 0,
      icon: ShoppingBagIcon,
      color: 'bg-purple-500',
      link: '/orders',
    },
    {
      title: 'Simulations',
      value: overview?.totalSimulations || 0,
      icon: PlayIcon,
      color: 'bg-orange-500',
      link: '/simulations',
    },
  ];

  const performanceCards = [
    {
      title: 'On-Time Delivery Rate',
      value: `${(metrics?.onTimeRate || 0).toFixed(1)}%`,
      icon: ClockIcon,
      color: 'text-green-600',
    },
    {
      title: 'Average Efficiency',
      value: `${(metrics?.averageEfficiency || 0).toFixed(1)}%`,
      icon: ChartBarIcon,
      color: 'text-blue-600',
    },
    {
      title: 'Total Revenue',
      value: `₹${Number(deliveryStats?.totalValue || 0).toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-green-600',
    },
    {
      title: 'Average Order Value',
      value: `₹${Number(deliveryStats?.averageOrderValue || 0).toLocaleString()}`,
      icon: ChartBarIcon,
      color: 'text-purple-600',
    },
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to GreenCart Logistics management dashboard</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((card) => (
          <Link key={card.title} to={card.link} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card) => (
          <div key={card.title} className="card">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-gray-100">
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profit Trends Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trends (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profitTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="profit" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Stats Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Value Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={valuePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(d: any) => `${d.name}: ${((d.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {valuePieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/simulations"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <PlayIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Run Simulation</p>
              <p className="text-sm text-gray-600">Test delivery scenarios</p>
            </div>
          </Link>
          
          <Link
            to="/analytics"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <ChartBarIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Detailed performance insights</p>
            </div>
          </Link>
          
          <Link
            to="/orders"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <ShoppingBagIcon className="h-8 w-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Manage Orders</p>
              <p className="text-sm text-gray-600">View and update orders</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
