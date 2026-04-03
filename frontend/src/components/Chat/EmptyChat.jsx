import { BiLock } from 'react-icons/bi';

export default function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center dark:bg-wa-d-bg-deeper bg-wa-l-bg animate-fade-in">
      {/* WhatsApp Logo */}
      <div className="mb-6">
        <svg width="320" height="188" viewBox="0 0 320 188" className="opacity-20 dark:opacity-10">
          <defs>
            <linearGradient id="wa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00a884" />
              <stop offset="100%" stopColor="#005c4b" />
            </linearGradient>
          </defs>
          <rect x="35" y="20" width="110" height="148" rx="10" fill="url(#wa-grad)" opacity="0.3"/>
          <rect x="175" y="20" width="110" height="148" rx="10" fill="url(#wa-grad)" opacity="0.15"/>
          <circle cx="90" cy="60" r="20" fill="url(#wa-grad)" opacity="0.4"/>
          <circle cx="230" cy="60" r="20" fill="url(#wa-grad)" opacity="0.25"/>
          <rect x="55" y="95" width="70" height="8" rx="4" fill="url(#wa-grad)" opacity="0.3"/>
          <rect x="55" y="112" width="50" height="6" rx="3" fill="url(#wa-grad)" opacity="0.2"/>
          <rect x="55" y="128" width="60" height="6" rx="3" fill="url(#wa-grad)" opacity="0.2"/>
          <rect x="195" y="95" width="70" height="8" rx="4" fill="url(#wa-grad)" opacity="0.2"/>
          <rect x="195" y="112" width="50" height="6" rx="3" fill="url(#wa-grad)" opacity="0.15"/>
          <line x1="155" y1="50" x2="165" y2="50" stroke="url(#wa-grad)" strokeWidth="2" opacity="0.3"/>
          <line x1="155" y1="94" x2="165" y2="94" stroke="url(#wa-grad)" strokeWidth="2" opacity="0.3"/>
          <line x1="155" y1="138" x2="165" y2="138" stroke="url(#wa-grad)" strokeWidth="2" opacity="0.3"/>
        </svg>
      </div>

      <h1 className="text-3xl font-light dark:text-wa-d-text text-wa-l-text mb-3">
        WhatsApp Web
      </h1>
      <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-sm text-center max-w-md leading-relaxed">
        Send and receive messages without keeping your phone online.<br />
        Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
      </p>

      <div className="mt-16 flex items-center gap-2 dark:text-wa-d-text-secondary text-wa-l-text-secondary text-xs">
        <BiLock size={14} />
        <span>End-to-end encrypted</span>
      </div>
    </div>
  );
}
