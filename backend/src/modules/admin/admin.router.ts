import { Router } from 'express';
import { listUsers, changeUserRole } from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

/**
 * @route  GET /api/v1/admin/users
 * @access Admin only
 */
router.get('/users', listUsers);

/**
 * @route  PATCH /api/v1/admin/users/:id/role
 * @access Admin only
 */
router.patch('/users/:id/role', changeUserRole);

export default router;
