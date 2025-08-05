import express from 'express';
import cors from 'cors';
import 'dotenv/config'; // To load environment variables

// Import API routes
import applicationRoutes from './routes/applicationRoutes.js';
import ibcFormationRoutes from './routes/ibcFormationRoutes.js';

const app = express();
const port = process.env.PORT || 8080;

// --- Middleware ---
// Enable Cross-Origin Resource Sharing for all routes
app.use(cors());
// Parse incoming JSON requests
app.use(express.json());

// --- API Routes ---
app.use('/api/applications', applicationRoutes);
app.use('/api/ibc-formations', ibcFormationRoutes);

// --- Server Activation ---
app.listen(port, () => {
  console.log(`🚀 MCP Server is running on port ${port}`);
});