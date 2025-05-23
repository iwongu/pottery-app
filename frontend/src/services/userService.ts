import apiClient from './api'; // Assuming api.ts exports a configured axios instance
import { User } from '../types'; // Assuming User type will be updated/available in types/index.ts

// Define a type for the update payload. This should align with backend's UserUpdate schema.
export interface UserUpdatePayload {
  username?: string;
  password?: string;
  bio?: string;
}

const userService = {
  getUserProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateUserProfile: async (userData: UserUpdatePayload): Promise<User> => {
    const response = await apiClient.put<User>('/users/me', userData);
    return response.data;
  },
};

export default userService;
