import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../types';
import apiClient from '../services/api'; // Assuming you have an api client setup

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('accessToken'));
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                localStorage.setItem('accessToken', token);
                // You'd typically have an endpoint like /users/me to get current user
                try {
                    // const response = await apiClient.get<User>('/users/me'); // Create this endpoint
                    // setUser(response.data);
                    // For now, if token exists, assume logged in.
                    // A proper implementation would verify token and fetch user data.
                    console.log("Token exists, user session potentially active. Fetch user data here.");
                } catch (error) {
                    console.error("Failed to fetch user or token invalid", error);
                    localStorage.removeItem('accessToken');
                    setToken(null);
                    setUser(null);
                }
            }
            setIsLoading(false);
        };
        fetchUser();
    }, [token]);

    const login = async (newToken: string) => {
        setToken(newToken);
        localStorage.setItem('accessToken', newToken);
        // Fetch user data after login
        // const response = await apiClient.get<User>('/users/me');
        // setUser(response.data);
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('accessToken');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};