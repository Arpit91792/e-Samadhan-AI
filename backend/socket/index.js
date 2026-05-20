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
                  next();
            } catch {
                  next(new Error('Invalid token'));
            }
      });

      io.on('connection', (socket) => {
            socket.join(`user:${socket.userId}`);
            if (socket.userRole) socket.join(`role:${socket.userRole}`);
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
