import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export function useSocket(handlers = {}) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const socketRef = useRef(null);
      const handlersRef = useRef(handlers);
      handlersRef.current = handlers;

      useEffect(() => {
            if (!token) return undefined;

            const socket = io(SOCKET_URL, {
                  auth: { token },
                  transports: ['websocket', 'polling'],
            });
            socketRef.current = socket;

            socket.on('complaint:update', (payload) => handlersRef.current.onComplaintUpdate?.(payload));
            socket.on('notification:new', (payload) => handlersRef.current.onNotification?.(payload));
            socket.on('admin:alert', (payload) => handlersRef.current.onAdminAlert?.(payload));

            return () => {
                  socket.disconnect();
                  socketRef.current = null;
            };
      }, [token]);

      return socketRef;
}
