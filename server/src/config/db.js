import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri === 'your_mongodb_atlas_connection_string') {
    console.error('❌ [Database Configuration Error]: MONGODB_URI is missing or unconfigured in server/.env.');
    console.error('ℹ️ Please create server/.env and provide your valid MongoDB Atlas or local connection string.');
    console.error('   Example: MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/wastewise?retryWrites=true&w=majority');
    process.exit(1);
  }

  // Mask credentials in connection URI to prevent credential leakage
  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`✅ [MongoDB Atlas Connected]: ${conn.connection.host}/${conn.connection.name}`);
    console.log(`🔒 [Database Target]: ${maskedUri.split('@')[1] ? 'Atlas Cluster (' + maskedUri.split('@')[1].split('/')[0] + ')' : maskedUri}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Connection Failed]: Unable to connect to database at ${maskedUri}`);
    console.error(`❌ Details: ${error.message}`);
    console.error('❌ Server startup aborted. Verify network access (IP whitelist 0.0.0.0/0 on Atlas) and credentials in server/.env.');
    process.exit(1);
  }
};
