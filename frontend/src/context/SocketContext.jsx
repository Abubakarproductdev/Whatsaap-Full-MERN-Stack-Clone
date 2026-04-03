import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io('/', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

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
    };
  }, [isAuthenticated]);

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

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
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
