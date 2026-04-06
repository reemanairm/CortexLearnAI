import express from 'express';
import {
    getUsers,
    getDocuments,
    getHelpRequests,
    getStats,
    deleteUser,
    deleteSystemDocument,
    resolveHelpRequest
} from '../controllers/adminController.js';
import protect from '../middleware/auth.js';
import { protectAdmin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// All routes here are protected by both general user auth and admin auth
router.use(protect);
router.use(protectAdmin);

router.route('/users').get(getUsers);
router.route('/user/:id').delete(deleteUser);

router.route('/documents').get(getDocuments);
router.route('/document/:id').delete(deleteSystemDocument);

router.route('/help-requests').get(getHelpRequests);
router.route('/help-requests/:id/resolve').put(resolveHelpRequest);
router.route('/stats').get(getStats);

export default router;
