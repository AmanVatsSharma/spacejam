import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, clearTokens, saveTokens } from './storage';
import { apolloClient } from '../apollo/client';
import { GET_ME } from '../apollo/operations';

// ─── Demo Mode ────────────────────────────────────────────────────────────────
// Set to `true` to skip login entirely and boot directly to the dashboard.
// Only active in __DEV__ builds — has zero effect in production.
// Remember to set back to `false` before a real release.
const DEMO_MODE = true;

const DEMO_USER: User = {
  id: 'demo-001',
  email: 'demo@spacejam.com',
  name: 'Demo User',
  role: 'MEMBER',
};
// ──────────────────────────────────────────────────────────────────────────────


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
  // In demo mode, boot straight to the dashboard with a fake user.
  const [user, setUser] = useState<User | null>(__DEV__ && DEMO_MODE ? DEMO_USER : null);
  const [isLoading, setIsLoading] = useState(!(__DEV__ && DEMO_MODE));

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
    // Skip the network check entirely in demo mode.
    if (__DEV__ && DEMO_MODE) return;
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
