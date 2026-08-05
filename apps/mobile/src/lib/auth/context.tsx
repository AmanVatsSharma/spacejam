import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearTokens, saveTokens } from './storage';
import { apolloClient } from '../apollo/client';
import { GET_ME } from '../apollo/operations';

export type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  center?: { id: string; name: string };
};

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const { data } = await apolloClient.query({
        query: GET_ME,
        fetchPolicy: 'network-only',
      });
      
      if (data?.me) {
        setUser(data.me);
      } else {
        await clearTokens();
      }
    } catch (error) {
      console.error('Failed to load user', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (userData: User, accessToken: string, refreshToken: string) => {
    await saveTokens(accessToken, refreshToken);
    setUser(userData);
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
    await apolloClient.clearStore();
  };

  const refreshUser = async () => {
    await loadUser();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser
    }}>
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
