import mongoose from 'mongoose';
import Admin from '../models/Admin.js';
import User from '../models/User.js';
import { resolveDepartmentSlug } from './departmentResolve.js';

/**
 * Find department admin in Admin or User collection.
 * Email lookup first (handles re-register when JWT id is stale).
 */
export async function findAdminByAuthClaims(decoded) {
      const email = decoded?.email ? String(decoded.email).toLowerCase().trim() : null;
      const adminId = decoded?.id || decoded?._id;

      console.log('[findAdminByAuthClaims] Searching for admin:', {
            email: email ? `${email.substring(0, 5)}...` : 'none',
            adminId: adminId ? `${String(adminId).substring(0, 8)}...` : 'none',
      });

      if (email) {
            try {
                  const byEmail = await Admin.findOne({ email }).select('name email department');
                  if (byEmail) {
                        console.log('[findAdminByAuthClaims] Found in Admin collection by email');
                        return { source: 'admins', doc: byEmail };
                  }
            } catch (err) {
                  console.error('[findAdminByAuthClaims] Error searching Admin by email:', err.message);
            }

            try {
                  const userByEmail = await User.findOne({ email, role: 'admin', isActive: { $ne: false } })
                        .select('name email role managedDepartment department');
                  if (userByEmail) {
                        console.log('[findAdminByAuthClaims] Found in User collection by email');
                        return { source: 'users', doc: userByEmail };
                  }
            } catch (err) {
                  console.error('[findAdminByAuthClaims] Error searching User by email:', err.message);
            }
      }

      if (adminId && mongoose.Types.ObjectId.isValid(String(adminId))) {
            try {
                  const byId = await Admin.findById(adminId).select('name email department');
                  if (byId) {
                        console.log('[findAdminByAuthClaims] Found in Admin collection by ID');
                        return { source: 'admins', doc: byId };
                  }
            } catch (err) {
                  console.error('[findAdminByAuthClaims] Error searching Admin by ID:', err.message);
            }

            try {
                  const userById = await User.findById(adminId).select('name email role managedDepartment department isActive');
                  if (userById?.role === 'admin' && userById.isActive !== false) {
                        console.log('[findAdminByAuthClaims] Found in User collection by ID');
                        return { source: 'users', doc: userById };
                  }
            } catch (err) {
                  console.error('[findAdminByAuthClaims] Error searching User by ID:', err.message);
            }
      }

      console.warn('[findAdminByAuthClaims] Admin not found in either collection');
      return null;
}

export function resolveDepartmentForAdmin(doc, decoded, req) {
      const headerDept = resolveDepartmentSlug(req?.headers?.['x-admin-department']);
      return (
            resolveDepartmentSlug(doc?.department)
            || resolveDepartmentSlug(doc?.managedDepartment)
            || resolveDepartmentSlug(decoded?.department)
            || resolveDepartmentSlug(decoded?.managedDepartment)
            || headerDept
      );
}

export function toReqAdmin(doc, decoded, department) {
      const id = (doc?._id || doc?.id || decoded?.id || decoded?._id)?.toString?.()
            || String(doc?._id || doc?.id || decoded?.id || decoded?._id || '');

      return {
            id,
            _id: id,
            email: doc?.email || decoded?.email || '',
            name: doc?.name || decoded?.name || 'Department Admin',
            department,
            role: 'admin',
            source: doc ? 'database' : 'token',
      };
}

export function isAdminJwt(decoded) {
      return decoded?.role === 'admin' || decoded?.adminLevel === 'department_admin' || !!decoded?.managedDepartment;
}
