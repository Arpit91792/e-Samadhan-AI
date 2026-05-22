/**
 * dbInitializer.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Development Database Initializer
 *
 * Runs on every server startup to:
 *   ✅ Ensure all upload folders exist
 *   ✅ Ensure all local data/ folders exist
 *   ✅ Initialize empty JSON snapshot files
 *   ✅ Reset the MongoDB database (if DEV_RESET_DATABASE=true)
 *   ✅ Log the current mode clearly
 *
 * In production:
 *   ❌ No reset
 *   ❌ No file cleanup
 *   ✅ Upload folders still created if missing
 * ─────────────────────────────────────────────────────────────────────────────
 */

import resetDatabase from './resetDatabase.js';
import { ensureDataDirs, initializeSnapshots } from './devStorage.js';
import { ensureUploadDirs } from './cleanupFiles.js';

/**
 * Full startup initialization sequence.
 * Call this once after MongoDB connects, before the HTTP server starts.
 */
const initializeDatabase = async () => {
      const isDev = process.env.NODE_ENV !== 'production';
      const shouldReset = process.env.DEV_RESET_DATABASE === 'true';

      console.log('\n┌─────────────────────────────────────────────────────┐');
      console.log('│  🗄️  e-Samadhan AI — Database Initializer            │');
      console.log(`│  Mode: ${isDev ? '🔧 DEVELOPMENT (temporary data)' : '🚀 PRODUCTION (permanent data)'}  │`);
      console.log('└─────────────────────────────────────────────────────┘');

      // ── Step 1: Ensure upload directories ──────────────────────────────────────
      console.log('\n📁 Step 1 — Upload Directories');
      ensureUploadDirs();

      if (isDev) {
            // ── Step 2: Ensure local data directories ────────────────────────────────
            console.log('\n📁 Step 2 — Local Data Directories');
            ensureDataDirs();

            // ── Step 3: Initialize JSON snapshots ────────────────────────────────────
            console.log('\n📄 Step 3 — JSON Snapshot Files');
            initializeSnapshots();

            // ── Step 4: Reset MongoDB collections ────────────────────────────────────
            if (shouldReset) {
                  console.log('\n🗑️  Step 4 — MongoDB Reset (DEV_RESET_DATABASE=true)');
                  console.log('   Officers, complaints, users and all transient data will be wiped.');
                  console.log('   Admin accounts are preserved — no need to re-register.');
                  await resetDatabase({ force: false });
            } else {
                  console.log('\nℹ️  Step 4 — MongoDB Reset SKIPPED (DEV_RESET_DATABASE=false)');
                  console.log('   Set DEV_RESET_DATABASE=true in .env to enable auto-reset on startup.');
            }

            console.log('\n✅ Development database initialized — fresh empty system ready.');
            console.log('   Officers and complaints are erased on every server start/stop.\n');
      } else {
            console.log('\n✅ Production mode — database initialization complete.');
            console.log('   Permanent data is preserved.\n');
      }
};

export default initializeDatabase;
