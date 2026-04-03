import { useState, useRef } from 'react';
import { IoArrowBack, IoCamera } from 'react-icons/io5';
import { MdEdit, MdCheck } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../api/api';
import Avatar from '../common/Avatar';

export default function ProfilePanel({ onClose }) {
  const { user, updateUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [about, setAbout] = useState(user?.about || '');
  const [editingName, setEditingName] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSave = async (field) => {
    try {
      const formData = new FormData();
      if (field === 'username') {
        formData.append('username', username.trim());
        setEditingName(false);
      } else {
        formData.append('about', about.trim());
        setEditingAbout(false);
      }

      const data = await authAPI.updateProfile(formData);
      if (data.success && data.user) {
        updateUser(data.user);
      }
    } catch (e) {
      console.error('Failed to update profile:', e);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const data = await authAPI.updateProfile(formData);
      if (data.success && data.user) {
        updateUser(data.user);
      }
    } catch (e) {
      console.error('Failed to upload photo:', e);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 dark:bg-wa-d-bg bg-wa-l-panel animate-slide-left flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-5 px-6 pt-14 pb-3 dark:bg-wa-teal bg-wa-teal">
        <button onClick={onClose} className="text-white cursor-pointer" id="close-profile-btn">
          <IoArrowBack size={22} />
        </button>
        <h2 className="text-white text-lg font-medium">Profile</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex justify-center py-8">
          <div className="relative group">
            <Avatar src={user?.profilePicture} name={user?.username} size="2xl" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <div className="text-center text-white">
                <IoCamera size={24} className="mx-auto" />
                <span className="text-xs mt-1 block">
                  {uploading ? 'Uploading...' : 'CHANGE'}
                </span>
              </div>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {/* Username */}
        <div className="px-8 py-4">
          <label className="text-wa-green text-sm font-medium">Your name</label>
          <div className="flex items-center gap-3 mt-2">
            {editingName ? (
              <>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={20}
                  className="flex-1 bg-transparent border-b-2 border-wa-green outline-none
                    dark:text-wa-d-text text-wa-l-text text-base pb-1"
                  autoFocus
                />
                <button onClick={() => handleSave('username')} className="text-wa-green cursor-pointer">
                  <MdCheck size={22} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 dark:text-wa-d-text text-wa-l-text text-base">
                  {user?.username || 'Unknown'}
                </span>
                <button onClick={() => setEditingName(true)} className="dark:text-wa-d-icon text-wa-l-icon cursor-pointer">
                  <MdEdit size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mx-8 border-t dark:border-wa-d-border border-wa-l-border" />

        {/* About */}
        <div className="px-8 py-4">
          <label className="text-wa-green text-sm font-medium">About</label>
          <div className="flex items-center gap-3 mt-2">
            {editingAbout ? (
              <>
                <input
                  type="text"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="flex-1 bg-transparent border-b-2 border-wa-green outline-none
                    dark:text-wa-d-text text-wa-l-text text-base pb-1"
                  autoFocus
                />
                <button onClick={() => handleSave('about')} className="text-wa-green cursor-pointer">
                  <MdCheck size={22} />
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 dark:text-wa-d-text text-wa-l-text text-base">
                  {user?.about || 'Hey there! I am using WhatsApp Clone'}
                </span>
                <button onClick={() => setEditingAbout(true)} className="dark:text-wa-d-icon text-wa-l-icon cursor-pointer">
                  <MdEdit size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mx-8 border-t dark:border-wa-d-border border-wa-l-border" />

        {/* Info */}
        <div className="px-8 py-4">
          <p className="dark:text-wa-d-text-secondary text-wa-l-text-secondary text-xs leading-5">
            This is not your username or pin. This name will be visible to your WhatsApp contacts.
          </p>
        </div>

        {/* Email/Phone */}
        {(user?.email || user?.phoneNumber) && (
          <div className="px-8 py-4">
            <label className="text-wa-green text-sm font-medium">Contact Info</label>
            {user?.email && (
              <p className="dark:text-wa-d-text text-wa-l-text text-sm mt-2">{user.email}</p>
            )}
            {user?.phoneNumber && (
              <p className="dark:text-wa-d-text text-wa-l-text text-sm mt-1">{user.phoneNumber}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
