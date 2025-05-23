import React, { useState, useEffect } from 'react';
import userService, { UserUpdatePayload } from '../../services/userService';
import { User } from '../../types';

interface UserProfileFormProps {
  currentUser: User;
  onProfileUpdated: (updatedUser: User) => void;
}

const UserProfileForm: React.FC<UserProfileFormProps> = ({ currentUser, onProfileUpdated }) => {
  const [username, setUsername] = useState<string>(currentUser.username);
  const [password, setPassword] = useState<string>(''); // For new password
  const [bio, setBio] = useState<string>(currentUser.bio || '');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Effect to reset form fields if currentUser prop changes (e.g., after an update)
  useEffect(() => {
    setUsername(currentUser.username);
    setBio(currentUser.bio || '');
    setPassword(''); // Clear password field
  }, [currentUser]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    const payload: UserUpdatePayload = {};
    if (username !== currentUser.username) {
      payload.username = username;
    }
    if (password) { // Only include password if a new one is typed
      payload.password = password;
    }
    if (bio !== (currentUser.bio || '')) { // Handle current bio possibly being null/undefined
      payload.bio = bio;
    }

    if (Object.keys(payload).length === 0) {
      setSuccessMessage("No changes to save.");
      setIsLoading(false);
      return;
    }

    try {
      const updatedUser = await userService.updateUserProfile(payload);
      onProfileUpdated(updatedUser);
      setSuccessMessage('Profile updated successfully!');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>New Password (leave blank to keep current):</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="bio" style={{ display: 'block', marginBottom: '5px' }}>Bio:</label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
        />
      </div>

      <button type="submit" disabled={isLoading} style={{ padding: '10px 15px' }}>
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
};

export default UserProfileForm;
