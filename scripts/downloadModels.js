/**
 * Downloads face-api.js model files into public/models/
 * Run: node scripts/downloadModels.js
 */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models');

if (!fs.existsSync(MODELS_DIR)) fs.mkdirSync(MODELS_DIR, { recursive: true });

const BASE = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model';

const FILES = [
      'tiny_face_detector_model-weights_manifest.json',
      'tiny_face_detector_model.bin',
      'face_landmark_68_model-weights_manifest.json',
      'face_landmark_68_model.bin',
      'face_recognition_model-weights_manifest.json',
      'face_recognition_model.bin',
];

const download = (url, dest) =>
      new Promise((resolve, reject) => {
            const file = fs.createWriteStream(dest);
            https
                  .get(url, (res) => {
                        if (res.statusCode === 301 || res.statusCode === 302) {
                              file.close();
                              fs.unlink(dest, () => {});
                              return download(res.headers.location, dest).then(resolve).catch(reject);
                        }
                        if (res.statusCode !== 200) {
                              file.close();
                              fs.unlink(dest, () => {});
                              return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
                        }
                        res.pipe(file);
                        file.on('finish', () => {
                              file.close();
                              resolve();
                        });
                  })
                  .on('error', (err) => {
                        fs.unlink(dest, () => {});
                        reject(err);
                  });
      });

console.log('\n📥 Downloading face-api.js models (vladmandic)...\n');

for (const f of FILES) {
      const dest = path.join(MODELS_DIR, f);
      const url = `${BASE}/${f}`;
      try {
            if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
                  console.log(`  ✓ ${f} (${(fs.statSync(dest).size / 1024).toFixed(0)} KB)`);
                  continue;
            }
            process.stdout.write(`  ↓ ${f}...`);
            await download(url, dest);
            console.log(` ✅ ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`);
      } catch (err) {
            console.log(` ❌ ${err.message}`);
      }
}

// Remove legacy shard files that cause 404 confusion
const legacy = [
      'tiny_face_detector_model-shard1',
      'face_landmark_68_model-shard1',
      'face_recognition_model-shard1',
      'face_recognition_model-shard2',
];
for (const f of legacy) {
      const p = path.join(MODELS_DIR, f);
      if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            console.log(`  🗑 Removed legacy: ${f}`);
      }
}

console.log('\n✅ Models ready in public/models/\n');
