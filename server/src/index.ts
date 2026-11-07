import express from 'express';
import http from 'node:http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { initDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';
import { ensureSironiMenuItems } from './db/sironiMenuData.js';
import { initSocket } from './socket/index.js';

import { authRouter } from './routes/authRoutes.js';
import { tableRouter } from './routes/tableRoutes.js';
import { menuRouter } from './routes/menuRoutes.js';
import { orderRouter } from './routes/orderRoutes.js';
import { kdsRouter } from './routes/kdsRoutes.js';
import { serviceRouter } from './routes/serviceRoutes.js';
import { cashierRouter } from './routes/cashierRoutes.js';
import { paymentRouter } from './routes/paymentRoutes.js';
import { hotelRouter } from './routes/hotelRoutes.js';
import { inventoryRouter } from './routes/inventoryRoutes.js';
import { reportRouter } from './routes/reportRoutes.js';
import { saasRouter } from './routes/saasRoutes.js';
import { brandingRouter } from './routes/brandingRoutes.js';
import { showcaseRouter } from './routes/showcaseRoutes.js';
import { centralOrderRouter } from './routes/centralOrderRoutes.js';
import { deliveryRouter } from './routes/deliveryRoutes.js';
import { cateringRouter } from './routes/cateringRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false, // For QR and local canvas rendering
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    system: 'Sironi Restaurants QR POS Engine',
    version: '1.0.0',
  });
});

// Mount Module API Routers
app.use('/api/auth', authRouter);
app.use('/api/tables', tableRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/kds', kdsRouter);
app.use('/api/service', serviceRouter);
app.use('/api/cashier', cashierRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/hotel', hotelRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/reports', reportRouter);
app.use('/api/saas', saasRouter);
app.use('/api/branding', brandingRouter);
app.use('/api/showcase', showcaseRouter);
app.use('/api/central-orders', centralOrderRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/catering', cateringRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error. Our technical team has been notified.',
  });
});

const PORT = Number(process.env.PORT) || 8966;
const ALT_PORT = 9896;

// Initialize Database & Seed
try {
  initDatabase();
  seedDatabase();
  ensureSironiMenuItems();
  console.log('Database initialized and verified successfully.');
} catch (err) {
  console.error('Database initialization error:', err);
}

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` HOTEL QR RESTAURANT & KDS SERVER RUNNING ON PORT ${PORT}`);
  console.log(` Local API: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

// Dual listener on alternative port 9896 in case user intended 9896
try {
  const altServer = http.createServer(app);
  altServer.listen(ALT_PORT, () => {
    console.log(` Also listening on alternative port http://localhost:${ALT_PORT}`);
  });
} catch (e) {
  // Ignore if port 9896 is busy
}

export { app, server };

