import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { User, Mail, MapPin, Globe, Edit, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    avatar: user?.avatar || ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear messages when user starts typing
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await userAPI.updateProfile(formData);
      
      if (result.success) {
        updateUser(result.data.user);
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: user?.bio || '',
      location: user?.location || '',
      website: user?.website || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-secondary flex items-center space-x-1"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleCancel}
                className="btn btn-secondary flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn btn-primary flex items-center space-x-1 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
              {formData.avatar ? (
                <img 
                  src={formData.avatar} 
                  alt={user.username}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <User className="h-10 w-10 text-primary-600" />
              )}
            </div>
            
            {isEditing ? (
              <div className="flex-1">
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                  Avatar URL (Optional)
                </label>
                <input
                  type="url"
                  id="avatar"
                  name="avatar"
                  value={formData.avatar}
                  onChange={handleChange}
                  placeholder="https://example.com/avatar.jpg"
                  className="input"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Provide a URL to an image for your profile picture
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900">{user.username}</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            )}
          </div>

          {/* Basic Info (Read-only) */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="input bg-gray-50 text-gray-600 cursor-not-allowed flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>{user.username}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Username cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="input bg-gray-50 text-gray-600 cursor-not-allowed flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Email cannot be changed
              </p>
            </div>
          </div>

          {/* Editable Fields */}
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            {isEditing ? (
              <div>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                  className="input resize-none"
                />
                <p className="mt-1 text-sm text-gray-500">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            ) : (
              <div className="input bg-gray-50 min-h-24 flex items-start">
                {user.bio || (
                  <span className="text-gray-500 italic">No bio provided</span>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              {isEditing ? (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Where are you based?"
                    maxLength={100}
                    className="input pl-10"
                  />
                </div>
              ) : (
                <div className="input bg-gray-50 flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className={user.location ? '' : 'text-gray-500 italic'}>
                    {user.location || 'No location provided'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              {isEditing ? (
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://your-website.com"
                    className="input pl-10"
                  />
                </div>
              ) : (
                <div className="input bg-gray-50 flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  {user.website ? (
                    <a 
                      href={user.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 truncate"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <span className="text-gray-500 italic">No website provided</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-gray-600">Member since:</span>
                <div className="font-medium">
                  {new Date(user.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Profile last updated:</span>
                <div className="font-medium">
                  {new Date(user.updatedAt || user.joinedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile; 