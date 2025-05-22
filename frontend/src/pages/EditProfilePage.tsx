import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EditProfileForm from '../components/EditProfileForm';
import userService from '../services/userService'; // Assuming default export
import { UserProfile } from '../types';

const EditProfilePage: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // For page load
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false); // For form submission
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const currentUserData = await userService.getCurrentUserProfile();
        setUser(currentUserData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch user profile. Please try again.');
        console.error("Error fetching current user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const updatedUser = await userService.updateUserProfile(formData);
      setUser(updatedUser); // Update local state with the response
      setSuccessMessage('Profile updated successfully!');
      // Optionally, navigate away after a short delay
      setTimeout(() => {
        // Assuming 'me' in /users/me will resolve to current user's profile page
        // Or navigate to a specific user ID if available and preferred.
        // The UserPage will need to handle fetching the user by 'me' or ID.
        navigate('/users/me'); 
      }, 1500);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p>Loading profile...</p>;
  }

  // Error during initial page load
  if (error && !user) { 
    return <p style={{ color: 'red' }}>Error: {error}</p>;
  }

  if (!user) {
    // This case might occur if loading finishes but user is still null without an error
    // (e.g., if API returns empty successfully, though getCurrentUserProfile should ideally error out)
    return <p>Could not load user profile. Please try refreshing the page.</p>;
  }

  return (
    <div>
      <h1>Edit Profile</h1>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {/* Pass form-specific error and loading state to EditProfileForm */}
      <EditProfileForm 
        currentUser={user} 
        onSubmit={handleSubmit} 
        isLoading={isSubmitting} // Pass form submission loading state
        error={error && isSubmitting ? error : null} // Pass form submission error
      />
    </div>
  );
};

export default EditProfilePage;
