import { Router } from 'express';
import { EventController } from '../controllers/EventController';
import { ApiKeyController } from '../controllers/ApiKeyController';

const router = Router();

router.get('/events', EventController.list);

// API Keys
router.post('/keys', ApiKeyController.create);
router.get('/keys', ApiKeyController.list);
router.delete('/keys/:id', ApiKeyController.revoke);

export default router;
