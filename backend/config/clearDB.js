/**
 * clearDB.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Legacy startup clear — kept for backward compatibility.
 * Now delegates to the full resetDatabase utility.
 *
 * Behaviour:
 *   • NODE_ENV=production  → always skipped (data is safe)
 *   • AUTO_CLEAR_DB=true   → clears only the collections listed in
 *                            CLEAR_COLLECTIONS (or all non-critical ones)
 *   • DEV_RESET_DATABASE=true → full wipe via resetDatabase()
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import resetDatabase from '../utils/resetDatabase.js';

const clearDatabase = async () => {
      try {
            // ── Production guard ────────────────────────────────────────────────────
            if (process.env.NODE_ENV === 'production') {
                  console.warn('⚠️  [clearDB] Auto-clear is disabled in production.');
                  return;
            }

            // ── Full dev reset (preferred) ──────────────────────────────────────────
            if (process.env.DEV_RESET_DATABASE === 'true') {
                  await resetDatabase({ force: false });
                  return;
            }

            // ── Legacy AUTO_CLEAR_DB behaviour ──────────────────────────────────────
            if (process.env.AUTO_CLEAR_DB !== 'true') {
                  return;
            }

            if (mongoose.connection.readyState !== 1) {
                  console.warn('⚠️  [clearDB] Mongoose not connected — cannot clear database.');
                  return;
            }

            const collections = mongoose.connection.collections;

            // Optional: CLEAR_COLLECTIONS=users,complaints — only clear listed collections
            const selectedCollections = process.env.CLEAR_COLLECTIONS
                  ? process.env.CLEAR_COLLECTIONS.split(',').map((c) => c.trim())
                  : [];

            // When clearing all, keep admin/officer accounts so login & dashboard keep working
            const preserveWhenFullClear = new Set(['admins', 'officers', 'users']);

            for (const key in collections) {
                  const collection = collections[key];

                  if (selectedCollections.length > 0 && !selectedCollections.includes(collection.name)) {
                        continue;
                  }
                  if (selectedCollections.length === 0 && preserveWhenFullClear.has(collection.name)) {
                        continue;
                  }

                  await collection.deleteMany({});
            }

            console.log('✅ [clearDB] Database cleared (legacy AUTO_CLEAR_DB mode)');
      } catch (error) {
            console.error('❌ [clearDB] Error clearing database:', error.message);
      }
};

export default clearDatabase;
