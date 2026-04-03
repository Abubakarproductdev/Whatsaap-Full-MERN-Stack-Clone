import Avatar from '../common/Avatar';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { formatLastSeen } from '../../utils/formatters';
import { IoArrowBack } from 'react-icons/io5';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { useState, useRef, useEffect } from 'react';

export default function ChatHeader({ conversation, onBackClick }) {
  const { onlineUsers, typingUsers } = useSocket();
  const { deleteConversation } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const otherUser = conversation?.user;
  const onlineData = onlineUsers[otherUser?.id];
  const isOnline = onlineData?.isOnline ?? otherUser?.isOnline;
  const lastSeen = onlineData?.lastSeen || otherUser?.lastSeen;
  const isTyping = typingUsers[conversation?.conversationId];

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const statusText = isTyping
    ? 'typing...'
    : isOnline
      ? 'online'
      : formatLastSeen(lastSeen);

  return (
    <div className="flex items-center justify-between px-4 py-2 dark:bg-wa-d-header bg-wa-l-header
      border-b dark:border-wa-d-border border-wa-l-border" id="chat-header">
      <div className="flex items-center gap-3">
        {/* Back button for mobile */}
        <button
          onClick={onBackClick}
          className="p-1 md:hidden dark:text-wa-d-icon text-wa-l-icon cursor-pointer"
        >
          <IoArrowBack size={22} />
        </button>

        <Avatar
          src={otherUser?.profilePicture}
          name={otherUser?.username}
          size="md"
          isOnline={isOnline}
        />

        <div>
          <h3 className="dark:text-wa-d-text text-wa-l-text text-base font-medium leading-tight">
            {otherUser?.username || 'Unknown'}
          </h3>
          <p className={`text-xs leading-tight ${
            isTyping ? 'text-wa-green' : 'dark:text-wa-d-text-secondary text-wa-l-text-secondary'
          }`}>
            {isTyping && (
              <span className="flex items-center gap-1">
                typing
                <span className="typing-dot dark:bg-wa-green bg-wa-green"></span>
                <span className="typing-dot dark:bg-wa-green bg-wa-green"></span>
                <span className="typing-dot dark:bg-wa-green bg-wa-green"></span>
              </span>
            )}
            {!isTyping && statusText}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-full dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
            id="chat-menu-btn"
          >
            <HiOutlineDotsVertical className="dark:text-wa-d-icon text-wa-l-icon" size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 py-2 rounded-md shadow-xl z-50 animate-scale-in
              dark:bg-wa-d-panel bg-white border dark:border-wa-d-border border-wa-l-border">
              {conversation?.conversationId && (
                <button
                  onClick={() => {
                    deleteConversation(conversation.conversationId);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400
                    dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
                  id="delete-conversation-btn"
                >
                  Delete chat
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
