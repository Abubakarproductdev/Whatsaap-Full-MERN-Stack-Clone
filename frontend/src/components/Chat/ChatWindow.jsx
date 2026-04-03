import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyChat from './EmptyChat';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

export default function ChatWindow() {
  const { activeConversation, messages, loadingMessages, sendMessage, setActiveConversation } = useChat();
  const { user } = useAuth();

  if (!activeConversation) {
    return <EmptyChat />;
  }

  const otherUser = activeConversation.user;

  const handleSend = async ({ content, file }) => {
    await sendMessage({
      content,
      file,
      receiverEmail: otherUser?.email || undefined,
      receiverPhone: otherUser?.phoneNumber || undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full" id="chat-window">
      <ChatHeader
        conversation={activeConversation}
        onBackClick={() => setActiveConversation(null)}
      />
      <MessageList messages={messages} loading={loadingMessages} />
      <MessageInput
        onSend={handleSend}
        conversation={activeConversation}
      />
    </div>
  );
}
