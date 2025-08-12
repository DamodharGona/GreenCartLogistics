import api from './api';

export interface DashboardOverview {
  totalDrivers: number;
  totalRoutes: number;
  totalOrders: number;
  totalSimulations: number;
  averageOrderValue: number;
  totalRevenue: number;
  onTimeDeliveryRate: number;
  averageEfficiency: number;
}

export interface ProfitTrend {
  date: string;
  profit: number;
  efficiency: number;
  orderCount: number;
  simulationCount: number;
}

export interface EfficiencyMetrics {
  overallEfficiency: number;
  driverEfficiency: {
    driverId: number;
    driverName: string;
    efficiency: number;
    deliveries: number;
    onTimeRate: number;
  }[];
  routeEfficiency: {
    routeId: number;
    routeName: string;
    efficiency: number;
    orderCount: number;
    averageDeliveryTime: number;
  }[];
}

export interface DriverPerformance {
  driverId: number;
  driverName: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  onTimeRate: number;
  averageEfficiency: number;
  totalBonus: number;
  totalPenalties: number;
}

export interface RouteEfficiency {
  routeId: number;
  distanceKm: number;
  trafficLevel: string;
  baseTimeMin: number;
  averageDeliveryTime: number;
  efficiency: number;
  orderCount: number;
}

export interface DeliveryStats {
  totalOrders: number;
  averageOrderValue: number;
  totalValue: number;
  valueDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
  routeDistribution: {
    routeId: number;
    routeName: string;
    orderCount: number;
    percentage: number;
  }[];
  trafficDistribution: {
    level: string;
    orderCount: number;
    percentage: number;
  }[];
}

class AnalyticsService {
  async getDashboardOverview(): Promise<DashboardOverview> {
    const response = await api.get('/analytics/overview');
    return response.data.data;
  }

  async getProfitTrends(days = 30): Promise<ProfitTrend[]> {
    const response = await api.get(`/analytics/profit-trends?days=${days}`);
    return response.data.data;
  }

  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    const response = await api.get('/analytics/efficiency-metrics');
    return response.data.data;
  }

  async getDriverPerformance(): Promise<DriverPerformance[]> {
    const response = await api.get('/analytics/driver-performance');
    return response.data.data;
  }

  async getRouteEfficiency(): Promise<RouteEfficiency[]> {
    const response = await api.get('/analytics/route-efficiency');
    return response.data.data;
  }

  async getDeliveryStats(): Promise<DeliveryStats> {
    const response = await api.get('/analytics/delivery-stats');
    return response.data.data;
  }
}

export default new AnalyticsService();
