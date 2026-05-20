import '../config/loadEnv.js';
import '../config/mongooseSetup.js';
import { normalizeMongoUri, maskMongoUri } from '../utils/mongoUri.js';
import mongoose from '../config/mongooseSetup.js';

const uris = [process.env.MONGO_URI, process.env.MONGO_URI_STANDARD, process.env.MONGODB_URI]
      .map(normalizeMongoUri)
      .filter(Boolean);

if (!uris.length) {
      console.error('❌ MONGO_URI missing in backend/.env');
      process.exit(1);
}

for (const uri of uris) {
      console.log('Testing:', maskMongoUri(uri));
      try {
            const opts = { serverSelectionTimeoutMS: 30000, family: 4 };
            if (uri.startsWith('mongodb://') && !uri.includes('mongodb+srv')) {
                  opts.directConnection = true;
            }
            await mongoose.connect(uri, opts);
            console.log('✅ Connected:', mongoose.connection.host, '/', mongoose.connection.name);
            await mongoose.disconnect();
            process.exit(0);
      } catch (e) {
            console.error('❌ Failed:', e.message);
            await mongoose.disconnect().catch(() => {});
      }
}

console.error('\nAll URIs failed. Fix Atlas network access or set MONGO_URI_STANDARD.');
process.exit(1);
