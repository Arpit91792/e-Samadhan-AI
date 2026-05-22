/**
 * resetDatabase.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Temporary Development Database Reset Utility
 *
 * ✅ Clears ALL collections on demand
 * ✅ Only runs in development mode (NODE_ENV=development)
 * ✅ Requires DEV_RESET_DATABASE=true to activate
 * ✅ NEVER touches production data
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';

// Collections to wipe — maps friendly name → MongoDB collection name
const DEV_COLLECTIONS = {
      users: 'users',
      admins: 'admins',
      officers: 'officers',
      complaints: 'complaints',
      otps: 'otps',
      livenesssessions: 'livenesssessions',
      livenessattempts: 'livenessattempts',
      notifications: 'notifications',
      auditlogs: 'auditlogs',
      feedbacks: 'feedbacks',
      verifications: 'verifications',
      departments: 'departments',
      sessions: 'sessions',
};

// Collections that are NEVER wiped on startup — admin accounts must persist
// so the admin doesn't need to re-register after every server restart.
// On shutdown (force=true) everything is still wiped for a truly clean slate.
const STARTUP_PRESERVE = new Set(['admins']);

/**
 * Wipe every development collection.
 * Safe-guards:
 *   • Skips if NODE_ENV === 'production'
 *   • Skips if DEV_RESET_DATABASE !== 'true'
 *   • Skips if Mongoose is not connected
 *
 * @param {object} [options]
 * @param {boolean} [options.force=false]  Bypass the DEV_RESET_DATABASE flag check (for shutdown hooks)
 * @param {string[]} [options.only]        Limit reset to these collection names
 * @returns {Promise<{cleared: string[], skipped: string[], errors: string[]}>}
 */
const resetDatabase = async ({ force = false, only = [] } = {}) => {
      const result = { cleared: [], skipped: [], errors: [] };

      // ── Production guard ──────────────────────────────────────────────────────
      if (process.env.NODE_ENV === 'production') {
            console.warn('🛡️  [resetDatabase] BLOCKED — production mode. Data is safe.');
            return result;
      }

      // ── Flag guard ────────────────────────────────────────────────────────────
      if (!force && process.env.DEV_RESET_DATABASE !== 'true') {
            console.log('ℹ️  [resetDatabase] Skipped — DEV_RESET_DATABASE is not "true".');
            return result;
      }

      // ── Connection guard ──────────────────────────────────────────────────────
      if (mongoose.connection.readyState !== 1) {
            console.warn('⚠️  [resetDatabase] Mongoose not connected — cannot reset.');
            return result;
      }

      console.log('\n🗑️  [resetDatabase] Clearing all development collections…');
      if (!force) {
            console.log('   ℹ️  Startup reset — admin accounts are preserved (re-login not required).');
      }

      const targetCollections = only.length > 0
            ? only.map(n => n.toLowerCase())
            : Object.values(DEV_COLLECTIONS);

      const existingCollections = mongoose.connection.collections;

      for (const collectionName of targetCollections) {
            // On startup (force=false) skip preserved collections
            if (!force && STARTUP_PRESERVE.has(collectionName)) {
                  result.skipped.push(collectionName);
                  console.log(`   🛡️  ${collectionName.padEnd(20)} — preserved (admin accounts kept)`);
                  continue;
            }
            try {
                  if (existingCollections[collectionName]) {
                        const { deletedCount } = await existingCollections[collectionName].deleteMany({});
                        result.cleared.push(collectionName);
                        console.log(`   ✅ ${collectionName.padEnd(20)} — ${deletedCount} document(s) removed`);
                  } else {
                        result.skipped.push(collectionName);
                        console.log(`   ⏭️  ${collectionName.padEnd(20)} — collection not found (skipped)`);
                  }
            } catch (err) {
                  result.errors.push(collectionName);
                  console.error(`   ❌ ${collectionName.padEnd(20)} — error: ${err.message}`);
            }
      }

      console.log(`\n   📊 Summary: ${result.cleared.length} cleared | ${result.skipped.length} skipped | ${result.errors.length} errors`);
      console.log('   🧹 Development database reset complete.\n');

      return result;
};

export default resetDatabase;
export { DEV_COLLECTIONS, STARTUP_PRESERVE };
