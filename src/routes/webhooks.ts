import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { apiKeyAuth } from '../middlewares/apiKeyAuth';

const router = Router();

router.post('/ingest', apiKeyAuth, WebhookController.ingest);

export default router;
