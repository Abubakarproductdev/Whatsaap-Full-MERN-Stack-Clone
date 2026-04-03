import { useState, useRef, useCallback } from 'react';
import { IoSend, IoHappy, IoClose } from 'react-icons/io5';
import { ImAttachment } from 'react-icons/im';
import { BsImageFill, BsCameraVideoFill } from 'react-icons/bs';
import EmojiPicker from 'emoji-picker-react';
import { useTheme } from '../../context/ThemeContext';
import { useSocket } from '../../context/SocketContext';

export default function MessageInput({ onSend, conversation }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isDark } = useTheme();
  const { emitTyping, emitStopTyping } = useSocket();

  const receiverId = conversation?.user?.id;
  const convId = conversation?.conversationId;

  const handleTyping = useCallback(() => {
    if (convId && receiverId) {
      emitTyping(convId, receiverId);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(convId, receiverId);
      }, 2000);
    }
  }, [convId, receiverId, emitTyping, emitStopTyping]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !file) return;

    if (convId && receiverId) {
      emitStopTyping(convId, receiverId);
    }

    await onSend({ content: trimmed || '', file });
    setText('');
    setFile(null);
    setPreview(null);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setShowAttach(false);

    if (selected.type.startsWith('image/') || selected.type.startsWith('video/')) {
      const url = URL.createObjectURL(selected);
      setPreview({ url, type: selected.type.startsWith('image/') ? 'image' : 'video' });
    }
  };

  const removeFile = () => {
    setFile(null);
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const onEmojiClick = (emojiData) => {
    setText((prev) => prev + emojiData.emoji);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmoji && (
        <div className="absolute bottom-full left-0 z-50 animate-scale-in">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            theme={isDark ? 'dark' : 'light'}
            width={350}
            height={400}
            searchPlaceholder="Search emoji"
            previewConfig={{ showPreview: false }}
          />
        </div>
      )}

      {/* File preview */}
      {preview && (
        <div className="px-4 py-2 dark:bg-wa-d-header bg-wa-l-header border-t dark:border-wa-d-border border-wa-l-border">
          <div className="relative inline-block">
            {preview.type === 'image' ? (
              <img src={preview.url} alt="preview" className="h-20 rounded-lg object-cover" />
            ) : (
              <video src={preview.url} className="h-20 rounded-lg" />
            )}
            <button
              onClick={removeFile}
              className="absolute -top-2 -right-2 bg-wa-d-panel rounded-full p-0.5 shadow cursor-pointer"
            >
              <IoClose className="text-white" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Input bar */}
      <div className="flex items-end gap-2 px-4 py-2.5 dark:bg-wa-d-header bg-wa-l-header
        border-t dark:border-wa-d-border border-wa-l-border">
        {/* Emoji button */}
        <button
          onClick={() => { setShowEmoji((p) => !p); setShowAttach(false); }}
          className={`p-2 rounded-full transition-colors cursor-pointer
            ${showEmoji ? 'text-wa-green' : 'dark:text-wa-d-icon text-wa-l-icon'}
            dark:hover:bg-wa-d-hover hover:bg-wa-l-hover`}
          id="emoji-btn"
        >
          <IoHappy size={24} />
        </button>

        {/* Attachment */}
        <div className="relative">
          <button
            onClick={() => { setShowAttach((p) => !p); setShowEmoji(false); }}
            className="p-2 rounded-full dark:text-wa-d-icon text-wa-l-icon
              dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
            id="attach-btn"
          >
            <ImAttachment size={20} className="rotate-45" />
          </button>

          {showAttach && (
            <div className="absolute bottom-full left-0 mb-2 flex flex-col gap-2 animate-scale-in">
              <button
                onClick={() => { fileInputRef.current.accept = 'image/*'; fileInputRef.current.click(); }}
                className="w-12 h-12 rounded-full bg-purple-500 flex items-center justify-center shadow-lg
                  hover:scale-110 transition-transform cursor-pointer"
                title="Photo"
              >
                <BsImageFill className="text-white" size={20} />
              </button>
              <button
                onClick={() => { fileInputRef.current.accept = 'video/*'; fileInputRef.current.click(); }}
                className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center shadow-lg
                  hover:scale-110 transition-transform cursor-pointer"
                title="Video"
              >
                <BsCameraVideoFill className="text-white" size={20} />
              </button>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*"
        />

        {/* Text input */}
        <div className="flex-1 dark:bg-wa-d-input bg-wa-l-search rounded-lg px-3 py-2.5 min-h-[42px] max-h-[120px] flex items-center">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => { setText(e.target.value); handleTyping(); }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message"
            rows={1}
            className="w-full bg-transparent text-[15px] outline-none resize-none
              dark:text-wa-d-text text-wa-l-text
              dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary
              leading-[20px] max-h-[100px] overflow-y-auto"
            style={{ height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
            id="message-input"
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() && !file}
          className={`p-2 rounded-full transition-all cursor-pointer
            ${text.trim() || file
              ? 'text-wa-green hover:bg-wa-green/10'
              : 'dark:text-wa-d-icon text-wa-l-icon opacity-50 cursor-not-allowed'
            }`}
          id="send-btn"
        >
          <IoSend size={22} />
        </button>
      </div>
    </div>
  );
}
