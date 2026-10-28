import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wastewise';
  
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout to fallback if no local server
    });
    console.log(`✅ [MongoDB Connected]: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ [MongoDB Warning]: Unable to connect to MongoDB at ${mongoUri}`);
    console.warn(`ℹ️ [WasteWise Adaptive Mode]: Running with In-Memory / Mock DB synchronization fallback so all CRUD endpoints and features function seamlessly.`);
    return false;
  }
};
