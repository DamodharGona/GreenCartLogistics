import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, requireManager } from '../middleware/auth';
import { SimulationService } from '../services/simulationService';

const router = Router();

/**
 * @swagger
 * /api/simulations/run:
 *   post:
 *     summary: Run delivery simulation
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverCount
 *               - routeStartTime
 *               - maxHours
 *             properties:
 *               simulationName:
 *                 type: string
 *                 description: Optional name for the simulation
 *               driverCount:
 *                 type: integer
 *                 minimum: 1
 *                 description: Number of drivers to use
 *               routeStartTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Start time for routes (HH:MM format)
 *               maxHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 24
 *                 description: Maximum hours for simulation
 *               driverIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific driver IDs to use (optional)
 *               routeIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Specific route IDs to include (optional)
 *     responses:
 *       200:
 *         description: Simulation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProfit:
 *                       type: number
 *                       description: Total profit from all deliveries
 *                     efficiencyScore:
 *                       type: number
 *                       description: Overall efficiency score (0-100)
 *                     onTimeDeliveries:
 *                       type: integer
 *                       description: Number of on-time deliveries
 *                     totalDeliveries:
 *                       type: integer
 *                       description: Total number of deliveries
 *                     fuelCost:
 *                       type: number
 *                       description: Total fuel cost
 *                     penalties:
 *                       type: number
 *                       description: Total penalties for late deliveries
 *                     bonuses:
 *                       type: number
 *                       description: Total bonuses for high-value deliveries
 *                     simulationData:
 *                       type: object
 *                       description: Detailed simulation results
 *       400:
 *         description: Bad request - validation error
 *       500:
 *         description: Simulation failed
 */
router.post('/run', authenticateToken, requireManager, async (req, res) => {
  try {
    const {
      simulationName,
      driverCount,
      routeStartTime,
      maxHours,
      driverIds,
      routeIds
    } = req.body;

    // Validation
    if (!driverCount || !routeStartTime || !maxHours) {
      return res.status(400).json({
        success: false,
        error: { message: 'Driver count, route start time, and max hours are required' }
      });
    }

    if (driverCount < 1) {
      return res.status(400).json({
        success: false,
        error: { message: 'Driver count must be at least 1' }
      });
    }

    if (maxHours < 1 || maxHours > 24) {
      return res.status(400).json({
        success: false,
        error: { message: 'Max hours must be between 1 and 24' }
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(routeStartTime)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Route start time must be in HH:MM format' }
      });
    }

    // Run simulation
    const result = await SimulationService.runSimulation(
      { simulationName, driverCount, routeStartTime, maxHours, driverIds, routeIds },
      req.user?.id
    );

    return res.json({
      success: true,
      data: result,
      message: 'Simulation completed successfully'
    });
  } catch (error) {
    console.error('Run simulation error:', error);
    return res.status(500).json({
      success: false,
      error: { message: error instanceof Error ? error.message : 'Simulation failed' }
    });
  }
});

/**
 * @swagger
 * /api/simulations:
 *   get:
 *     summary: Get all simulations with pagination
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalProfit, efficiencyScore]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Simulations retrieved successfully
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const sortBy = req.query['sortBy'] as string || 'createdAt';
    const sortOrder = req.query['sortOrder'] as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    // Get total count
    const total = await prisma.simulation.count();

    // Get simulations with pagination
    const simulations = await prisma.simulation.findMany({
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    const totalPages = Math.ceil(total / limit);

    return res.json({
      success: true,
      data: simulations,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get simulations error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/simulations/{id}:
 *   get:
 *     summary: Get simulation by ID
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Simulation ID
 *     responses:
 *       200:
 *         description: Simulation retrieved successfully
 *       404:
 *         description: Simulation not found
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid simulation ID' }
      });
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Simulation not found' }
      });
    }

    return res.json({
      success: true,
      data: simulation
    });
  } catch (error) {
    console.error('Get simulation error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/simulations/{id}:
 *   delete:
 *     summary: Delete simulation by ID
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Simulation ID
 *     responses:
 *       200:
 *         description: Simulation deleted successfully
 *       404:
 *         description: Simulation not found
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid simulation ID' }
      });
    }

    const simulation = await prisma.simulation.findUnique({
      where: { id }
    });

    if (!simulation) {
      return res.status(404).json({
        success: false,
        error: { message: 'Simulation not found' }
      });
    }

    await prisma.simulation.delete({
      where: { id }
    });

    return res.json({
      success: true,
      message: 'Simulation deleted successfully'
    });
  } catch (error) {
    console.error('Delete simulation error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/simulations/compare/{id1}/{id2}:
 *   get:
 *     summary: Compare two simulations
 *     tags: [Simulations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id1
 *         required: true
 *         schema:
 *           type: integer
 *         description: First simulation ID
 *       - in: path
 *         name: id2
 *         required: true
 *         schema:
 *           type: integer
 *         description: Second simulation ID
 *     responses:
 *       200:
 *         description: Comparison completed successfully
 *       404:
 *         description: One or both simulations not found
 */
