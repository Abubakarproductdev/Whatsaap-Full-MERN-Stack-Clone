import { getInitials } from '../../utils/formatters';

export default function Avatar({ src, name, size = 'md', isOnline, className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-20 h-20 text-2xl',
    '2xl': 'w-32 h-32 text-4xl',
  };

  const dotSizes = {
    sm: 'w-2 h-2 border',
    md: 'w-2.5 h-2.5 border-[1.5px]',
    lg: 'w-3 h-3 border-2',
    xl: 'w-4 h-4 border-2',
    '2xl': 'w-5 h-5 border-2',
  };

  return (
    <div className={`relative shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name || 'avatar'}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center
            bg-wa-d-hover dark:bg-wa-d-hover bg-wa-l-search
            text-wa-d-text-secondary font-semibold select-none`}
        >
          {getInitials(name)}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute bottom-0 right-0 ${dotSizes[size]} rounded-full
            bg-wa-green border-wa-d-bg dark:border-wa-d-bg border-white`}
        />
      )}
    </div>
  );
}
