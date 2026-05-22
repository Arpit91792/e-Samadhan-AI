/**
 * Run: node config/testConnection.js
 * Tests MongoDB connection and prints result
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const uri = process.env.MONGO_URI;
console.log('\n🔍 Testing MongoDB connection...');
console.log('URI (masked):', uri?.replace(/:([^@]+)@/, ':****@'));

if (!uri) {
      console.error('❌ MONGO_URI is not set in .env');
      process.exit(1);
}

try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
      console.log('✅ Connected to:', mongoose.connection.host);
      console.log('📦 Database:', mongoose.connection.name);
      await mongoose.disconnect();
      console.log('✅ Connection test passed!\n');
      process.exit(0);
} catch (err) {
      console.error('❌ Connection failed:', err.message);
      if (err.message.includes('bad auth') || err.message.includes('authentication')) {
            console.error('\n🔧 FIX: The username or password in MONGO_URI is wrong.');
            console.error('   1. Go to MongoDB Atlas → Database Access');
            console.error('   2. Check the username is: Arpit');
            console.error('   3. Reset the password and update .env');
            console.error('   4. Encode @ as %40 in the URI\n');
      }
      if (err.message.includes('whitelist') || err.message.includes('IP')) {
            console.error('\n🔧 FIX: Your IP is not whitelisted.');
            console.error('   Go to Atlas → Network Access → Add 0.0.0.0/0\n');
      }
      process.exit(1);
}
