import { IoSearch } from 'react-icons/io5';

export default function SearchBar({ value, onChange, placeholder = 'Search or start new chat' }) {
  return (
    <div className="px-3 py-1.5">
      <div
        className="flex items-center gap-3 rounded-lg px-3 py-1.5
          dark:bg-wa-d-search bg-wa-l-search transition-colors"
      >
        <IoSearch className="text-wa-d-text-secondary dark:text-wa-d-text-secondary text-wa-l-text-secondary shrink-0" size={18} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none
            dark:text-wa-d-text text-wa-l-text
            dark:placeholder-wa-d-text-secondary placeholder-wa-l-text-secondary"
        />
      </div>
    </div>
  );
}
