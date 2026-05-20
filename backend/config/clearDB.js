import mongoose from 'mongoose';

const clearDatabase = async () => {
      try {
            // Safety check: Never clear in production
            if (process.env.NODE_ENV === 'production') {
                  console.warn('⚠️  Auto-clear is disabled in production.');
                  return;
            }

            // Check if auto-clear is enabled
            if (process.env.AUTO_CLEAR_DB !== 'true') {
                  return;
            }

            // Wait for mongoose to be fully connected if not already
            if (mongoose.connection.readyState !== 1) {
                  console.warn('⚠️  Mongoose is not connected. Cannot clear database.');
                  return;
            }

            const collections = mongoose.connection.collections;
            
            // Optional advanced feature: Clear only selected collections
            // Can be specified in .env like: CLEAR_COLLECTIONS=users,complaints
            const selectedCollections = process.env.CLEAR_COLLECTIONS 
                  ? process.env.CLEAR_COLLECTIONS.split(',').map(c => c.trim())
                  : [];

            for (const key in collections) {
                  const collection = collections[key];
                  
                  // If specific collections are targeted, only clear those
                  if (selectedCollections.length > 0 && !selectedCollections.includes(collection.name)) {
                        continue;
                  }
                  
                  await collection.deleteMany({});
            }

            console.log('✅ Database Cleared');
      } catch (error) {
            console.error('❌ Error clearing database:', error.message);
      }
};

export default clearDatabase;
