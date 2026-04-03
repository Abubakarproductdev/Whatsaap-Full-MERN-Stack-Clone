import { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SearchBar from './SearchBar';
import ChatListItem from './ChatListItem';
import NewChatPanel from './NewChatPanel';
import { useChat } from '../../context/ChatContext';
import Spinner from '../common/Spinner';

export default function Sidebar({ onProfileClick }) {
  const { conversations, activeConversation, selectConversation, loadingConversations } = useChat();
  const [search, setSearch] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const filtered = conversations.filter((c) =>
    (c.user?.username || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="relative flex flex-col h-full dark:bg-wa-d-bg bg-wa-l-panel
        border-r dark:border-wa-d-border border-wa-l-border"
      id="sidebar"
    >
      <SidebarHeader
        onProfileClick={onProfileClick}
        onNewChatClick={() => setShowNewChat(true)}
      />

      <SearchBar value={search} onChange={setSearch} />

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loadingConversations ? (
          <Spinner className="py-12" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-sm">
              {search ? 'No chats found' : 'No conversations yet'}
            </p>
            {!search && (
              <button
                onClick={() => setShowNewChat(true)}
                className="mt-3 text-wa-green text-sm font-medium hover:underline cursor-pointer"
              >
                Start a new chat
              </button>
            )}
          </div>
        ) : (
          filtered.map((conv) => (
            <ChatListItem
              key={conv.conversationId || conv.user?.id}
              conversation={conv}
              isActive={activeConversation?.user?.id === conv.user?.id}
              onClick={() => selectConversation(conv)}
            />
          ))
        )}
      </div>

      {/* New chat panel overlay */}
      {showNewChat && <NewChatPanel onClose={() => setShowNewChat(false)} />}
    </div>
  );
}
