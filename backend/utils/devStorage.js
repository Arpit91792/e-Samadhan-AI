/**
 * devStorage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Local JSON File Storage Manager (Development Only)
 *
 * Saves lightweight JSON snapshots of each collection into:
 *   backend/data/<collection>.json
 *
 * These files are:
 *   ✅ Written during runtime for debugging / inspection
 *   ✅ Cleared automatically on server shutdown
 *   ✅ Recreated fresh on every startup
 *   ❌ Never used in production
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');

// Sub-folders inside data/
const DATA_SUBDIRS = [
      'users',
      'admins',
      'officers',
      'complaints',
      'otp',
      'liveness',
      'sessions',
      'notifications',
      'analytics',
      'logs',
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ensure the data directory and all sub-folders exist */
export function ensureDataDirs() {
      if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      for (const sub of DATA_SUBDIRS) {
            const full = path.join(DATA_DIR, sub);
            if (!fs.existsSync(full)) {
                  fs.mkdirSync(full, { recursive: true });
            }
      }

      console.log('   📁 Local data directories ready:', DATA_DIR);
}

/** Write a JSON snapshot for a collection */
export function writeSnapshot(collectionName, data) {
      if (process.env.NODE_ENV === 'production') return;

      try {
            const filePath = path.join(DATA_DIR, `${collectionName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
            // Non-fatal — snapshots are optional
            console.warn(`[devStorage] Could not write snapshot for ${collectionName}:`, err.message);
      }
}

/** Read a JSON snapshot (returns [] if missing) */
export function readSnapshot(collectionName) {
      try {
            const filePath = path.join(DATA_DIR, `${collectionName}.json`);
            if (!fs.existsSync(filePath)) return [];
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
            return [];
      }
}

/**
 * Clear all JSON snapshot files inside data/
 * Called on server shutdown.
 */
export function clearAllSnapshots() {
      if (process.env.NODE_ENV === 'production') return;

      try {
            if (!fs.existsSync(DATA_DIR)) return;

            let count = 0;

            // Remove top-level .json files
            const entries = fs.readdirSync(DATA_DIR);
            for (const entry of entries) {
                  const full = path.join(DATA_DIR, entry);
                  const stat = fs.statSync(full);

                  if (stat.isFile() && entry.endsWith('.json')) {
                        fs.unlinkSync(full);
                        count++;
                  }

                  // Also clear .json files inside sub-folders
                  if (stat.isDirectory()) {
                        const subEntries = fs.readdirSync(full);
                        for (const sub of subEntries) {
                              if (sub.endsWith('.json')) {
                                    fs.unlinkSync(path.join(full, sub));
                                    count++;
                              }
                        }
                  }
            }

            if (count > 0) {
                  console.log(`   🗑️  Cleared ${count} local JSON snapshot file(s)`);
            }
      } catch (err) {
            console.warn('[devStorage] Error clearing snapshots:', err.message);
      }
}

/**
 * Write empty placeholder JSON files for all collections.
 * Called on startup so the data/ folder always has a known structure.
 */
export function initializeSnapshots() {
      if (process.env.NODE_ENV === 'production') return;

      const collections = [
            'users', 'admins', 'officers', 'complaints',
            'otp', 'liveness', 'sessions', 'notifications',
            'analytics', 'logs',
      ];

      for (const name of collections) {
            const filePath = path.join(DATA_DIR, `${name}.json`);
            if (!fs.existsSync(filePath)) {
                  fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');
            }
      }

      console.log('   📄 Local JSON snapshot files initialized');
}

export { DATA_DIR, DATA_SUBDIRS };
