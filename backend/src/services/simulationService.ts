import prisma from '../config/database';

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

export class SimulationService {
  /**
   * Run delivery simulation with company rules
   */
  static async runSimulation(request: SimulationRequest, userId?: number): Promise<SimulationResult> {
    try {
      // Get available drivers and orders
      const drivers = await this.getAvailableDrivers(request.driverIds);
      const orders = await this.getAvailableOrders(request.routeIds);
      const routes = await this.getAvailableRoutes();

      if (drivers.length === 0) {
        throw new Error('No drivers available for simulation');
      }

      if (orders.length === 0) {
        throw new Error('No orders available for simulation');
      }

      // Parse start time
      const startTime = this.parseTime(request.routeStartTime);
      const maxMinutes = request.maxHours * 60;

      // Initialize simulation variables
      let totalProfit = 0;
      let totalFuelCost = 0;
      let totalPenalties = 0;
      let totalBonuses = 0;
      let onTimeDeliveries = 0;
      let totalDeliveries = 0;
      let totalDriverEfficiency = 0;

      const driverAssignments: DriverAssignment[] = [];
      const orderResults: OrderResult[] = [];

      // Assign orders to drivers
      const assignments = this.assignOrdersToDrivers(drivers, orders, routes, startTime, maxMinutes);

      // Process each assignment
      for (const assignment of assignments) {
        const driver = drivers.find(d => d.id === assignment.driverId)!;
        const driverResult: DriverAssignment = {
          driverId: driver.id,
          driverName: driver.name,
          assignedOrders: [],
          totalHours: 0,
          efficiency: 0
        };

        let driverTotalTime = 0;

        for (const orderId of assignment.orderIds) {
          const order = orders.find(o => o.id === orderId)!;
          const route = routes.find(r => r.id === order.routeId)!;

          // Calculate delivery time considering traffic and driver fatigue
          const actualDeliveryTime = this.calculateDeliveryTime(
            route,
            driver,
            assignment.startTime + driverTotalTime
          );

          // Check if delivery is on time
          const expectedTime = this.parseTime(order.deliveryTime);
          const isOnTime = actualDeliveryTime <= expectedTime + 10; // 10 minutes grace period

          // Calculate penalties and bonuses
          let penalty = 0;
          let bonus = 0;

          if (!isOnTime) {
            penalty = 50; // ₹50 penalty for late delivery
            totalPenalties += penalty;
          } else {
            onTimeDeliveries++;
            // 10% profit bonus for high-value, on-time deliveries (>₹1,000)
            if (Number(order.valueRs) > 1000) {
              bonus = Number(order.valueRs) * 0.1;
              totalBonuses += bonus;
            }
          }

          // Calculate fuel cost
          const fuelCost = this.calculateFuelCost(route);
          totalFuelCost += fuelCost;

          // Calculate profit for this order
          const orderProfit = Number(order.valueRs) + bonus - penalty - fuelCost;
          totalProfit += orderProfit;

          // Update driver stats
          driverTotalTime += actualDeliveryTime - (assignment.startTime + driverTotalTime);
          driverResult.assignedOrders.push(orderId);

          // Add to order results
          orderResults.push({
            orderId: order.orderId,
            driverId: driver.id,
            routeId: route.id,
            deliveryTime: order.deliveryTime,
            actualTime: this.formatTime(assignment.startTime + driverTotalTime),
            isOnTime,
            penalty,
            bonus,
            fuelCost
          });

          totalDeliveries++;
        }

        // Calculate driver efficiency
        driverResult.totalHours = driverTotalTime / 60;
        driverResult.efficiency = this.calculateDriverEfficiency(driver, driverTotalTime);
        driverAssignments.push(driverResult);

        totalDriverEfficiency += driverResult.efficiency;
      }

      // Calculate overall efficiency score
      const efficiencyScore = driverAssignments.length > 0 
        ? totalDriverEfficiency / driverAssignments.length 
        : 0;

      // Generate summary and recommendations
      const summary = this.generateSummary(
        orders.length,
        routes.length,
        efficiencyScore,
        totalProfit,
        totalFuelCost,
        totalPenalties,
        totalBonuses
      );

      // Save simulation result
      await this.saveSimulation(request, {
        totalProfit,
        efficiencyScore,
        onTimeDeliveries,
        totalDeliveries,
        fuelCost: totalFuelCost,
        penalties: totalPenalties,
        bonuses: totalBonuses
      }, {
        driverAssignments,
        orderResults,
        summary
      }, userId);

      return {
        totalProfit,
        efficiencyScore,
        onTimeDeliveries,
        totalDeliveries,
        fuelCost: totalFuelCost,
        penalties: totalPenalties,
        bonuses: totalBonuses,
        simulationData: {
          driverAssignments,
          orderResults,
          summary
        }
      };
    } catch (error) {
      console.error('Simulation error:', error);
      throw error;
    }
  }

  /**
   * Get available drivers for simulation
   */
  private static async getAvailableDrivers(driverIds?: number[]) {
    const where: any = { isActive: true };
    if (driverIds && driverIds.length > 0) {
      where.id = { in: driverIds };
    }

    return await prisma.driver.findMany({ where });
  }

