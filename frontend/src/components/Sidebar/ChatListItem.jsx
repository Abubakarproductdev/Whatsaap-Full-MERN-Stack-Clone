import Avatar from '../common/Avatar';
import { formatChatDate, truncateText } from '../../utils/formatters';
import { useSocket } from '../../context/SocketContext';
import { IoCheckmarkDone, IoCheckmark } from 'react-icons/io5';
import { BsCameraVideoFill, BsImageFill } from 'react-icons/bs';

export default function ChatListItem({ conversation, isActive, onClick }) {
  const { onlineUsers } = useSocket();
  const { user: otherUser, lastMessage, unreadCount, updatedAt } = conversation;

  const onlineData = onlineUsers[otherUser?.id];
  const isOnline = onlineData?.isOnline ?? otherUser?.isOnline;

  const renderLastMessage = () => {
    if (!lastMessage) return <span className="italic opacity-50">No messages yet</span>;

    const prefix =
      lastMessage.contentType === 'image' ? (
        <span className="inline-flex items-center gap-1"><BsImageFill size={14} /> Photo</span>
      ) : lastMessage.contentType === 'video' ? (
        <span className="inline-flex items-center gap-1"><BsCameraVideoFill size={14} /> Video</span>
      ) : null;

    return prefix || truncateText(lastMessage.content);
  };

  const renderTicks = () => {
    if (!lastMessage) return null;
    const status = lastMessage.messageStatus;
    if (status === 'read') return <IoCheckmarkDone className="tick-read shrink-0" size={16} />;
    if (status === 'delivered') return <IoCheckmarkDone className="tick-delivered shrink-0" size={16} />;
    return <IoCheckmark className="tick-sent shrink-0" size={16} />;
  };

  return (
    <div
      id={`chat-item-${otherUser?.id}`}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors
        ${isActive
          ? 'dark:bg-wa-d-active bg-wa-l-active'
          : 'dark:hover:bg-wa-d-hover hover:bg-wa-l-hover'
        }`}
    >
      <Avatar
        src={otherUser?.profilePicture}
        name={otherUser?.username}
        size="lg"
        isOnline={isOnline}
      />

      <div className="flex-1 min-w-0 border-b dark:border-wa-d-border border-wa-l-border py-1">
        <div className="flex items-center justify-between">
          <h3 className="dark:text-wa-d-text text-wa-l-text font-medium text-[15px] truncate">
            {otherUser?.username || 'Unknown'}
          </h3>
          <span
            className={`text-xs shrink-0 ml-2
              ${unreadCount > 0
                ? 'text-wa-green font-medium'
                : 'dark:text-wa-d-text-secondary text-wa-l-text-secondary'
              }`}
          >
            {formatChatDate(lastMessage?.createdAt || updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between mt-0.5">
          <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-[13px] truncate flex items-center gap-1">
            {renderTicks()}
            {renderLastMessage()}
          </p>
          {unreadCount > 0 && (
            <span className="ml-2 bg-wa-green text-white text-[11px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shrink-0">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
