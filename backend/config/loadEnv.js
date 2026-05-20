import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const envPath = path.join(backendRoot, '.env');
const examplePath = path.join(backendRoot, '.env.example');

if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
} else {
      console.warn(`⚠️  backend/.env not found at ${envPath}`);
      if (fs.existsSync(examplePath)) {
            dotenv.config({ path: examplePath });
      }
}

// Always load from backend folder regardless of process.cwd()
process.chdir(backendRoot);
