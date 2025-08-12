// User types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Driver types
export interface CreateDriverRequest {
  name: string;
  shiftHours: number;
  pastWeekHours: number[];
}

export interface UpdateDriverRequest {
  name?: string;
  shiftHours?: number;
  pastWeekHours?: number[];
  isActive?: boolean;
}

export interface DriverResponse {
  id: number;
  name: string;
  shiftHours: number;
  pastWeekHours: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Route types
export interface CreateRouteRequest {
  distanceKm: number;
  trafficLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  baseTimeMin: number;
}

export interface UpdateRouteRequest {
  distanceKm?: number;
  trafficLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  baseTimeMin?: number;
  isActive?: boolean;
}

export interface RouteResponse {
  id: number;
  distanceKm: number;
  trafficLevel: string;
  baseTimeMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Order types
export interface CreateOrderRequest {
  orderId: string;
  valueRs: number;
  routeId: number;
  deliveryTime: string; // HH:MM format
}

export interface UpdateOrderRequest {
  orderId?: string;
  valueRs?: number;
  routeId?: number;
  deliveryTime?: string;
  isActive?: boolean;
}

export interface OrderResponse {
  id: number;
  orderId: string;
  valueRs: number;
  routeId: number;
  deliveryTime: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  route?: RouteResponse;
}

// Simulation types
export interface SimulationRequest {
  simulationName?: string;
  driverCount: number;
  routeStartTime: string; // HH:MM format
  maxHours: number;
  driverIds?: number[];
  routeIds?: number[];
}

export interface SimulationResult {
  totalProfit: number;
  efficiencyScore: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  fuelCost: number;
  penalties: number;
  bonuses: number;
  simulationData: {
    driverAssignments: DriverAssignment[];
    orderResults: OrderResult[];
    summary: SimulationSummary;
  };
}

export interface DriverAssignment {
  driverId: number;
  driverName: string;
  assignedOrders: number[];
  totalHours: number;
  efficiency: number;
}

export interface OrderResult {
  orderId: string;
  driverId: number;
  routeId: number;
  deliveryTime: string;
  actualTime: string;
  isOnTime: boolean;
  penalty: number;
  bonus: number;
  fuelCost: number;
}

export interface SimulationSummary {
  totalOrders: number;
  totalRoutes: number;
  averageEfficiency: number;
  profitMargin: number;
  recommendations: string[];
}

export interface SimulationResponse {
  id: number;
  simulationName?: string;
  driverCount: number;
  routeStartTime: string;
  maxHours: number;
  totalProfit: number;
  efficiencyScore: number;
  onTimeDeliveries: number;
  totalDeliveries: number;
  fuelCost: number;
  penalties: number;
  bonuses: number;
  simulationData: any;
  createdBy?: number;
  createdAt: Date;
}

// Analytics types
export interface DashboardOverview {
  totalDrivers: number;
  totalRoutes: number;
  totalOrders: number;
  totalSimulations: number;
  averageEfficiency: number;
  totalProfit: number;
  recentSimulations: SimulationResponse[];
}

export interface ProfitTrends {
  date: string;
  profit: number;
  efficiency: number;
  orderCount: number;
}

export interface DriverPerformance {
  driverId: number;
  driverName: string;
  totalDeliveries: number;
  onTimeDeliveries: number;
  efficiency: number;
  totalHours: number;
}

// Pagination types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
  };
}
