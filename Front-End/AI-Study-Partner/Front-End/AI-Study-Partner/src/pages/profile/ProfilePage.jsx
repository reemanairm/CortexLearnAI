import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import authService from '../../services/authservice';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, email: user.email });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile(formData);
      toast.success('Profile updated');
      updateProfile(formData); // update context
    } catch (error) {
      console.error('Profile update error', error);
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setChanging(true);
    try {
      await authService.changePassword(passwords);
      toast.success('Password changed');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Change password error', error);
      toast.error('Failed to change password');
    } finally {
      setChanging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-xl">
      <h1 className="text-2xl font-bold">Profile</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-sm">Username</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full p-2 rounded bg-slate-800 outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 rounded bg-slate-800 outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </button>
      </form>

      <div>
        <h2 className="text-xl font-semibold">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4 mt-2">
          <div>
            <label className="block text-sm">Current Password</label>
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full p-2 rounded bg-slate-800 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm">New Password</label>
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full p-2 rounded bg-slate-800 outline-none"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changing}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {changing ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