router.get('/compare/:id1/:id2', authenticateToken, async (req, res) => {
  try {
    const id1 = parseInt(req.params['id1'] || '');
    const id2 = parseInt(req.params['id2'] || '');

    if (isNaN(id1) || isNaN(id2)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid simulation IDs' }
      });
    }

    // Get both simulations
    const [sim1, sim2] = await Promise.all([
      prisma.simulation.findUnique({ where: { id: id1 } }),
      prisma.simulation.findUnique({ where: { id: id2 } })
    ]);

    if (!sim1 || !sim2) {
      return res.status(404).json({
        success: false,
        error: { message: 'One or both simulations not found' }
      });
    }

    // Calculate comparison metrics
    const comparison: any = {
      simulation1: {
        id: sim1.id,
        name: sim1.simulationName,
        profit: sim1.totalProfit,
        efficiency: sim1.efficiencyScore,
        onTimeRate: (sim1.onTimeDeliveries / sim1.totalDeliveries) * 100,
        fuelCost: sim1.fuelCost,
        penalties: sim1.penalties,
        bonuses: sim1.bonuses
      },
      simulation2: {
        id: sim2.id,
        name: sim2.simulationName,
        profit: sim2.totalProfit,
        efficiency: sim2.efficiencyScore,
        onTimeRate: (sim2.onTimeDeliveries / sim2.totalDeliveries) * 100,
        fuelCost: sim2.fuelCost,
        penalties: sim2.penalties,
        bonuses: sim2.bonuses
      },
      differences: {
        profit: Number(sim2.totalProfit) - Number(sim1.totalProfit),
        efficiency: Number(sim2.efficiencyScore) - Number(sim1.efficiencyScore),
        onTimeRate: ((sim2.onTimeDeliveries / sim2.totalDeliveries) * 100) - ((sim1.onTimeDeliveries / sim1.totalDeliveries) * 100),
        fuelCost: Number(sim2.fuelCost) - Number(sim1.fuelCost),
        penalties: Number(sim2.penalties) - Number(sim1.penalties),
        bonuses: Number(sim2.bonuses) - Number(sim1.bonuses)
      },
      recommendations: []
    };

    // Generate recommendations based on comparison
    if (comparison.differences.profit > 0) {
      comparison.recommendations.push('Simulation 2 shows better profitability');
    } else if (comparison.differences.profit < 0) {
      comparison.recommendations.push('Simulation 1 shows better profitability');
    }

    if (comparison.differences.efficiency > 0) {
      comparison.recommendations.push('Simulation 2 has higher efficiency');
    } else if (comparison.differences.efficiency < 0) {
      comparison.recommendations.push('Simulation 1 has higher efficiency');
    }

    if (comparison.differences.penalties < 0) {
      comparison.recommendations.push('Simulation 2 has fewer penalties');
    } else if (comparison.differences.penalties > 0) {
      comparison.recommendations.push('Simulation 1 has fewer penalties');
    }

    return res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Compare simulations error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
