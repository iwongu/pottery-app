import apiClient from './api';
import { TokenResponse, User } from '../types'; // Assuming User type is defined for login response if needed

interface AuthCredentials {
    email: string;
    password: string;
}

export const registerUser = async (credentials: AuthCredentials): Promise<User> => {
    const response = await apiClient.post<User>('/auth/register', credentials);
    return response.data;
};

export const loginUser = async (credentials: AuthCredentials): Promise<TokenResponse> => {
    // FastAPI's OAuth2PasswordRequestForm expects form data, not JSON
    const formData = new URLSearchParams();
    formData.append('username', credentials.email); // 'username' is the default field name for email
    formData.append('password', credentials.password);

    const response = await apiClient.post<TokenResponse>('/auth/login', formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data;
};

// Optional: If you have a /users/me endpoint to fetch user data after login
// export const getMe = async (): Promise<User> => {
//     const response = await apiClient.get<User>('/users/me'); // Ensure this endpoint exists on backend
//     return response.data;
// };