import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/routes:
 *   get:
 *     summary: Get all routes with pagination
 *     tags: [Routes]
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
 *         name: trafficLevel
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH]
 *         description: Filter by traffic level
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [distanceKm, baseTimeMin, createdAt]
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
 *         description: Routes retrieved successfully
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const trafficLevel = req.query['trafficLevel'] as 'LOW' | 'MEDIUM' | 'HIGH';
    const sortBy = req.query['sortBy'] as string || 'createdAt';
    const sortOrder = req.query['sortOrder'] as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };
    if (trafficLevel) {
      where.trafficLevel = trafficLevel;
    }

    // Get total count
    const total = await prisma.route.count({ where });

    // Get routes with pagination
    const routes = await prisma.route.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: routes,
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
    console.error('Get routes error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   get:
 *     summary: Get route by ID
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *       404:
 *         description: Route not found
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid route ID' }
      });
    }

    const route = await prisma.route.findFirst({
      where: { id, isActive: true }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    return res.json({
      success: true,
      data: route
    });
  } catch (error) {
    console.error('Get route error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distanceKm
 *               - trafficLevel
 *               - baseTimeMin
 *             properties:
 *               distanceKm:
 *                 type: number
 *                 minimum: 0.1
 *                 description: Distance in kilometers
 *               trafficLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *                 description: Traffic level on the route
 *               baseTimeMin:
 *                 type: integer
 *                 minimum: 1
 *                 description: Base delivery time in minutes
 *     responses:
 *       201:
 *         description: Route created successfully
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { distanceKm, trafficLevel, baseTimeMin } = req.body;

    // Validation
    if (!distanceKm || !trafficLevel || !baseTimeMin) {
      return res.status(400).json({
        success: false,
        error: { message: 'Distance, traffic level, and base time are required' }
      });
    }

    if (distanceKm <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Distance must be greater than 0' }
      });
    }

    if (baseTimeMin <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Base time must be greater than 0' }
      });
    }

    if (!['LOW', 'MEDIUM', 'HIGH'].includes(trafficLevel)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Traffic level must be LOW, MEDIUM, or HIGH' }
      });
    }

    const route = await prisma.route.create({
      data: {
        distanceKm,
        trafficLevel,
        baseTimeMin
      }
    });

    return res.status(201).json({
      success: true,
      data: route,
      message: 'Route created successfully'
    });
  } catch (error) {
    console.error('Create route error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   put:
 *     summary: Update route by ID
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               distanceKm:
 *                 type: number
 *                 minimum: 0.1
 *               trafficLevel:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH]
 *               baseTimeMin:
 *                 type: integer
 *                 minimum: 1
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Route updated successfully
 *       404:
 *         description: Route not found
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    const { distanceKm, trafficLevel, baseTimeMin, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid route ID' }
      });
    }

    // Check if route exists
    const existingRoute = await prisma.route.findFirst({
      where: { id, isActive: true }
    });

    if (!existingRoute) {
      return res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    // Validation
    if (distanceKm && distanceKm <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Distance must be greater than 0' }
      });
    }

    if (baseTimeMin && baseTimeMin <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Base time must be greater than 0' }
      });
    }

    if (trafficLevel && !['LOW', 'MEDIUM', 'HIGH'].includes(trafficLevel)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Traffic level must be LOW, MEDIUM, or HIGH' }
      });
    }

    const updatedRoute = await prisma.route.update({
      where: { id },
      data: {
        ...(distanceKm && { distanceKm }),
        ...(trafficLevel && { trafficLevel }),
        ...(baseTimeMin && { baseTimeMin }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    return res.json({
      success: true,
      data: updatedRoute,
      message: 'Route updated successfully'
    });
  } catch (error) {
    console.error('Update route error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}:
 *   delete:
 *     summary: Delete route by ID (soft delete)
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *       404:
 *         description: Route not found
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid route ID' }
      });
    }

    const route = await prisma.route.findFirst({
      where: { id, isActive: true }
    });

    if (!route) {
      return res.status(400).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    // Check if route has associated orders
    const orderCount = await prisma.order.count({
      where: { routeId: id, isActive: true }
    });

    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot delete route with associated orders' }
      });
    }

    // Soft delete
    await prisma.route.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Route deleted successfully'
    });
  } catch (error) {
    console.error('Delete route error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/routes/{id}/orders:
 *   get:
 *     summary: Get orders for a specific route
 *     tags: [Routes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       404:
 *         description: Route not found
 */
router.get('/:id/orders', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid route ID' }
      });
    }

    // Check if route exists
    const route = await prisma.route.findFirst({
      where: { id, isActive: true }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    // Get orders for this route
    const orders = await prisma.order.findMany({
      where: { routeId: id, isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get route orders error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
