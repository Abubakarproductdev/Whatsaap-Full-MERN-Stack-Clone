import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import Spinner from '../common/Spinner';
import { formatMessageDate } from '../../utils/formatters';

export default function MessageList({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center dark:bg-wa-d-bg-deeper bg-wa-l-bg-deeper chat-wallpaper">
        <Spinner size="lg" />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;

  messages.forEach((msg) => {
    const msgDate = formatMessageDate(msg.createdAt);
    if (msgDate !== currentDate) {
      groupedMessages.push({ type: 'date', date: msgDate, key: `date-${msg._id}` });
      currentDate = msgDate;
    }
    groupedMessages.push({ type: 'message', message: msg, key: msg._id });
  });

  return (
    <div className="flex-1 overflow-y-auto py-2 dark:bg-wa-d-bg-deeper bg-wa-l-bg-deeper chat-wallpaper">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="bg-yellow-900/20 dark:bg-yellow-500/10 text-yellow-200 dark:text-yellow-200/70 text-xs px-4 py-2 rounded-lg shadow-sm">
            No messages yet. Say hello! 👋
          </div>
        </div>
      ) : (
        groupedMessages.map((item) =>
          item.type === 'date' ? (
            <div key={item.key} className="flex justify-center my-3">
              <span className="dark:bg-wa-d-panel bg-white text-[12.5px] dark:text-wa-d-text-secondary text-wa-l-text-secondary
                px-3 py-1 rounded-lg shadow-sm font-medium">
                {item.date}
              </span>
            </div>
          ) : (
            <MessageBubble key={item.key} message={item.message} />
          )
        )
      )}
      <div ref={bottomRef} />
    </div>
  );
}
