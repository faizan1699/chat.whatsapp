'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Camera, Loader2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/slices/authSlice';
import { selectUser } from '@/store/slices/authSlice';

interface UserProfile {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfile({ isOpen, onClose }: EditProfileProps) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phoneNumber: '',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch user profile data when component opens
  useEffect(() => {
    if (isOpen && currentUser?.id) {
      fetchProfile();
    }
  }, [isOpen, currentUser?.id]);

  const fetchProfile = async () => {
    try {
      setFetchLoading(true);
      setError(null);
      
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      const userProfile = data.data;
      setProfile(userProfile);
      setFormData({
        username: userProfile.username || '',
        email: userProfile.email || '',
        phoneNumber: userProfile.phoneNumber || '',
        avatar: userProfile.avatar || ''
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (formData.username.trim().length < 3) {
      setError('Username must be at least 3 characters long');
      return;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update Redux store with new user data
      dispatch(updateUser({
        username: data.data.username,
        email: data.data.email,
        phone: data.data.phoneNumber,
        avatar: data.data.avatar
      }));

      setProfile(data.data);
      setSuccess('Profile updated successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {fetchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-blue-500" size={24} />
              <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter username"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  {success}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
