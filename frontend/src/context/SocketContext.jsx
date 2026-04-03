import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [socketReady, setSocketReady] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketReady(false);
      return;
    }

    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketReady(true);
    });

    socket.on('disconnect', () => {
      setSocketReady(false);
<<<<<<< HEAD
      setOnlineUsers({});
      setTypingUsers({});
    });

    socket.on('connect_error', () => {
      setSocketReady(false);
=======
>>>>>>> d6692ac8fbd3af489ea1170b143daf6d53f0681e
    });

    socket.on('userOnlineStatus', ({ userId, isOnline, lastSeen }) => {
      setOnlineUsers((prev) => ({
        ...prev,
        [userId]: { isOnline, lastSeen: lastSeen || new Date().toISOString() },
      }));
    });

    socket.on('typing', ({ conversationId, userId }) => {
      setTypingUsers((prev) => ({ ...prev, [conversationId]: userId }));
    });

    socket.on('stopTyping', ({ conversationId }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketReady(false);
    };
  }, [isAuthenticated]);

  // Stable callbacks that access socketRef.current at call time (not stale closure)
  const joinConversation = useCallback((conversationId) => {
    socketRef.current?.emit('joinConversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId) => {
    socketRef.current?.emit('leaveConversation', conversationId);
  }, []);

  const emitTyping = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit('typing', { conversationId, receiverId });
  }, []);

  const emitStopTyping = useCallback((conversationId, receiverId) => {
    socketRef.current?.emit('stopTyping', { conversationId, receiverId });
  }, []);

  const markAsRead = useCallback((conversationId) => {
    socketRef.current?.emit('markMessagesAsRead', { conversationId });
  }, []);

  // Expose a stable getSocket function instead of the raw ref
  const getSocket = useCallback(() => socketRef.current, []);

  return (
    <SocketContext.Provider
      value={{
        getSocket,
        socketReady,
        onlineUsers,
        typingUsers,
        joinConversation,
        leaveConversation,
        emitTyping,
        emitStopTyping,
        markAsRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
