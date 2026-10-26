import { Router } from 'express';
import {
  initiateUpload,
  getPartUploadUrl,
  completeUpload,
  abortUpload,
  handleLocalStreamUpload,
  handleLocalPartUpload,
} from '../controllers/uploadController.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/initiate', uploadLimiter, initiateUpload);
router.post('/:id/part-url', getPartUploadUrl);
router.post('/:id/complete', completeUpload);
router.post('/:id/abort', abortUpload);

// Local streaming routes (Raw streaming without body-parser limit)
router.put('/local/:storageKey(*)/part/:partNumber', handleLocalPartUpload);
router.put('/local/:storageKey(*)', handleLocalStreamUpload);

export default router;