  /**
   * Get available orders for simulation
   */
  private static async getAvailableOrders(routeIds?: number[]) {
    const where: any = { isActive: true };
    if (routeIds && routeIds.length > 0) {
      where.routeId = { in: routeIds };
    }

    return await prisma.order.findMany({ 
      where,
      include: { route: true }
    });
  }

  /**
   * Get available routes for simulation
   */
  private static async getAvailableRoutes() {
    return await prisma.route.findMany({ where: { isActive: true } });
  }

  /**
   * Assign orders to drivers using a simple round-robin approach
   */
  private static assignOrdersToDrivers(
    drivers: any[],
    orders: any[],
    routes: any[],
    startTime: number,
    maxMinutes: number
  ) {
    const assignments: any[] = [];
    let driverIndex = 0;
    let currentTime = startTime;

    for (const order of orders) {
      const driver = drivers[driverIndex % drivers.length];
      
      // Check if driver can handle this order within time constraints
      const route = routes.find(r => r.id === order.routeId)!;
      const estimatedTime = this.calculateDeliveryTime(route, driver, currentTime);
      
      if (currentTime + estimatedTime <= startTime + maxMinutes) {
        // Find or create assignment for this driver
        let assignment = assignments.find(a => a.driverId === driver.id);
        if (!assignment) {
          assignment = {
            driverId: driver.id,
            orderIds: [],
            startTime: currentTime
          };
          assignments.push(assignment);
        }

        assignment.orderIds.push(order.id);
        currentTime += estimatedTime;
      }

      driverIndex++;
    }

    return assignments;
  }

  /**
   * Calculate delivery time considering traffic and driver fatigue
   */
  private static calculateDeliveryTime(route: any, driver: any, _startTime: number): number {
    let baseTime = route.baseTimeMin;

    // Apply traffic multiplier
    switch (route.trafficLevel) {
      case 'LOW':
        baseTime *= 1.0;
        break;
      case 'MEDIUM':
        baseTime *= 1.2;
        break;
      case 'HIGH':
        baseTime *= 1.5;
        break;
    }

    // Apply driver fatigue penalty (30% slower if worked >8h previous day)
    const yesterdayHours = driver.pastWeekHours[6]; // Last day of the week
    if (yesterdayHours > 8) {
      baseTime *= 1.3;
    }

    return baseTime;
  }

  /**
   * Calculate fuel cost based on distance and traffic
   */
  private static calculateFuelCost(route: any): number {
    let fuelCostPerKm = 5; // Base fuel cost: ₹5/km

    // Additional fuel cost for high traffic
    if (route.trafficLevel === 'HIGH') {
      fuelCostPerKm += 2; // +₹2/km for high traffic
    }

    return fuelCostPerKm * Number(route.distanceKm);
  }

  /**
   * Calculate driver efficiency based on performance
   */
  private static calculateDriverEfficiency(driver: any, totalTime: number): number {
    const shiftHours = driver.shiftHours;
    const actualHours = totalTime / 60;
    
    // Efficiency based on how well they utilize their shift
    const utilization = Math.min(actualHours / shiftHours, 1);
    
    // Consider past week performance
    const avgPastHours = driver.pastWeekHours.reduce((a: number, b: number) => a + b, 0) / 7;
    const consistency = 1 - Math.abs(avgPastHours - shiftHours) / shiftHours;
    
    return (utilization * 0.7 + consistency * 0.3) * 100;
  }

  /**
   * Parse time string (HH:MM) to minutes since midnight
   */
  private static parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }

  /**
   * Format minutes since midnight to HH:MM string
   */
  private static formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  /**
   * Generate simulation summary and recommendations
   */
  private static generateSummary(
    totalOrders: number,
    totalRoutes: number,
    efficiency: number,
    profit: number,
    fuelCost: number,
    penalties: number,
    bonuses: number
  ): SimulationSummary {
    const recommendations: string[] = [];

    if (efficiency < 70) {
      recommendations.push('Consider optimizing driver assignments to improve efficiency');
    }

    if (penalties > profit * 0.1) {
      recommendations.push('High penalty costs suggest need for better route planning and time management');
    }

    if (fuelCost > profit * 0.3) {
      recommendations.push('Fuel costs are high - consider route optimization and traffic avoidance');
    }

    if (bonuses < profit * 0.05) {
      recommendations.push('Low bonus earnings - focus on high-value order prioritization');
    }

    return {
      totalOrders,
      totalRoutes,
      averageEfficiency: efficiency,
      profitMargin: profit > 0 ? (profit / (profit + fuelCost + penalties)) * 100 : 0,
      recommendations
    };
  }

  /**
   * Save simulation result to database
   */
  private static async saveSimulation(
    request: SimulationRequest,
    results: any,
    simulationData: any,
    userId?: number
  ) {
    const data: any = {
      simulationName: request.simulationName,
      driverCount: request.driverCount,
      routeStartTime: request.routeStartTime,
      maxHours: request.maxHours,
      totalProfit: results.totalProfit,
      efficiencyScore: results.efficiencyScore,
      onTimeDeliveries: results.onTimeDeliveries,
      totalDeliveries: results.totalDeliveries,
      fuelCost: results.fuelCost,
      penalties: results.penalties,
      bonuses: results.bonuses,
      simulationData
    };

    if (userId) {
      data.createdBy = userId;
    }

    await prisma.simulation.create({ data });
  }
}
