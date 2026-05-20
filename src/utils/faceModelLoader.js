/**
 * Robust face-api model loader for Vite + React.
 * Models live in public/models/ → served at /models/
 */

const MODEL_MANIFESTS = [
      'tiny_face_detector_model-weights_manifest.json',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-weights_manifest.json',
];

const MODEL_WEIGHTS = [
      'tiny_face_detector_model.bin',
      'face_landmark_68_model.bin',
      'face_recognition_model.bin',
];

export const REQUIRED_MODEL_FILES = [...MODEL_MANIFESTS, ...MODEL_WEIGHTS];

export function getModelsBaseUrl() {
      const base = import.meta.env.BASE_URL || '/';
      const normalized = base.endsWith('/') ? base : `${base}/`;
      return `${normalized}models`;
}

export async function checkModelFile(url) {
      try {
            const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
            return res.ok;
      } catch {
            return false;
      }
}

export async function validateModelsExist(baseUrl = getModelsBaseUrl()) {
      const missing = [];
      for (const file of REQUIRED_MODEL_FILES) {
            const ok = await checkModelFile(`${baseUrl}/${file}`);
            if (!ok) missing.push(file);
      }
      return { valid: missing.length === 0, missing, baseUrl };
}

export async function validateModelsWithRetry(retries = 2, delayMs = 500) {
      let last;
      for (let i = 0; i <= retries; i++) {
            last = await validateModelsExist();
            if (last.valid) return last;
            if (i < retries) await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
      }
      return last;
}

export function formatMissingModelsError(missing, baseUrl) {
      return (
            `Face recognition models missing (${missing.length} file(s)). ` +
            `Expected at ${baseUrl}/. Run: node scripts/downloadModels.js`
      );
}
