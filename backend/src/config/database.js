const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const logger = require('../utils/logger');

let memoryServer;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.warn(`MongoDB connection error: ${error.message}`);

    try {
      memoryServer = await MongoMemoryServer.create({
        instance: { dbName: 'taskflow' },
      });

      const memoryUri = memoryServer.getUri();
      process.env.MONGODB_URI = memoryUri;

      const conn = await mongoose.connect(memoryUri, {
        serverSelectionTimeoutMS: 5000,
      });

      logger.info('Using in-memory MongoDB for local development');
      return conn;
    } catch (memoryError) {
      logger.error(`In-memory MongoDB startup failed: ${memoryError.message}`);
      process.exit(1);
    }
  }
};

// Graceful disconnect
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
  logger.info('MongoDB disconnected on app termination');
  process.exit(0);
});

module.exports = connectDB;
