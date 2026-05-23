/** Normalize API user/admin payload for localStorage + context */
export function normalizeAuthUser(raw) {
      if (!raw) return null;
      const id = raw.id || raw._id;
      const role = raw.role || 'citizen';
      return {
            id,
            _id: id,
            name: raw.name,
            email: raw.email,
            role,
            phone: raw.phone || raw.mobile,
            mobile: raw.mobile || raw.phone,
            department: raw.department,
            managedDepartment: raw.managedDepartment || raw.department,
            employeeId: raw.employeeId,
            adminLevel: raw.adminLevel,
            officerStatus: raw.officerStatus,
            profileImage: raw.profileImage,
            isEmailVerified: raw.isEmailVerified,
            createdAt: raw.createdAt,
      };
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY CONSTANTS — single source of truth for all localStorage keys
// ─────────────────────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
      // Admin
      adminToken: 'adminToken',
      adminData: 'adminData',
      // Officer  (NEVER overlap with admin keys)
      officerToken: 'officerToken',
      officerData: 'officerData',
      // Citizen
      citizenToken: 'citizenToken',
      citizenData: 'citizenData',
      // Legacy generic keys — kept for backward-compat reads only, never written
      token: 'token',
      user: 'user',
      admin: 'admin',
};

// ─────────────────────────────────────────────────────────────────────────────
// READ helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Read the active token for the CURRENT role context.
 *  Priority: adminToken → citizenToken → legacy 'token' (never officerToken here) */
export function readStoredToken() {
      try {
            // Admin token takes priority — admin dashboard always uses this
            const adminToken = localStorage.getItem(STORAGE_KEYS.adminToken);
            if (adminToken) return adminToken;

            const citizenToken = localStorage.getItem(STORAGE_KEYS.citizenToken);
            if (citizenToken) return citizenToken;

            // Legacy fallback — only if no role-specific key exists
            return localStorage.getItem(STORAGE_KEYS.token) || null;
      } catch {
            return null;
      }
}

/** Read the active user for the CURRENT role context (admin or citizen).
 *  Officers are NEVER returned here — they have their own isolated context. */
export function readStoredAuth() {
      try {
            // Admin key takes priority
            const adminRaw = localStorage.getItem(STORAGE_KEYS.adminData)
                  || localStorage.getItem(STORAGE_KEYS.admin); // legacy fallback
            if (adminRaw) {
                  const admin = normalizeAuthUser(JSON.parse(adminRaw));
                  if (admin?.role === 'admin') return admin;
            }
            // Citizen
            const citizenRaw = localStorage.getItem(STORAGE_KEYS.citizenData);
            if (citizenRaw) {
                  const citizen = normalizeAuthUser(JSON.parse(citizenRaw));
                  if (citizen?.role === 'citizen') return citizen;
            }
            // Legacy 'user' key — only if it is NOT an officer (prevents bleed-over)
            const userRaw = localStorage.getItem(STORAGE_KEYS.user);
            if (userRaw) {
                  const u = normalizeAuthUser(JSON.parse(userRaw));
                  if (u?.role && u.role !== 'officer') return u;
            }
            return null;
      } catch {
            return null;
      }
}

export function readStoredAdmin() {
      const auth = readStoredAuth();
      return auth?.role === 'admin' ? auth : null;
}

/** Read officer session — completely isolated from admin/citizen */
export function readStoredOfficer() {
      try {
            const raw = localStorage.getItem(STORAGE_KEYS.officerData);
            if (!raw) return null;
            const officer = normalizeAuthUser(JSON.parse(raw));
            return officer?.role === 'officer' ? officer : null;
      } catch {
            return null;
      }
}

export function readStoredOfficerToken() {
      try {
            return localStorage.getItem(STORAGE_KEYS.officerToken) || null;
      } catch {
            return null;
      }
}

// ─────────────────────────────────────────────────────────────────────────────
// WRITE helpers — each role writes ONLY its own keys
// ─────────────────────────────────────────────────────────────────────────────

/** Admin login/register — writes adminToken + adminData only */
export function persistAdminSession(token, adminData, { debug = false } = {}) {
      const admin = normalizeAuthUser({ ...adminData, role: 'admin' });
      if (!admin?.id && (adminData?.id || adminData?._id)) {
            admin.id = adminData.id || adminData._id;
            admin._id = admin.id;
      }
      if (!token || !admin?.id) {
            if (debug) console.warn('persistAdminSession: missing token or admin id', adminData);
            return false;
      }
      localStorage.setItem(STORAGE_KEYS.adminToken, token);
      localStorage.setItem(STORAGE_KEYS.adminData, JSON.stringify(admin));
      // Also write legacy keys so existing code that reads 'token'/'admin'/'user' still works
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.admin, JSON.stringify(admin));
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(admin));
      sessionStorage.setItem('authFresh', String(Date.now()));
      sessionStorage.setItem('adminDepartment', admin.managedDepartment || admin.department || '');
      if (debug) {
            console.log('[persistAdminSession] Admin session saved:', admin.email, admin.department);
      }
      return { token, user: admin, admin };
}

/** Citizen login/register — writes citizenToken + citizenData only.
 *  NEVER touches adminToken, adminData, officerToken, officerData. */
