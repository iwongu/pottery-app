import api from './api';
import { UserProfile, UserUpdateData } from '../types'; // Assuming User is also needed by UserProfile

// The base URL for constructing profile photo URLs.
// Ensure this is configured in your .env files and accessible here.
const PROFILE_PICS_BASE_URL = `${process.env.REACT_APP_UPLOADS_URL || 'http://localhost:8000'}/uploads/profile_pics/`;

// Helper to construct full profile photo URL
const constructUserProfile = (user: any): UserProfile => {
  return {
    ...user,
    profile_photo_url: user.profile_photo_filename 
      ? `${PROFILE_PICS_BASE_URL}${user.profile_photo_filename}`
      : null,
  };
};

export const getUserProfile = async (userId: string): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>(`/users/${userId}`);
    return constructUserProfile(response.data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async (): Promise<UserProfile> => {
  try {
    const response = await api.get<UserProfile>('/users/me');
    return constructUserProfile(response.data);
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profileData: FormData): Promise<UserProfile> => {
  try {
    const response = await api.put<UserProfile>('/users/me/profile', profileData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return constructUserProfile(response.data);
  } catch (error)
    {
    console.error('Error updating user profile:', error);
    // It's good to inspect the error response from the server if available
    // if (error.response) {
    //   console.error('Error data:', error.response.data);
    //   console.error('Error status:', error.response.status);
    // }
    throw error;
  }
};

// Example of how the FormData should be constructed in the component calling this:
// const formData = new FormData();
// if (name) formData.append('name', name);
// if (bio) formData.append('bio', bio);
// if (profilePhotoFile) formData.append('profile_photo', profilePhotoFile);
// if (clearProfilePhoto) formData.append('clear_profile_photo', 'true'); // Send as string 'true'
// await updateUserProfile(formData);

export default {
  getUserProfile,
  getCurrentUserProfile,
  updateUserProfile,
};
