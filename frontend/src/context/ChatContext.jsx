import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { chatAPI, authAPI } from '../api/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export function ChatProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const { socket, joinConversation, leaveConversation, markAsRead } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const prevConvIdRef = useRef(null);

  /* ---- Load conversations ---- */
  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingConversations(true);
    try {
      const data = await chatAPI.getConversations();
      if (data.success) setConversations(data.conversations || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated]);

  /* ---- Load all users ---- */
  const fetchAllUsers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await authAPI.getAllUsers();
      if (data.success) setAllUsers(data.users || []);
    } catch (e) {
      console.error('Failed to load users:', e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchConversations();
    fetchAllUsers();
  }, [fetchConversations, fetchAllUsers]);

  /* ---- Select conversation ---- */
  const selectConversation = useCallback(
    async (conversation) => {
      // leave old room
      if (prevConvIdRef.current) {
        leaveConversation(prevConvIdRef.current);
      }

      setActiveConversation(conversation);
      const convId = conversation.conversationId;
      prevConvIdRef.current = convId;

      // join new room
      joinConversation(convId);
      markAsRead(convId);

      // fetch messages
      setLoadingMessages(true);
      try {
        const data = await chatAPI.getMessages(convId);
        if (data.success) setMessages(data.messages || []);
      } catch (e) {
        console.error('Failed to load messages:', e);
      } finally {
        setLoadingMessages(false);
      }

      // update unread count locally
      setConversations((prev) =>
        prev.map((c) =>
          c.conversationId === convId ? { ...c, unreadCount: 0 } : c
        )
      );
    },
    [joinConversation, leaveConversation, markAsRead]
  );

  /* ---- Start new conversation (from user list) ---- */
  const startConversation = useCallback(
    (otherUser) => {
      // check if conversation already exists
      const existing = conversations.find(
        (c) => c.user?.id === otherUser._id || c.user?.id === otherUser.id
      );

      if (existing) {
        selectConversation(existing);
        return;
      }

      // create virtual conversation
      const virtual = {
        conversationId: null,
        user: {
          id: otherUser._id || otherUser.id,
          username: otherUser.username,
          profilePicture: otherUser.profilePicture || null,
          isOnline: otherUser.isOnline,
          lastSeen: otherUser.lastSeen,
          phoneNumber: otherUser.phoneNumber,
          email: otherUser.email,
        },
        lastMessage: null,
        unreadCount: 0,
        updatedAt: new Date().toISOString(),
      };

      setActiveConversation(virtual);
      setMessages([]);
    },
    [conversations, selectConversation]
  );

  /* ---- Send message ---- */
  const sendMessage = useCallback(
    async ({ content, file, receiverEmail, receiverPhone }) => {
      const formData = new FormData();
      if (content) formData.append('content', content);
      if (file) formData.append('file', file);
      if (receiverEmail) formData.append('receiverEmail', receiverEmail);
      if (receiverPhone) formData.append('receiverPhone', receiverPhone);

      try {
        const data = await chatAPI.sendMessage(formData);
        if (data.success) {
          // add message to local state
          const newMsg = data.data;
          setMessages((prev) => [...prev, {
            _id: newMsg.messageId,
            conversationId: newMsg.conversationId,
            sender: { _id: user?.id, username: user?.username, profilePicture: user?.profilePicture },
            receiver: newMsg.receiver,
            content: newMsg.content,
            ImageOrVideoUrl: newMsg.imageOrVideoUrl,
            contentType: newMsg.contentType,
            messageStatus: newMsg.messageStatus,
            createdAt: newMsg.createdAt,
          }]);

          // if this was a new conversation, update
          if (!activeConversation?.conversationId && newMsg.conversationId) {
            setActiveConversation((prev) => ({
              ...prev,
              conversationId: newMsg.conversationId,
            }));
            joinConversation(newMsg.conversationId);
            prevConvIdRef.current = newMsg.conversationId;
          }

          fetchConversations();
          return data;
        }
      } catch (e) {
        console.error('Failed to send message:', e);
        throw e;
      }
    },
    [user, activeConversation, joinConversation, fetchConversations]
  );

  /* ---- Delete message ---- */
  const deleteMessage = useCallback(
    async (messageId) => {
      try {
        const data = await chatAPI.deleteMessage(messageId);
        if (data.success) {
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
          fetchConversations();
        }
      } catch (e) {
        console.error('Failed to delete message:', e);
      }
    },
    [fetchConversations]
  );

  /* ---- Delete conversation ---- */
  const deleteConversation = useCallback(
    async (conversationId) => {
      try {
        const data = await chatAPI.deleteConversation(conversationId);
        if (data.success) {
          setConversations((prev) =>
            prev.filter((c) => c.conversationId !== conversationId)
          );
          if (activeConversation?.conversationId === conversationId) {
            setActiveConversation(null);
            setMessages([]);
          }
        }
      } catch (e) {
        console.error('Failed to delete conversation:', e);
      }
    },
    [activeConversation]
  );

  /* ---- Socket listeners for real-time ---- */
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = ({ conversationId, message }) => {
      // if we're in this conversation, add message
      if (activeConversation?.conversationId === conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m._id === message._id);
          if (exists) return prev;
          return [...prev, message];
        });
        markAsRead(conversationId);
      }

      // refresh conversation list
      fetchConversations();
    };

    const handleMessagesRead = ({ conversationId, readBy }) => {
      if (activeConversation?.conversationId === conversationId && readBy !== user?.id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender?._id === user?.id ? { ...m, messageStatus: 'read' } : m
          )
        );
      }
    };

    const handleMessageDeleted = ({ conversationId, messageId }) => {
      if (activeConversation?.conversationId === conversationId) {
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      }
      fetchConversations();
    };

    const handleConversationDeleted = ({ conversationId }) => {
      setConversations((prev) =>
        prev.filter((c) => c.conversationId !== conversationId)
      );
      if (activeConversation?.conversationId === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('messagesRead', handleMessagesRead);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('conversationDeleted', handleConversationDeleted);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('messagesRead', handleMessagesRead);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('conversationDeleted', handleConversationDeleted);
    };
  }, [socket, activeConversation, user, markAsRead, fetchConversations]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        allUsers,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        selectConversation,
        startConversation,
        sendMessage,
        deleteMessage,
        deleteConversation,
        fetchConversations,
        fetchAllUsers,
        setActiveConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
