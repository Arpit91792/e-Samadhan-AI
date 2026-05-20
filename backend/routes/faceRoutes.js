import express from 'express';
import multer from 'multer';
import { validateFaceUpload, faceHealth } from '../controllers/faceController.js';

const router = express.Router();

const upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 2 },
      fileFilter: (req, file, cb) => {
            const ok = ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype);
            cb(ok ? null : new Error('Only JPEG, PNG, or WebP allowed'), ok);
      },
});

router.get('/health', faceHealth);

router.post(
      '/validate-upload',
      upload.fields([
            { name: 'documentImage', maxCount: 1 },
            { name: 'selfieImage', maxCount: 1 },
      ]),
      validateFaceUpload
);

export default router;
