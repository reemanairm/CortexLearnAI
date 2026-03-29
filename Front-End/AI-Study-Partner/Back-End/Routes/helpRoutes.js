import express from 'express';
import { submitHelpRequest, getMyHelpRequests } from '../controllers/helpController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', submitHelpRequest);
router.get('/my-requests', getMyHelpRequests);

export default router;
