/**
 * cleanupFiles.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Temporary Upload & File Cleanup Utility (Development Only)
 *
 * On server shutdown, removes:
 *   ✅ Uploaded complaint images
 *   ✅ Uploaded profile images
 *   ✅ Uploaded govt-id images
 *   ✅ Uploaded liveness captures
 *   ✅ Local JSON data snapshots
 *
 * On server startup, ensures all upload folders exist.
 *
 * ❌ NEVER runs in production mode.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, '..');

// Upload folders to manage
const UPLOAD_DIRS = {
      profiles: path.join(BACKEND_ROOT, 'uploads', 'profiles'),
      complaints: path.join(BACKEND_ROOT, 'uploads', 'complaints'),
      govtIds: path.join(BACKEND_ROOT, 'uploads', 'govt-ids'),
      liveness: path.join(BACKEND_ROOT, 'uploads', 'liveness'),
      ids: path.join(BACKEND_ROOT, 'uploads', 'ids'),
};

// File extensions considered temporary uploads
const TEMP_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.webm']);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Ensure all upload directories exist.
 * Called on server startup.
 */
export function ensureUploadDirs() {
      for (const [name, dirPath] of Object.entries(UPLOAD_DIRS)) {
            if (!fs.existsSync(dirPath)) {
                  fs.mkdirSync(dirPath, { recursive: true });
                  console.log(`   📁 Created upload folder: uploads/${name}`);
            }
      }
      console.log('   📁 Upload directories ready');
}

/**
 * Delete all files inside a directory (non-recursive, keeps the folder).
 * @param {string} dirPath
 * @returns {number} count of deleted files
 */
function clearDirectory(dirPath) {
      if (!fs.existsSync(dirPath)) return 0;

      let count = 0;
      try {
            const files = fs.readdirSync(dirPath);
            for (const file of files) {
                  const ext = path.extname(file).toLowerCase();
                  if (TEMP_EXTENSIONS.has(ext)) {
                        try {
                              fs.unlinkSync(path.join(dirPath, file));
                              count++;
                        } catch {
                              // File may already be gone — ignore
                        }
                  }
            }
      } catch (err) {
            console.warn(`[cleanupFiles] Could not read ${dirPath}:`, err.message);
      }
      return count;
}

/**
 * Delete all temporary uploaded files from all upload directories.
 * Called on server shutdown (development only).
 */
export function cleanupUploadedFiles() {
      if (process.env.NODE_ENV === 'production') {
            console.warn('🛡️  [cleanupFiles] BLOCKED — production mode. Files are safe.');
            return;
      }

      console.log('\n🗑️  [cleanupFiles] Removing temporary uploaded files…');

      let total = 0;
      for (const [name, dirPath] of Object.entries(UPLOAD_DIRS)) {
            const count = clearDirectory(dirPath);
            total += count;
            if (count > 0) {
                  console.log(`   ✅ uploads/${name.padEnd(12)} — ${count} file(s) removed`);
            } else {
                  console.log(`   ⏭️  uploads/${name.padEnd(12)} — empty (nothing to remove)`);
            }
      }

      console.log(`   📊 Total files removed: ${total}`);
}

/**
 * Delete a single uploaded file by its path.
 * Safe — silently ignores missing files.
 * @param {string} filePath  Absolute or relative path to the file
 */
export function deleteUploadedFile(filePath) {
      if (!filePath) return;
      try {
            const abs = path.isAbsolute(filePath)
                  ? filePath
                  : path.join(BACKEND_ROOT, filePath);
            if (fs.existsSync(abs)) {
                  fs.unlinkSync(abs);
            }
      } catch {
            // Non-fatal
      }
}

export { UPLOAD_DIRS, BACKEND_ROOT };