export function persistAuthSession(token, userData, { debug = false } = {}) {
      const user = normalizeAuthUser(userData);
      if (!token || !user?.role) {
            if (debug) console.warn('persistAuthSession: missing token or role', { token: !!token, user });
            return false;
      }
      // If somehow an admin or officer payload arrives here, route to the correct persister
      if (user.role === 'admin') return persistAdminSession(token, userData, { debug });
      if (user.role === 'officer') return persistOfficerSession(token, userData, { debug });

      // Citizen only from here
      localStorage.setItem(STORAGE_KEYS.citizenToken, token);
      localStorage.setItem(STORAGE_KEYS.citizenData, JSON.stringify(user));
      // Legacy keys for backward compat
      localStorage.setItem(STORAGE_KEYS.token, token);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      sessionStorage.setItem('authFresh', String(Date.now()));
      if (debug) {
            console.log('[persistAuthSession] Citizen session saved:', user.email);
      }
      return { token, user };
}

/** Officer login/register — writes officerToken + officerData ONLY.
 *  NEVER touches adminToken, adminData, citizenToken, citizenData, token, user, admin. */
export function persistOfficerSession(token, officerData, { debug = false } = {}) {
      const officer = normalizeAuthUser({ ...officerData, role: 'officer' });
      if (!token || !officer?.id) {
            if (debug) console.warn('persistOfficerSession: missing token or officer id', officerData);
            return false;
      }
      localStorage.setItem(STORAGE_KEYS.officerToken, token);
      localStorage.setItem(STORAGE_KEYS.officerData, JSON.stringify(officer));
      // Do NOT touch: adminToken, adminData, citizenToken, citizenData, token, user, admin
      sessionStorage.setItem('officerAuthFresh', String(Date.now()));
      if (debug) {
            console.log('[persistOfficerSession] Officer session saved:', officer.employeeId, officer.department);
      }
      return { token, user: officer, officer };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEAR helpers — each role clears ONLY its own keys
// ─────────────────────────────────────────────────────────────────────────────

/** Clear admin session only */
export function clearAdminSession() {
      localStorage.removeItem(STORAGE_KEYS.adminToken);
      localStorage.removeItem(STORAGE_KEYS.adminData);
      localStorage.removeItem(STORAGE_KEYS.admin);
      // Only remove legacy 'token'/'user' if they belong to admin
      try {
            const u = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
            if (u?.role === 'admin') {
                  localStorage.removeItem(STORAGE_KEYS.token);
                  localStorage.removeItem(STORAGE_KEYS.user);
            }
      } catch { /* ignore */ }
      sessionStorage.removeItem('authFresh');
      sessionStorage.removeItem('adminDepartment');
}

/** Clear officer session only — does NOT touch admin or citizen keys */
export function clearOfficerSession() {
      localStorage.removeItem(STORAGE_KEYS.officerToken);
      localStorage.removeItem(STORAGE_KEYS.officerData);
      sessionStorage.removeItem('officerAuthFresh');
}

/** Clear citizen session only */
export function clearCitizenSession() {
      localStorage.removeItem(STORAGE_KEYS.citizenToken);
      localStorage.removeItem(STORAGE_KEYS.citizenData);
      // Only remove legacy 'token'/'user' if they belong to citizen
      try {
            const u = JSON.parse(localStorage.getItem(STORAGE_KEYS.user) || 'null');
            if (u?.role === 'citizen') {
                  localStorage.removeItem(STORAGE_KEYS.token);
                  localStorage.removeItem(STORAGE_KEYS.user);
            }
      } catch { /* ignore */ }
      sessionStorage.removeItem('authFresh');
}

/** Full clear — all roles (used only on explicit "sign out of everything") */
export function clearAuthSession() {
      Object.values(STORAGE_KEYS).forEach((key) => {
            try { localStorage.removeItem(key); } catch { /* ignore */ }
      });
      sessionStorage.removeItem('authFresh');
      sessionStorage.removeItem('adminDepartment');
      sessionStorage.removeItem('officerAuthFresh');
}

// ─────────────────────────────────────────────────────────────────────────────
// SESSION CHECK helpers
// ─────────────────────────────────────────────────────────────────────────────

export function hasValidSession() {
      const t = readStoredToken();
      const u = readStoredAuth();
      return Boolean(t && u?.role);
}

export function hasValidAdminSession() {
      const t = localStorage.getItem(STORAGE_KEYS.adminToken)
            || localStorage.getItem(STORAGE_KEYS.token);
      const u = readStoredAuth();
      return Boolean(t && u?.role === 'admin');
}

export function hasValidOfficerSession() {
      const t = readStoredOfficerToken();
      const o = readStoredOfficer();
      return Boolean(t && o?.role === 'officer');
}

export function isAuthFresh(maxMs = 120000) {
      const freshAt = sessionStorage.getItem('authFresh');
      return Boolean(freshAt && Date.now() - Number(freshAt) < maxMs);
}

export function isOfficerAuthFresh(maxMs = 120000) {
      const freshAt = sessionStorage.getItem('officerAuthFresh');
      return Boolean(freshAt && Date.now() - Number(freshAt) < maxMs);
}

/** DevTools helper — call from console: window.__debugAuth() */
export function debugAuthStorage() {
      console.group('[Auth Storage Debug]');
      console.log('adminToken:', localStorage.getItem(STORAGE_KEYS.adminToken) ? '✅ present' : '❌ missing');
      console.log('adminData:', localStorage.getItem(STORAGE_KEYS.adminData));
      console.log('officerToken:', localStorage.getItem(STORAGE_KEYS.officerToken) ? '✅ present' : '❌ missing');
      console.log('officerData:', localStorage.getItem(STORAGE_KEYS.officerData));
      console.log('citizenToken:', localStorage.getItem(STORAGE_KEYS.citizenToken) ? '✅ present' : '❌ missing');
      console.log('legacy token:', localStorage.getItem(STORAGE_KEYS.token) ? '✅ present' : '❌ missing');
      console.log('legacy user:', localStorage.getItem(STORAGE_KEYS.user));
      console.groupEnd();
}
