import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get dashboard overview KPIs
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview retrieved successfully
 */
router.get('/overview', authenticateToken, async (_req, res) => {
  try {
    // Get counts
    const [totalDrivers, totalRoutes, totalOrders, totalSimulations] = await Promise.all([
      prisma.driver.count({ where: { isActive: true } }),
      prisma.route.count({ where: { isActive: true } }),
      prisma.order.count({ where: { isActive: true } }),
      prisma.simulation.count()
    ]);

    // Get recent simulations
    const recentSimulations = await prisma.simulation.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    // Calculate average efficiency from recent simulations
    const averageEfficiency = recentSimulations.length > 0
      ? recentSimulations.reduce((sum, sim) => sum + Number(sim.efficiencyScore), 0) / recentSimulations.length
      : 0;

    // Calculate total profit from recent simulations
    const totalProfit = recentSimulations.reduce((sum, sim) => sum + Number(sim.totalProfit), 0);

    res.json({
      success: true,
      data: {
        totalDrivers,
        totalRoutes,
        totalOrders,
        totalSimulations,
        averageEfficiency: Math.round(averageEfficiency * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        recentSimulations
      }
    });
  } catch (error) {
    console.error('Get overview error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/analytics/profit-trends:
 *   get:
 *     summary: Get profit trends over time
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days to analyze
 *     responses:
 *       200:
 *         description: Profit trends retrieved successfully
 */
router.get('/profit-trends', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.query['days'] as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const simulations = await prisma.simulation.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      select: {
        createdAt: true,
        totalProfit: true,
        efficiencyScore: true,
        totalDeliveries: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by date and calculate daily totals
    const dailyData = new Map<string, any>();
    
    simulations.forEach(sim => {
      const iso = (sim.createdAt as Date | undefined)?.toISOString?.();
      if (!iso) return;
      const date = iso.split('T')[0] as string;

      if (date && !dailyData.has(date)) {
        dailyData.set(date, {
          date,
          profit: 0,
          efficiency: 0,
          orderCount: 0,
          simulationCount: 0
        });
      }
      
      if (date) {
        const dayData = dailyData.get(date)!;
        dayData.profit += Number(sim.totalProfit);
        dayData.efficiency += Number(sim.efficiencyScore);
        dayData.orderCount += sim.totalDeliveries;
        dayData.simulationCount += 1;
      }
    });

    // Calculate averages and format data
    const trends = Array.from(dailyData.values()).map(day => ({
      date: day.date,
      profit: Math.round(day.profit * 100) / 100,
      efficiency: day.simulationCount > 0 ? Math.round((day.efficiency / day.simulationCount) * 100) / 100 : 0,
      orderCount: day.orderCount
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    console.error('Get profit trends error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/analytics/efficiency-metrics:
 *   get:
 *     summary: Get efficiency metrics and analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Efficiency metrics retrieved successfully
 */
router.get('/efficiency-metrics', authenticateToken, async (_req, res) => {
  try {
    // Get all simulations for analysis
    const simulations = await prisma.simulation.findMany({
      select: {
        efficiencyScore: true,
        onTimeDeliveries: true,
        totalDeliveries: true,
        totalProfit: true,
        fuelCost: true,
        penalties: true,
        bonuses: true
      }
    });

    if (simulations.length === 0) {
      return res.json({
        success: true,
        data: {
          averageEfficiency: 0,
          onTimeRate: 0,
          profitPerDelivery: 0,
          fuelEfficiency: 0,
          penaltyRate: 0,
          bonusRate: 0
        }
      });
    }

    // Calculate metrics
    const totalDeliveries = simulations.reduce((sum, sim) => sum + sim.totalDeliveries, 0);
    const totalOnTime = simulations.reduce((sum, sim) => sum + sim.onTimeDeliveries, 0);
    const totalProfit = simulations.reduce((sum, sim) => sum + Number(sim.totalProfit), 0);
    const totalFuelCost = simulations.reduce((sum, sim) => sum + Number(sim.fuelCost), 0);
    const totalPenalties = simulations.reduce((sum, sim) => sum + Number(sim.penalties), 0);
    const totalBonuses = simulations.reduce((sum, sim) => sum + Number(sim.bonuses), 0);

    const metrics = {
      averageEfficiency: Math.round(
        simulations.reduce((sum, sim) => sum + Number(sim.efficiencyScore), 0) / simulations.length * 100
      ) / 100,
      onTimeRate: totalDeliveries > 0 ? Math.round((totalOnTime / totalDeliveries) * 100 * 100) / 100 : 0,
      profitPerDelivery: totalDeliveries > 0 ? Math.round((totalProfit / totalDeliveries) * 100) / 100 : 0,
      fuelEfficiency: totalFuelCost > 0 ? Math.round((totalProfit / totalFuelCost) * 100) / 100 : 0,
      penaltyRate: totalDeliveries > 0 ? Math.round((totalPenalties / totalDeliveries) * 100) / 100 : 0,
      bonusRate: totalDeliveries > 0 ? Math.round((totalBonuses / totalDeliveries) * 100) / 100 : 0
    };

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get efficiency metrics error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/analytics/driver-performance:
 *   get:
 *     summary: Get driver performance analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver performance data retrieved successfully
 */
router.get('/driver-performance', authenticateToken, async (_req, res) => {
  try {
    const drivers = await prisma.driver.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shiftHours: true,
        pastWeekHours: true
      }
    });

    const driverPerformance = drivers.map(driver => {
      const avgPastHours = driver.pastWeekHours.reduce((sum, hours) => sum + hours, 0) / 7;
      const consistency = 1 - Math.abs(avgPastHours - driver.shiftHours) / driver.shiftHours;
      const efficiency = Math.round(consistency * 100 * 100) / 100;

      return {
        driverId: driver.id,
        driverName: driver.name,
        totalDeliveries: 0, // Would need to calculate from simulations
        onTimeDeliveries: 0, // Would need to calculate from simulations
        efficiency,
        totalHours: avgPastHours,
        shiftUtilization: Math.round((avgPastHours / driver.shiftHours) * 100 * 100) / 100
      };
    });

    // Sort by efficiency (descending)
    driverPerformance.sort((a, b) => b.efficiency - a.efficiency);

    res.json({
      success: true,
      data: driverPerformance
    });
  } catch (error) {
    console.error('Get driver performance error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/analytics/route-efficiency:
 *   get:
 *     summary: Get route efficiency analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Route efficiency data retrieved successfully
 */
router.get('/route-efficiency', authenticateToken, async (_req, res) => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      select: {
        id: true,
        distanceKm: true,
        trafficLevel: true,
        baseTimeMin: true
      }
    });

    const routeEfficiency = routes.map(route => {
      // Calculate efficiency based on distance vs time ratio
      const distanceTimeRatio = Number(route.distanceKm) / route.baseTimeMin;
      
      // Traffic level impact
      let trafficMultiplier = 1;
      switch (route.trafficLevel) {
        case 'LOW':
          trafficMultiplier = 1.0;
          break;
        case 'MEDIUM':
          trafficMultiplier = 1.2;
          break;
        case 'HIGH':
          trafficMultiplier = 1.5;
          break;
      }

      const efficiency = Math.round((distanceTimeRatio / trafficMultiplier) * 100 * 100) / 100;

      return {
        routeId: route.id,
        distanceKm: Number(route.distanceKm),
        trafficLevel: route.trafficLevel,
        baseTimeMin: route.baseTimeMin,
        efficiency,
        distanceTimeRatio: Math.round(distanceTimeRatio * 100) / 100
      };
    });

    // Sort by efficiency (descending)
    routeEfficiency.sort((a, b) => b.efficiency - a.efficiency);

    res.json({
      success: true,
      data: routeEfficiency
    });
  } catch (error) {
    console.error('Get route efficiency error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/analytics/delivery-stats:
 *   get:
 *     summary: Get delivery statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery statistics retrieved successfully
 */
router.get('/delivery-stats', authenticateToken, async (_req, res) => {
  try {
    // Get order statistics
    const orders = await prisma.order.findMany({
      where: { isActive: true },
      include: {
        route: {
          select: {
            distanceKm: true,
            trafficLevel: true
          }
        }
      }
    });

    if (orders.length === 0) {
      return res.json({
        success: true,
        data: {
          totalOrders: 0,
          averageOrderValue: 0,
          totalValue: 0,
          valueDistribution: [],
          routeDistribution: [],
          trafficDistribution: []
        }
      });
    }

    // Calculate basic stats
    const totalValue = orders.reduce((sum, order) => sum + Number(order.valueRs), 0);
    const averageOrderValue = totalValue / orders.length;

    // Value distribution
    const valueRanges = [
      { min: 0, max: 500, label: '₹0-500', count: 0 },
      { min: 500, max: 1000, label: '₹500-1000', count: 0 },
      { min: 1000, max: 2000, label: '₹1000-2000', count: 0 },
      { min: 2000, max: 3000, label: '₹2000-3000', count: 0 },
      { min: 3000, max: Infinity, label: '₹3000+', count: 0 }
    ];

    orders.forEach(order => {
      const value = Number(order.valueRs);
      const range = valueRanges.find(r => value >= r.min && value < r.max);
      if (range) range.count++;
    });

    // Route distribution
    const routeCounts = new Map<number, number>();
    orders.forEach(order => {
      routeCounts.set(order.routeId, (routeCounts.get(order.routeId) || 0) + 1);
    });

    const routeDistribution = Array.from(routeCounts.entries()).map(([routeId, count]) => ({
      routeId,
      count,
      percentage: Math.round((count / orders.length) * 100 * 100) / 100
    }));

    // Traffic distribution
    const trafficCounts = new Map<string, number>();
    orders.forEach(order => {
      const traffic = order.route.trafficLevel;
      trafficCounts.set(traffic, (trafficCounts.get(traffic) || 0) + 1);
    });

    const trafficDistribution = Array.from(trafficCounts.entries()).map(([traffic, count]) => ({
      traffic,
      count,
      percentage: Math.round((count / orders.length) * 100 * 100) / 100
    }));

    // Daily Delivered vs. Delayed (derived from simulations)
    const simulations = await prisma.simulation.findMany({
      select: {
        createdAt: true,
        onTimeDeliveries: true,
        totalDeliveries: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { date: string; delivered: number; delayed: number }>();
    simulations.forEach((sim) => {
      const iso = (sim.createdAt as Date | undefined)?.toISOString?.();
      if (!iso) return;
      const date = iso.split('T')[0] as string;
      const existing = dailyMap.get(date) || { date, delivered: 0, delayed: 0 };
      existing.delivered += sim.onTimeDeliveries || 0;
      existing.delayed += Math.max((sim.totalDeliveries || 0) - (sim.onTimeDeliveries || 0), 0);
      dailyMap.set(date, existing);
    });
    const daily = Array.from(dailyMap.values());

    return res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100,
        valueDistribution: valueRanges,
        routeDistribution,
        trafficDistribution,
        daily
      }
    });
  } catch (error) {
    console.error('Get delivery stats error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
