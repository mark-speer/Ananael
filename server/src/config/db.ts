import mongoose from 'mongoose';

/**
 * Establish a Mongoose connection to MongoDB.
 * Uses MONGO_URI from the environment (Compose: mongodb://mongo:27017/ananael).
 */
const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in the environment');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
