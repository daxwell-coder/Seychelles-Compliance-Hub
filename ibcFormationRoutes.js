import { Router } from 'express';
import { checkAuth } from '../middleware/authMiddleware.js';
import { createIbcFormation } from '../controllers/ibcFormationController.js';

const router = Router();

// All routes in this file are for '/api/ibc-formations'

// POST /api/ibc-formations
// Creates a new IBC formation application. Protected by authentication.
router.post('/', checkAuth, createIbcFormation);

export default router;