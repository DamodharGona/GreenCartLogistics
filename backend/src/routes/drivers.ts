import { Router } from 'express';
import prisma from '../config/database';
import { authenticateToken, requireManager } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers with pagination
 *     tags: [Drivers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by driver name
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, shiftHours, createdAt]
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
 *         description: Drivers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       shiftHours:
 *                         type: integer
 *                       pastWeekHours:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       isActive:
 *                         type: boolean
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const search = req.query['search'] as string;
    const sortBy = req.query['sortBy'] as string || 'createdAt';
    const sortOrder = req.query['sortOrder'] as 'asc' | 'desc' || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { isActive: true };
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }

    // Get total count
    const total = await prisma.driver.count({ where });

    // Get drivers with pagination
    const drivers = await prisma.driver.findMany({
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
      data: drivers,
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
    console.error('Get drivers error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver retrieved successfully
 *       404:
 *         description: Driver not found
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid driver ID' }
      });
    }

    const driver = await prisma.driver.findFirst({
      where: { id, isActive: true }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { message: 'Driver not found' }
      });
    }

    return res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    console.error('Get driver error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/drivers:
 *   post:
 *     summary: Create a new driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - shiftHours
 *               - pastWeekHours
 *             properties:
 *               name:
 *                 type: string
 *                 description: Driver name
 *               shiftHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 24
 *                 description: Daily shift hours
 *               pastWeekHours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 7
 *                 maxItems: 7
 *                 description: Hours worked in the past 7 days
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: Bad request - validation error
 */
router.post('/', authenticateToken, requireManager, async (req, res) => {
  try {
    const { name, shiftHours, pastWeekHours } = req.body;

    // Validation
    if (!name || !shiftHours || !pastWeekHours) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, shiftHours, and pastWeekHours are required' }
      });
    }

    if (shiftHours < 1 || shiftHours > 24) {
      return res.status(400).json({
        success: false,
        error: { message: 'Shift hours must be between 1 and 24' }
      });
    }

    if (!Array.isArray(pastWeekHours) || pastWeekHours.length !== 7) {
      return res.status(400).json({
        success: false,
        error: { message: 'Past week hours must be an array of 7 days' }
      });
    }

    // Check if driver name already exists
    const existingDriver = await prisma.driver.findFirst({
      where: { name, isActive: true }
    });

    if (existingDriver) {
      return res.status(409).json({
        success: false,
        error: { message: 'Driver with this name already exists' }
      });
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        shiftHours,
        pastWeekHours
      }
    });

    return res.status(201).json({
      success: true,
      data: driver,
      message: 'Driver created successfully'
    });
  } catch (error) {
    console.error('Create driver error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/drivers/{id}:
 *   put:
 *     summary: Update driver by ID
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Driver ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shiftHours:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 24
 *               pastWeekHours:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 minItems: 7
 *                 maxItems: 7
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       404:
 *         description: Driver not found
 */
router.put('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    const { name, shiftHours, pastWeekHours, isActive } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid driver ID' }
      });
    }

    // Check if driver exists
    const existingDriver = await prisma.driver.findFirst({
      where: { id, isActive: true }
    });

    if (!existingDriver) {
      return res.status(404).json({
        success: false,
        error: { message: 'Driver not found' }
      });
    }

    // Validation
    if (shiftHours && (shiftHours < 1 || shiftHours > 24)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Shift hours must be between 1 and 24' }
      });
    }

    if (pastWeekHours && (!Array.isArray(pastWeekHours) || pastWeekHours.length !== 7)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Past week hours must be an array of 7 days' }
      });
    }

    // Check name uniqueness if changing
    if (name && name !== existingDriver.name) {
      const nameExists = await prisma.driver.findFirst({
        where: { name, isActive: true, id: { not: id } }
      });

      if (nameExists) {
        return res.status(409).json({
          success: false,
          error: { message: 'Driver with this name already exists' }
        });
      }
    }

    const updatedDriver = await prisma.driver.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(shiftHours && { shiftHours }),
        ...(pastWeekHours && { pastWeekHours }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    return res.json({
      success: true,
      data: updatedDriver,
      message: 'Driver updated successfully'
    });
  } catch (error) {
    console.error('Update driver error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

/**
 * @swagger
 * /api/drivers/{id}:
 *   delete:
 *     summary: Delete driver by ID (soft delete)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver deleted successfully
 *       404:
 *         description: Driver not found
 */
router.delete('/:id', authenticateToken, requireManager, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid driver ID' }
      });
    }

    const driver = await prisma.driver.findFirst({
      where: { id, isActive: true }
    });

    if (!driver) {
      return res.status(404).json({
        success: false,
        error: { message: 'Driver not found' }
      });
    }

    // Soft delete
    await prisma.driver.update({
      where: { id },
      data: { isActive: false }
    });

    return res.json({
      success: true,
      message: 'Driver deleted successfully'
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
