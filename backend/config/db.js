import mongoose from './mongooseSetup.js';
import { normalizeMongoUri, maskMongoUri } from '../utils/mongoUri.js';

/** readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting */
export const isDbConnected = () => mongoose.connection.readyState === 1;

export const getDbStateLabel = () => {
      const labels = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      return labels[mongoose.connection.readyState] ?? 'unknown';
};

const CONNECT_OPTS = {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      family: 4,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Connect to MongoDB. Returns true only when connected.
 */
function getUriCandidates() {
      const list = [
            process.env.MONGO_URI,
            process.env.MONGO_URI_STANDARD,
            process.env.MONGODB_URI,
      ]
            .map(normalizeMongoUri)
            .filter(Boolean);

      return [...new Set(list)];
}

const connectDB = async (retries = 3) => {
      const uris = getUriCandidates();

      if (!uris.length) {
            console.error('\n❌ MONGO_URI is not defined in backend/.env\n');
            return false;
      }

      let lastError = null;

      for (const uri of uris) {
            for (let attempt = 1; attempt <= retries; attempt++) {
                  try {
                        if (mongoose.connection.readyState === 1) {
                              return true;
                        }

                        if (mongoose.connection.readyState !== 0) {
                              await mongoose.disconnect().catch(() => {});
                        }

                        console.log(`🔄 Connecting to MongoDB (attempt ${attempt}/${retries})…`);
                        console.log(`   URI: ${maskMongoUri(uri)}`);

                        const opts = { ...CONNECT_OPTS };
                        if (uri.startsWith('mongodb://') && !uri.includes('mongodb+srv')) {
                              opts.directConnection = true;
                        }

                        const conn = await mongoose.connect(uri, opts);

                        console.log('✅ MongoDB Connected Successfully');
                        console.log(`   Host: ${conn.connection.host}`);
                        console.log(`   Database: ${conn.connection.name}`);

                        mongoose.connection.on('error', (err) => {
                              console.error('❌ MongoDB runtime error:', err.message);
                        });

                        mongoose.connection.on('disconnected', () => {
                              console.warn('⚠️  MongoDB disconnected');
                        });

                        mongoose.connection.on('reconnected', () => {
                              console.log('✅ MongoDB reconnected');
                        });

                        return true;
                  } catch (error) {
                        lastError = error;
                        console.error(`\n❌ MongoDB connection attempt ${attempt} failed: ${error.message}\n`);

                        if (
                              error.message.includes('whitelist') ||
                              error.message.includes('IP') ||
                              error.message.includes('ECONNREFUSED') ||
                              error.message.includes('querySrv')
                        ) {
                              console.error('   FIX 1: Atlas → Network Access → Allow 0.0.0.0/0 (dev)');
                              console.error('   FIX 2: If querySrv fails, set MONGO_URI_STANDARD (non-SRV string from Atlas)');
                              console.error('   FIX 3: Encode @ in password as %40\n');
                        } else if (error.message.includes('authentication') || error.message.includes('bad auth')) {
                              console.error('   FIX: Wrong username/password in MONGO_URI\n');
                        }

                        if (attempt < retries) {
                              await sleep(2000 * attempt);
                        }
                  }
            }
      }

      if (lastError) {
            console.error('   All connection URIs failed. Run: npm run db:check\n');
      }

      return false;
};

export default connectDB;
export { mongoose };
