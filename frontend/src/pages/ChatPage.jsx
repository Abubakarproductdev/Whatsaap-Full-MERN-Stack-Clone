import { useState } from 'react';
import Sidebar from '../components/Sidebar/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import ProfilePanel from '../components/Profile/ProfilePanel';
import { ChatProvider, useChat } from '../context/ChatContext';

export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageLayout />
    </ChatProvider>
  );
}

function ChatPageLayout() {
  const { activeConversation } = useChat();
  const [showProfile, setShowProfile] = useState(false);
  const showMobileChat = !!activeConversation;

  return (
    <div className="h-full flex dark:bg-wa-d-bg-deeper bg-wa-l-bg" id="chat-page">
      {/* Optional top accent bar */}
      <div className="fixed top-0 left-0 right-0 h-[127px] bg-wa-teal dark:bg-wa-teal-dark z-0" />

      {/* Main container */}
      <div className="relative z-10 flex w-full max-w-[1600px] mx-auto my-0 md:my-5 h-full md:h-[calc(100%-40px)]
          shadow-2xl overflow-hidden md:rounded-sm">
        {/* Sidebar */}
        <div className={`${showMobileChat ? 'hidden' : 'w-full'} md:block md:w-[400px] lg:w-[440px] shrink-0 relative`}>
          <Sidebar onProfileClick={() => setShowProfile(true)} />
          {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
        </div>

        {/* Chat area */}
        <div className={`${showMobileChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col dark:bg-wa-d-bg-deeper bg-wa-l-bg-deeper`}>
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
