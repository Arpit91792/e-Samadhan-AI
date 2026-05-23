import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../utils/authStorage';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export function useSocket(handlers = {}, { role = 'auto' } = {}) {
      // Determine which token to use based on role context
      const token = typeof window !== 'undefined' ? (() => {
            if (role === 'officer') {
                  return localStorage.getItem(STORAGE_KEYS.officerToken);
            }
            if (role === 'admin') {
                  return localStorage.getItem(STORAGE_KEYS.adminToken) || localStorage.getItem(STORAGE_KEYS.token);
            }
            // auto: prefer officerToken if on officer page, else admin/citizen token
            const path = window.location.pathname;
            if (path.startsWith('/officer/')) {
                  return localStorage.getItem(STORAGE_KEYS.officerToken);
            }
            return localStorage.getItem(STORAGE_KEYS.adminToken)
                  || localStorage.getItem(STORAGE_KEYS.citizenToken)
                  || localStorage.getItem(STORAGE_KEYS.token);
      })() : null;

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

            // Existing events
            socket.on('complaint:update', (payload) =>
                  handlersRef.current.onComplaintUpdate?.(payload));
            socket.on('notification:new', (payload) =>
                  handlersRef.current.onNotification?.(payload));
            socket.on('admin:alert', (payload) =>
                  handlersRef.current.onAdminAlert?.(payload));

            // New complaint filed in officer's department — refresh queue
            socket.on('complaint:new', (payload) =>
                  handlersRef.current.onNewComplaint?.(payload));

            // A complaint was accepted by another officer — remove from queue
            socket.on('complaint:accepted', (payload) =>
                  handlersRef.current.onComplaintAccepted?.(payload));

            return () => {
                  socket.disconnect();
                  socketRef.current = null;
            };
      }, [token]);

      return socketRef;
}
