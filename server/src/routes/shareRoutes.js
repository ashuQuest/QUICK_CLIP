import { Router } from 'express';
import { getShareMetadata, downloadFile, deleteShare } from '../controllers/shareController.js';
import { codeRetrievalLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/:code', codeRetrievalLimiter, getShareMetadata);
router.get('/:code/download', codeRetrievalLimiter, downloadFile);
router.delete('/:id', deleteShare);

export default router;
