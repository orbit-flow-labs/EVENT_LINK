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

// Health check and root status endpoints
app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'EventLink Node.js Backend API',
    timestamp: new Date().toISOString(),
    stellarNetwork: 'Stellar Testnet',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/register, POST /api/auth/login, GET /api/auth/me',
      tickets: 'POST /api/tickets/purchase, POST /api/tickets/claim',
      webhooks: 'POST /api/webhooks/stripe, POST /api/webhooks/flutterwave',
      events: 'GET /api/events, POST /api/events',
    }
  });
});

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
  if (process.env.NODE_ENV === 'production') {
    const requiredSecrets = ['JWT_SECRET', 'STRIPE_WEBHOOK_SECRET', 'FLUTTERWAVE_SECRET_HASH'];
    const missingSecrets = requiredSecrets.filter((name) => !process.env[name]?.trim());
    if (missingSecrets.length > 0) {
      throw new Error(`Missing required production environment variables: ${missingSecrets.join(', ')}`);
    }
    if (process.env.JWT_SECRET!.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
  }

  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`⚡ EventLink Node.js Backend API running on http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap();
}

export default app;
