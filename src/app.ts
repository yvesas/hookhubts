import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

import webhookRoutes from './routes/webhooks';
import apiRoutes from './routes/api';
import { WebController } from './controllers/WebController';

// ...

// View engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/webhooks', webhookRoutes);
app.use('/api', apiRoutes);

// Web Routes
app.get('/', WebController.index);
app.get('/keys', WebController.keys);


export default app;
