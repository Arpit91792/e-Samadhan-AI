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

export function readStoredToken() {
      try {
            return localStorage.getItem('token') || null;
      } catch {
            return null;
      }
}

/** Prefer dedicated admin key, fall back to user */
export function readStoredAuth() {
      try {
            const adminRaw = localStorage.getItem('admin');
            if (adminRaw) {
                  const admin = normalizeAuthUser(JSON.parse(adminRaw));
                  if (admin?.role === 'admin') return admin;
            }
            const userRaw = localStorage.getItem('user');
            return userRaw ? normalizeAuthUser(JSON.parse(userRaw)) : null;
      } catch {
            return null;
      }
}

export function readStoredAdmin() {
      const auth = readStoredAuth();
      return auth?.role === 'admin' ? auth : null;
}

export function persistAuthSession(token, userData, { debug = false } = {}) {
      const user = normalizeAuthUser(userData);
      if (!token || !user?.role) {
            if (debug) console.warn('persistAuthSession: missing token or role', { token: !!token, user });
            return false;
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'admin') {
            localStorage.setItem('admin', JSON.stringify(user));
      }
      sessionStorage.setItem('authFresh', String(Date.now()));
      if (debug) {
            console.log('Login Success');
            console.log('Token:', token);
            console.log('User:', user);
            if (user.role === 'admin') console.log('Admin:', user);
      }
      return { token, user };
}

/** Admin login/register — saves token + admin + user */
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
      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(admin));
      localStorage.setItem('user', JSON.stringify(admin));
      sessionStorage.setItem('authFresh', String(Date.now()));
      sessionStorage.setItem('adminDepartment', admin.managedDepartment || admin.department || '');
      if (debug) {
            console.log('Admin Login Success');
            console.log('Token:', token);
            console.log('Admin:', admin);
      }
      return { token, user: admin, admin };
}

export function clearAuthSession() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('admin');
      localStorage.removeItem('officerToken');
      localStorage.removeItem('officerData');
      sessionStorage.removeItem('authFresh');
      sessionStorage.removeItem('adminDepartment');
}


/** True when token + role exist in storage (works immediately after login, before React state updates) */
export function hasValidSession() {
      const t = readStoredToken();
      const u = readStoredAuth();
      return Boolean(t && u?.role);
}

export function hasValidAdminSession() {
      const t = readStoredToken();
      const u = readStoredAuth();
      return Boolean(t && u?.role === 'admin');
}

export function isAuthFresh(maxMs = 120000) {
      const freshAt = sessionStorage.getItem('authFresh');
      return Boolean(freshAt && Date.now() - Number(freshAt) < maxMs);
}

/** DevTools helper — call from console: window.__debugAuth() */
export function debugAuthStorage() {
      console.log('Token:', readStoredToken());
      console.log('Admin:', localStorage.getItem('admin'));
      console.log('User:', localStorage.getItem('user'));
      console.log('authFresh:', sessionStorage.getItem('authFresh'));
}
