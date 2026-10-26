import { Router } from 'express';
import { createClipboardShare, getClipboardShare } from '../controllers/clipboardController.js';
import { codeRetrievalLimiter, uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/', uploadLimiter, createClipboardShare);
router.get('/:code', codeRetrievalLimiter, getClipboardShare);

export default router;
