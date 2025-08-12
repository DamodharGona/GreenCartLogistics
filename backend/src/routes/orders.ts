import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders with pagination and filtering
 *     tags: [Orders]
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
 *         name: routeId
 *         schema:
 *           type: integer
 *         description: Filter by route ID
 *       - in: query
 *         name: minValue
 *         schema:
 *           type: number
 *         description: Minimum order value
 *       - in: query
 *         name: maxValue
 *         schema:
 *           type: number
 *         description: Maximum order value
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [valueRs, deliveryTime, createdAt]
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
 *         description: Orders retrieved successfully
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const routeId = req.query['routeId'] ? parseInt(req.query['routeId'] as string) : undefined;
    const minValue = req.query['minValue'] ? parseFloat(req.query['minValue'] as string) : undefined;
    const maxValue = req.query['maxValue'] ? parseFloat(req.query['maxValue'] as string) : undefined;
    const sortBy = req.query['sortBy'] as string || 'createdAt';
    const sortOrder = req.query['sortOrder'] as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };
    if (routeId) {
      where.routeId = routeId;
    }
    if (minValue !== undefined) {
      where.valueRs = { gte: minValue };
    }
    if (maxValue !== undefined) {
      where.valueRs = { ...where.valueRs, lte: maxValue };
    }

    // Get total count
    const total = await prisma.order.count({ where });

    // Get orders with pagination and route information
    const orders = await prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        route: true
      },
      orderBy: {
        [sortBy]: sortOrder
      }
    });

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: orders,
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
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID' }
      });
    }

    const order = await prisma.order.findFirst({
      where: { id, isActive: true },
      include: {
        route: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    return res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - valueRs
 *               - routeId
 *               - deliveryTime
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Unique order identifier
 *               valueRs:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Order value in rupees
 *               routeId:
 *                 type: integer
 *                 description: Associated route ID
 *               deliveryTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                 description: Expected delivery time (HH:MM format)
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Bad request - validation error
 *       404:
 *         description: Route not found
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { orderId, valueRs, routeId, deliveryTime } = req.body;

    // Validation
    if (!orderId || !valueRs || !routeId || !deliveryTime) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID, value, route ID, and delivery time are required' }
      });
    }

    if (valueRs <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order value must be greater than 0' }
      });
    }

    // Validate delivery time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(deliveryTime)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Delivery time must be in HH:MM format' }
      });
    }

    // Check if route exists
    const route = await prisma.route.findFirst({
      where: { id: routeId, isActive: true }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    // Check if order ID already exists
    const existingOrder = await prisma.order.findFirst({
      where: { orderId, isActive: true }
    });

    if (existingOrder) {
      return res.status(409).json({
        success: false,
        error: { message: 'Order with this ID already exists' }
      });
    }

    const order = await prisma.order.create({
      data: {
        orderId,
        valueRs,
        routeId,
        deliveryTime
      },
      include: {
        route: true
      }
    });

    return res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     summary: Update order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderId:
 *                 type: string
 *               valueRs:
 *                 type: number
 *                 minimum: 0.01
 *               routeId:
 *                 type: integer
 *               deliveryTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    const { orderId, valueRs, routeId, deliveryTime, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID' }
      });
    }

    // Check if order exists
    const existingOrder = await prisma.order.findFirst({
      where: { id, isActive: true }
    });

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    // Validation
    if (valueRs && valueRs <= 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order value must be greater than 0' }
      });
    }

    if (deliveryTime) {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(deliveryTime)) {
        return res.status(400).json({
          success: false,
          error: { message: 'Delivery time must be in HH:MM format' }
        });
      }
    }

    if (routeId) {
      const route = await prisma.route.findFirst({
        where: { id: routeId, isActive: true }
      });

      if (!route) {
        return res.status(404).json({
          success: false,
          error: { message: 'Route not found' }
        });
      }
    }

    // Check order ID uniqueness if changing
    if (orderId && orderId !== existingOrder.orderId) {
      const orderIdExists = await prisma.order.findFirst({
        where: { orderId, isActive: true, id: { not: id } }
      });

      if (orderIdExists) {
        return res.status(409).json({
          success: false,
          error: { message: 'Order with this ID already exists' }
        });
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        ...(orderId && { orderId }),
        ...(valueRs && { valueRs }),
        ...(routeId && { routeId }),
        ...(deliveryTime && { deliveryTime }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      include: {
        route: true
      }
    });

    return res.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Delete order by ID (soft delete)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid order ID' }
      });
    }

    const order = await prisma.order.findFirst({
      where: { id, isActive: true }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        error: { message: 'Order not found' }
      });
    }

    // Soft delete
    await prisma.order.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/orders/route/{routeId}:
 *   get:
 *     summary: Get orders by route ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
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
router.get('/route/:routeId', authenticateToken, async (req, res) => {
  try {
    const routeId = parseInt(req.params['routeId'] || '');
    
    if (isNaN(routeId)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid route ID' }
      });
    }

    // Check if route exists
    const route = await prisma.route.findFirst({
      where: { id: routeId, isActive: true }
    });

    if (!route) {
      return res.status(404).json({
        success: false,
        error: { message: 'Route not found' }
      });
    }

    // Get orders for this route
    const orders = await prisma.order.findMany({
      where: { routeId, isActive: true },
      include: {
        route: true
      },
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

/**
 * @swagger
 * /api/orders/value-range:
 *   get:
 *     summary: Get orders by value range
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: minValue
 *         required: true
 *         schema:
 *           type: number
 *         description: Minimum order value
 *       - in: query
 *         name: maxValue
 *         required: true
 *         schema:
 *           type: number
 *         description: Maximum order value
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 *       400:
 *         description: Bad request - invalid value range
 */
router.get('/value-range', authenticateToken, async (req, res) => {
  try {
    const minValue = parseFloat(req.query['minValue'] as string);
    const maxValue = parseFloat(req.query['maxValue'] as string);

    if (isNaN(minValue) || isNaN(maxValue)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Valid minValue and maxValue are required' }
      });
    }

    if (minValue > maxValue) {
      return res.status(400).json({
        success: false,
        error: { message: 'minValue must be less than or equal to maxValue' }
      });
    }

    const orders = await prisma.order.findMany({
      where: {
        valueRs: {
          gte: minValue,
          lte: maxValue
        },
        isActive: true
      },
      include: {
        route: true
      },
      orderBy: { valueRs: 'desc' }
    });

    return res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get orders by value range error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
