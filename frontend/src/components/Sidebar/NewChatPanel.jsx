import { useState } from 'react';
import { IoArrowBack, IoSearch } from 'react-icons/io5';
import { useChat } from '../../context/ChatContext';
import Avatar from '../common/Avatar';

export default function NewChatPanel({ onClose }) {
  const { allUsers, startConversation } = useChat();
  const [search, setSearch] = useState('');

  const filtered = allUsers.filter((u) =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.phoneNumber || '').includes(search) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="absolute inset-0 z-40 dark:bg-wa-d-bg bg-wa-l-panel animate-slide-left flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 px-6 pt-14 pb-3 dark:bg-wa-teal bg-wa-teal">
        <button onClick={onClose} className="text-white cursor-pointer" id="close-new-chat-btn">
          <IoArrowBack size={22} />
        </button>
        <h2 className="text-white text-lg font-medium">New chat</h2>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-3 rounded-lg px-3 py-1.5 dark:bg-wa-d-search bg-wa-l-search">
          <IoSearch className="dark:text-wa-d-text-secondary text-wa-l-text-secondary shrink-0" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts"
            className="w-full bg-transparent text-sm outline-none
              dark:text-wa-d-text text-wa-l-text
              dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center dark:text-wa-d-text-secondary text-wa-l-text-secondary text-sm py-8">
            No contacts found
          </p>
        ) : (
          filtered.map((u) => (
            <div
              key={u._id}
              onClick={() => { startConversation(u); onClose(); }}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer
                dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors"
            >
              <Avatar src={u.profilePicture} name={u.username} size="lg" isOnline={u.isOnline} />
              <div className="flex-1 min-w-0 border-b dark:border-wa-d-border border-wa-l-border py-1">
                <h4 className="dark:text-wa-d-text text-wa-l-text text-[15px] font-medium truncate">
                  {u.username || 'Unknown'}
                </h4>
                <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-[13px] truncate">
                  {u.about || 'Hey there! I am using WhatsApp Clone'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
