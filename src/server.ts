import dotenv from 'dotenv';
dotenv.config();

import { validateEnv } from './config/env';
import { connectRedis } from './config/redis';
import app from './app';

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    validateEnv();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();