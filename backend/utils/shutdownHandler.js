/**
 * shutdownHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Graceful Shutdown Handler
 *
 * Listens for process termination signals and:
 *   ✅ Clears all MongoDB collections (dev only)
 *   ✅ Deletes all temporary uploaded files (dev only)
 *   ✅ Clears local JSON snapshot files (dev only)
 *   ✅ Closes the HTTP server gracefully
 *   ✅ Disconnects MongoDB
 *
 * Triggered by:
 *   • SIGINT  (Ctrl+C in terminal)
 *   • SIGTERM (process manager / Docker stop)
 *   • SIGUSR2 (nodemon restart)
 *   • beforeExit
 * ─────────────────────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import resetDatabase from './resetDatabase.js';
import { clearAllSnapshots } from './devStorage.js';
import { cleanupUploadedFiles } from './cleanupFiles.js';

let isShuttingDown = false;

/**
 * Register all shutdown hooks on the process.
 * @param {import('http').Server} httpServer  The running HTTP server instance
 */
export function registerShutdownHandlers(httpServer) {
      const shutdown = async (signal) => {
            if (isShuttingDown) return;
            isShuttingDown = true;

            console.log(`\n\n🔴 [shutdown] Received ${signal} — starting graceful shutdown…`);

            const isDev = process.env.NODE_ENV !== 'production';

            if (isDev) {
                  console.log('\n🧹 [shutdown] Development mode — erasing all temporary data…\n');

                  // ── 1. Wipe MongoDB collections ───────────────────────────────────────
                  try {
                        await resetDatabase({ force: true });
                  } catch (err) {
                        console.error('   ❌ MongoDB reset error:', err.message);
                  }

                  // ── 2. Delete uploaded files ──────────────────────────────────────────
                  try {
                        cleanupUploadedFiles();
                  } catch (err) {
                        console.error('   ❌ File cleanup error:', err.message);
                  }

                  // ── 3. Clear JSON snapshots ───────────────────────────────────────────
                  try {
                        clearAllSnapshots();
                  } catch (err) {
                        console.error('   ❌ Snapshot cleanup error:', err.message);
                  }

                  console.log('\n✅ [shutdown] All temporary data erased.');
            } else {
                  console.log('🛡️  [shutdown] Production mode — data preserved.');
            }

            // ── 4. Close HTTP server ──────────────────────────────────────────────────
            httpServer.close(() => {
                  console.log('🔌 [shutdown] HTTP server closed.');

                  // ── 5. Disconnect MongoDB ───────────────────────────────────────────────
                  mongoose.connection.close(false, () => {
                        console.log('🗄️  [shutdown] MongoDB connection closed.');
                        console.log('👋 [shutdown] e-Samadhan AI server stopped cleanly.\n');
                        process.exit(0);
                  });
            });

            // Force exit after 10 seconds if graceful shutdown hangs
            setTimeout(() => {
                  console.error('⏰ [shutdown] Forced exit after timeout.');
                  process.exit(1);
            }, 10_000).unref();
      };

      // ── Register signals ────────────────────────────────────────────────────────
      process.on('SIGINT', () => shutdown('SIGINT'));
      process.on('SIGTERM', () => shutdown('SIGTERM'));

      // nodemon sends SIGUSR2 on restart (Windows uses SIGTERM via nodemon)
      process.on('SIGUSR2', () => shutdown('SIGUSR2'));

      // Catch unhandled promise rejections in dev — log but don't crash
      process.on('unhandledRejection', (err) => {
            console.error(`\n❌ [process] Unhandled Rejection: ${err?.message || err}`);
            if (process.env.NODE_ENV === 'production') {
                  shutdown('unhandledRejection');
            }
      });

      process.on('uncaughtException', (err) => {
            console.error(`\n❌ [process] Uncaught Exception: ${err?.message || err}`);
            if (process.env.NODE_ENV === 'production') {
                  shutdown('uncaughtException');
            }
      });

      console.log('🔒 [shutdown] Graceful shutdown handlers registered.');
}
