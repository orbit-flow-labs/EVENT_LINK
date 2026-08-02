import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './db';
import authRouter from './routes/auth';
import ticketsRouter from './routes/tickets';
import webhooksRouter from './routes/webhooks';
import eventsRouter from './routes/events';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup
app.use(cors({ origin: '*', credentials: true }));

// Raw body parser for webhooks signature check
app.use('/api/webhooks', express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// JSON parser for rest routes
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/events', eventsRouter);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'EventLink Node.js Backend API',
    stellarNetwork: 'Stellar Testnet',
  });
});

// Start Server & Connect DB
async function bootstrap() {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`⚡ EventLink Node.js Backend API running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;
