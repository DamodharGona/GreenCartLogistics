import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// List users with pagination/search
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const page = parseInt((req.query['page'] as string) || '1');
    const limit = parseInt((req.query['limit'] as string) || '10');
    const search = (req.query['search'] as string) || '';
    const skip = (page - 1) * limit;

    const where: any = search
      ? { OR: [{ username: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {};

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true } })
    ]);

    return res.json({ success: true, data: users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (e) {
    console.error('List users error:', e);
    return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// Create user
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, password, role = 'MANAGER' } = req.body as { username: string; email: string; password: string; role?: 'ADMIN' | 'MANAGER' };
    if (!username || !email || !password) return res.status(400).json({ success: false, error: { message: 'username, email, password required' } });
    const exists = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
    if (exists) return res.status(409).json({ success: false, error: { message: 'Username or email exists' } });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({ data: { username, email, passwordHash, role } });
    const { passwordHash: _ph, ...safe } = user as any;
    return res.status(201).json({ success: true, data: safe, message: 'User created' });
  } catch (e) {
    console.error('Create user error:', e);
    return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// Update user (email, role, password, isActive)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    if (isNaN(id)) return res.status(400).json({ success: false, error: { message: 'Invalid user ID' } });
    const { email, role, password, isActive } = req.body as { email?: string; role?: 'ADMIN' | 'MANAGER'; password?: string; isActive?: boolean };
    const data: any = {};
    if (email) data.email = email;
    if (role) data.role = role;
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.update({ where: { id }, data, select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true } });
    return res.json({ success: true, data: user, message: 'User updated' });
  } catch (e) {
    console.error('Update user error:', e);
    return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

// Soft delete (deactivate)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params['id'] || '');
    if (isNaN(id)) return res.status(400).json({ success: false, error: { message: 'Invalid user ID' } });
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.json({ success: true, message: 'User deactivated' });
  } catch (e) {
    console.error('Delete user error:', e);
    return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
  }
});

export default router;


