import { Router } from 'express';
import { register, login, me } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

/**
 * @route  POST /api/v1/auth/register
 * @access Public
 */
router.post('/register', register);

/**
 * @route  POST /api/v1/auth/login
 * @access Public
 */
router.post('/login', login);

/**
 * @route  GET /api/v1/auth/me
 * @access Protected (JWT)
 */
router.get('/me', authenticate, me);

export default router;
