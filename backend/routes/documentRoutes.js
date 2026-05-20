import express from 'express';
import { verifyDocument, uploadDocument, getDocumentTypes } from '../controllers/documentController.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads', 'govt-ids');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
      destination: (req, file, cb) => cb(null, uploadDir),
      filename: (req, file, cb) => cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
      const allowed = /jpeg|jpg|png|webp|pdf/;
      if (allowed.test(path.extname(file.originalname).toLowerCase()) && (allowed.test(file.mimetype) || file.mimetype === 'application/pdf')) {
            cb(null, true);
      } else {
            cb(new Error('Only images (JPG, PNG, WebP) and PDF files are allowed'), false);
      }
};

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

const router = express.Router();

router.get('/types', getDocumentTypes);
router.post('/verify', verifyDocument);
router.post('/upload', upload.single('document'), uploadDocument);

export default router;
