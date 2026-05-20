/**
 * Fix common Atlas URI mistakes (e.g. unencoded @ in password).
 */
export function normalizeMongoUri(raw) {
      if (!raw?.trim()) return '';

      let uri = raw.trim();

      // mongodb+srv://user:pass@host/db — if password contains @, host looks wrong
      if (uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://')) {
            const protoEnd = uri.indexOf('://') + 3;
            const rest = uri.slice(protoEnd);
            const atIdx = rest.lastIndexOf('@');
            if (atIdx > 0) {
                  const creds = rest.slice(0, atIdx);
                  const hostPart = rest.slice(atIdx + 1);
                  const colonIdx = creds.indexOf(':');
                  if (colonIdx > 0) {
                        const user = creds.slice(0, colonIdx);
                        const pass = creds.slice(colonIdx + 1);
                        if (pass.includes('@') && !pass.includes('%40')) {
                              const encodedPass = encodeURIComponent(pass);
                              const proto = uri.slice(0, protoEnd);
                              uri = `${proto}${user}:${encodedPass}@${hostPart}`;
                              console.warn(
                                    '⚠️  MONGO_URI password contained "@" — auto-encoded as %40. Update backend/.env to use the encoded password.'
                              );
                        }
                  }
            }
      }

      return uri;
}

export function maskMongoUri(uri) {
      if (!uri) return '(empty)';
      return uri.replace(/:([^@/]+)@/, ':****@');
}
