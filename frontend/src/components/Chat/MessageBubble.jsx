import { formatTime } from '../../utils/formatters';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { IoCheckmark, IoCheckmarkDone } from 'react-icons/io5';
import { BsTrash } from 'react-icons/bs';
import { useState } from 'react';

export default function MessageBubble({ message }) {
  const { user } = useAuth();
  const { deleteMessage } = useChat();
  const [showActions, setShowActions] = useState(false);

  const isMine = message.sender?._id === user?.id;
  const status = message.messageStatus;

  const renderTick = () => {
    if (!isMine) return null;
    if (status === 'read') return <IoCheckmarkDone className="tick-read" size={16} />;
    if (status === 'delivered') return <IoCheckmarkDone className="tick-delivered" size={16} />;
    return <IoCheckmark className="tick-sent" size={16} />;
  };

  const renderMedia = () => {
    const url = message.ImageOrVideoUrl || message.imageOrVideoUrl;
    if (!url) return null;

    if (message.contentType === 'image') {
      return (
        <img
          src={url}
          alt="shared image"
          className="rounded-lg max-w-[280px] max-h-[300px] object-cover mb-1 cursor-pointer"
          onClick={() => window.open(url, '_blank')}
        />
      );
    }

    if (message.contentType === 'video') {
      return (
        <video
          src={url}
          controls
          className="rounded-lg max-w-[280px] max-h-[300px] mb-1"
        />
      );
    }

    return null;
  };

  return (
    <div
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} px-[6%] mb-0.5 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative max-w-[65%]">
        {/* Delete action */}
        {showActions && isMine && (
          <button
            onClick={() => deleteMessage(message._id)}
            className="absolute -left-8 top-1/2 -translate-y-1/2 p-1.5 rounded-full
              dark:bg-wa-d-panel bg-white shadow-md opacity-0 group-hover:opacity-100
              transition-opacity cursor-pointer z-10"
            title="Delete message"
          >
            <BsTrash className="dark:text-wa-d-text-secondary text-wa-l-text-secondary" size={14} />
          </button>
        )}

        <div
          className={`relative rounded-lg px-2.5 py-1.5 shadow-sm
            ${isMine
              ? 'dark:bg-wa-d-bubble-out bg-wa-l-bubble-out rounded-tr-none'
              : 'dark:bg-wa-d-bubble-in bg-wa-l-bubble-in rounded-tl-none'
            }`}
        >
          {/* Bubble tail */}
          <div
            className={`absolute top-0 w-3 h-3 ${
              isMine
                ? 'right-[-6px] dark:border-l-wa-d-bubble-out border-l-wa-l-bubble-out'
                : 'left-[-6px] dark:border-r-wa-d-bubble-in border-r-wa-l-bubble-in'
            }`}
            style={{
              clipPath: isMine
                ? 'polygon(0 0, 0 100%, 100% 0)'
                : 'polygon(100% 0, 100% 100%, 0 0)',
              background: 'inherit',
            }}
          />

          {renderMedia()}

          {message.content && (
            <p className={`text-[14.2px] leading-[19px] whitespace-pre-wrap break-words
              ${isMine
                ? 'dark:text-wa-d-text text-wa-l-text'
                : 'dark:text-wa-d-text text-wa-l-text'
              }`}
            >
              {message.content}
            </p>
          )}

          {/* Time + ticks */}
          <div className={`flex items-center gap-1 mt-0.5 float-right ml-3
            ${isMine ? '' : ''}`}>
            <span className="text-[11px] dark:text-wa-d-text-secondary text-wa-l-text-secondary opacity-70 leading-none">
              {formatTime(message.createdAt)}
            </span>
            {renderTick()}
          </div>
          <div className="clear-both" />
        </div>
      </div>
    </div>
  );
}
