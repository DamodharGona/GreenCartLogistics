import api from './api';

export interface SimulationRequest {
  driverCount: number;
  routeStartTime: string;
  maxHours: number;
  simulationName?: string;
}

export interface SimulationResult {
  id: number;
  simulationName: string;
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
  createdAt: string;
  createdBy?: number;
}

export interface SimulationComparison {
  simulation1: {
    id: number;
    name: string;
    profit: number;
    efficiency: number;
    onTimeRate: number;
    fuelCost: number;
    penalties: number;
    bonuses: number;
  };
  simulation2: {
    id: number;
    name: string;
    profit: number;
    efficiency: number;
    onTimeRate: number;
    fuelCost: number;
    penalties: number;
    bonuses: number;
  };
  differences: {
    profit: number;
    efficiency: number;
    onTimeRate: number;
    fuelCost: number;
    penalties: number;
    bonuses: number;
  };
  recommendations: string[];
}

class SimulationService {
  async runSimulation(request: SimulationRequest): Promise<SimulationResult> {
    const response = await api.post('/simulations/run', request);
    return response.data.data;
  }

  async getSimulations(page = 1, limit = 10): Promise<{
    simulations: SimulationResult[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const response = await api.get(`/simulations?page=${page}&limit=${limit}`);
    // Backend returns { success, data: Simulation[], pagination }
    const rawSimulations = (response.data?.data ?? []) as any[];
    const simulations: SimulationResult[] = rawSimulations.map((s) => ({
      ...s,
      totalProfit: Number(s.totalProfit ?? 0),
      efficiencyScore: Number(s.efficiencyScore ?? 0),
      onTimeDeliveries: Number(s.onTimeDeliveries ?? 0),
      totalDeliveries: Number(s.totalDeliveries ?? 0),
      fuelCost: Number(s.fuelCost ?? 0),
      penalties: Number(s.penalties ?? 0),
      bonuses: Number(s.bonuses ?? 0),
    }));
    return {
      simulations,
      pagination: response.data?.pagination ?? {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: page > 1,
      },
    };
  }

  async getSimulation(id: number): Promise<SimulationResult> {
    const response = await api.get(`/simulations/${id}`);
    return response.data.data;
  }

  async deleteSimulation(id: number): Promise<void> {
    await api.delete(`/simulations/${id}`);
  }

  async compareSimulations(id1: number, id2: number): Promise<SimulationComparison> {
    const response = await api.get(`/simulations/compare/${id1}/${id2}`);
    return response.data.data;
  }
}

export default new SimulationService();
