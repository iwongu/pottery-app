import React, { useEffect, useState } from 'react';
import userService from '../services/userService';
import { User } from '../types';
// Import UserProfileForm once it's created (next step)
import UserProfileForm from '../components/User/UserProfileForm'; 
import { useAuth } from '../contexts/AuthContext'; // To potentially update context

const UserProfilePage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { setUser: setAuthUser } = useAuth(); // Get setUser from context
  
  // Potentially use AuthContext to update user info globally after edit
  // const auth = React.useContext(AuthContext); // This line will be removed by not including it in REPLACE

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserProfile();
        setUser(userData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch user profile.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileUpdate = (updatedUser: User) => {
    setUser(updatedUser); // Update local page state
    setAuthUser(updatedUser); // Update AuthContext
    // Optionally, update the user in AuthContext as well
    // auth?.setUser(updatedUser); 
    // Or call a specific function like auth?.refreshUser();
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  if (!user) {
    return <p>No user data found.</p>; // Should not happen if route is protected
  }

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>User Profile</h2>
      <div>
        <p><strong>Email:</strong> {user.email}</p>
        {/* Display current username and bio - these will be part of the form view too */}
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Bio:</strong> {user.bio || 'Not set'}</p>
      </div>
      
      <hr style={{ margin: '20px 0' }} />

      <h3>Edit Profile</h3>
      {/* 
        The UserProfileForm will be integrated here.
        It will take the current user data and a callback for when the profile is updated.
        Example:
        <UserProfileForm currentUser={user} onProfileUpdated={handleProfileUpdate} />
      */}
      <UserProfileForm currentUser={user} onProfileUpdated={handleProfileUpdate} />
      
    </div>
  );
};

export default UserProfilePage;
