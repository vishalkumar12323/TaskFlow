import { Router } from 'express';
import { listTasks, getTask, create, update, remove } from './tasks.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * @route  GET /api/v1/tasks
 * @access Protected — Users see own tasks, Admins see all
 * @query  status, priority, page, limit
 */
router.get('/', listTasks);

/**
 * @route  POST /api/v1/tasks
 * @access Protected
 */
router.post('/', create);

/**
 * @route  GET /api/v1/tasks/:id
 * @access Protected — owner or admin only
 */
router.get('/:id', getTask);

/**
 * @route  PUT /api/v1/tasks/:id
 * @access Protected — owner or admin only
 */
router.put('/:id', update);

/**
 * @route  DELETE /api/v1/tasks/:id
 * @access Protected — owner or admin only
 */
router.delete('/:id', remove);

export default router;
