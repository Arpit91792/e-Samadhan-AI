const REQUIRED = [
      { key: 'MONGO_URI', description: 'MongoDB connection string' },
      { key: 'JWT_SECRET', description: 'JWT signing secret (min 32 chars recommended)' },
];

const RECOMMENDED = [
      { key: 'CLIENT_URL', description: 'Frontend URL for CORS' },
      { key: 'SMTP_HOST', description: 'Email SMTP host (for OTP / password reset)' },
];

export function validateEnv() {
      const missing = [];
      const warnings = [];

      for (const { key, description } of REQUIRED) {
            if (!process.env[key]?.trim()) {
                  missing.push({ key, description });
            }
      }

      if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
            warnings.push({
                  key: 'JWT_SECRET',
                  message: 'JWT_SECRET should be at least 32 characters in production.',
            });
      }

      for (const { key, description } of RECOMMENDED) {
            if (!process.env[key]?.trim()) {
                  warnings.push({ key, message: `Missing ${key}: ${description}` });
            }
      }

      return { valid: missing.length === 0, missing, warnings };
}

export function printEnvReport() {
      const { valid, missing, warnings } = validateEnv();

      if (warnings.length) {
            console.warn('\n⚠️  Environment warnings:');
            warnings.forEach((w) => console.warn(`   • ${w.key}: ${w.message}`));
      }

      if (!valid) {
            console.error('\n❌ Missing required environment variables:\n');
            missing.forEach((m) => console.error(`   • ${m.key} — ${m.description}`));
            console.error('\n   Copy backend/.env.example to backend/.env and fill in values.\n');
            if (process.env.NODE_ENV === 'production') {
                  process.exit(1);
            }
      }

      return valid;
}
