import mongoose from 'mongoose';
import { config } from './index.js';

let mongod = null;

export async function connectDB() {
  const uri = config.mongoUri;

  if (uri) {
    try {
      console.log(`[Database] Connecting to configured MongoDB...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Successfully connected to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}`);
      return;
    } catch (err) {
      console.warn(`[Database] Could not connect to configured MONGODB_URI: ${err.message}`);
      if (config.nodeEnv === 'production') {
        throw err;
      }
      console.log(`[Database] Falling back to embedded in-memory MongoDB for local development/testing...`);
    }
  } else {
    console.log(`[Database] No MONGODB_URI provided. Starting embedded in-memory MongoDB for local zero-config usage...`);
  }

  // Fallback to MongoMemoryServer in development/testing
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Connected to in-memory MongoDB at ${memoryUri}`);
  } catch (memErr) {
    console.error(`[Database] Failed to start in-memory MongoDB:`, memErr);
    throw memErr;
  }
}

export async function disconnectDB() {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongod) {
      await mongod.stop();
      mongod = null;
    }
    console.log(`[Database] Disconnected.`);
  } catch (err) {
    console.error(`[Database] Disconnect error:`, err);
  }
}
