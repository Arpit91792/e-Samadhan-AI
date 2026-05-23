import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;

export function initSocket(httpServer) {
      io = new Server(httpServer, {
            cors: {
                  origin: process.env.CLIENT_URL || 'http://localhost:5173',
                  credentials: true,
            },
      });

      io.use((socket, next) => {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('Authentication required'));
            try {
                  const decoded = jwt.verify(token, process.env.JWT_SECRET);
                  socket.userId = decoded.id;
                  socket.userRole = decoded.role;
                  socket.department = decoded.department;          // officer department slug
                  socket.managedDepartment = decoded.managedDepartment;
                  socket.adminLevel = decoded.adminLevel;
                  next();
            } catch {
                  next(new Error('Invalid token'));
            }
      });

      io.on('connection', (socket) => {
            socket.join(`user:${socket.userId}`);
            if (socket.userRole) socket.join(`role:${socket.userRole}`);
            if (socket.userRole === 'admin') {
                  socket.join('admins');
                  if (socket.managedDepartment) {
                        socket.join(`dept:${socket.managedDepartment}`);
                  }
            }
            // Officers join their department room so they receive new-complaint notifications
            if (socket.userRole === 'officer' && socket.department) {
                  socket.join(`dept:${socket.department}`);
            }
      });

      console.log('✅ Socket.io real-time server ready');
      return io;
}

export function getIO() {
      return io;
}

export function emitToUser(userId, event, payload) {
      if (!io || !userId) return;
      io.to(`user:${userId}`).emit(event, payload);
}

export function emitComplaintUpdate(citizenId, complaint, extra = {}) {
      emitToUser(citizenId, 'complaint:update', {
            complaintId: complaint._id,
            complaintRef: complaint.complaintId,
            status: complaint.status,
            priority: complaint.priority,
            title: complaint.title,
            ...extra,
      });
}

export function emitNotification(userId, notification) {
      emitToUser(userId, 'notification:new', notification);
}

export function emitToDepartment(departmentSlug, event, payload) {
      if (!io || !departmentSlug) return;
      io.to(`dept:${departmentSlug}`).emit(event, payload);
      io.to('admins').emit(event, payload);
}

export function emitAdminAlert(departmentSlug, payload) {
      emitToDepartment(departmentSlug, 'admin:alert', payload);
}

// ── New complaint filed — notify all officers in that department ──────────────
export function emitNewComplaintToDept(departmentSlug, complaint) {
      if (!io || !departmentSlug) return;
      io.to(`dept:${departmentSlug}`).emit('complaint:new', {
            _id: complaint._id,
            complaintId: complaint.complaintId,
            title: complaint.title,
            category: complaint.category,
            priority: complaint.priority,
            isEmergency: complaint.isEmergency,
            status: complaint.status,
            location: complaint.location,
            createdAt: complaint.createdAt,
      });
}

// ── Complaint accepted from queue — notify dept to remove it from queue ───────
export function emitComplaintAcceptedToDept(departmentSlug, complaintId, officerName) {
      if (!io || !departmentSlug) return;
      io.to(`dept:${departmentSlug}`).emit('complaint:accepted', {
            complaintId,
            acceptedBy: officerName,
      });
}
