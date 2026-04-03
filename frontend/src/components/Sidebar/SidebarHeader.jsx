import Avatar from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { BiMessageRoundedAdd } from 'react-icons/bi';
import { IoMoonOutline, IoSunnyOutline } from 'react-icons/io5';
import { HiOutlineDotsVertical } from 'react-icons/hi';
import { useState, useRef, useEffect } from 'react';

export default function SidebarHeader({ onProfileClick, onNewChatClick }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 dark:bg-wa-d-header bg-wa-l-header">
      {/* Profile avatar */}
      <button onClick={onProfileClick} className="cursor-pointer" id="sidebar-profile-btn">
        <Avatar
          src={user?.profilePicture}
          name={user?.username}
          size="md"
        />
      </button>

      {/* Action icons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onNewChatClick}
          className="p-2 rounded-full dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
          title="New chat"
          id="new-chat-btn"
        >
          <BiMessageRoundedAdd className="dark:text-wa-d-icon text-wa-l-icon" size={22} />
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-full dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
          title={isDark ? 'Light mode' : 'Dark mode'}
          id="theme-toggle-btn"
        >
          {isDark
            ? <IoSunnyOutline className="text-wa-d-icon" size={20} />
            : <IoMoonOutline className="text-wa-l-icon" size={20} />
          }
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-full dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
            id="sidebar-menu-btn"
          >
            <HiOutlineDotsVertical className="dark:text-wa-d-icon text-wa-l-icon" size={20} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 py-2 rounded-md shadow-xl z-50 animate-scale-in
              dark:bg-wa-d-panel bg-white border dark:border-wa-d-border border-wa-l-border">
              <button
                onClick={() => { onProfileClick(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm dark:text-wa-d-text text-wa-l-text
                  dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
              >
                Profile
              </button>
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm dark:text-wa-d-text text-wa-l-text
                  dark:hover:bg-wa-d-hover hover:bg-wa-l-hover transition-colors cursor-pointer"
                id="logout-btn"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
