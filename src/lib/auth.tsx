'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const token = localStorage.getItem('accessToken');
      const savedUser = localStorage.getItem('user');
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch {}
    setLoading(false);
  }, []);

  const loginWithTokens = async (accessToken: string, refreshToken: string) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    const profile = await api.get('/users/me');
    localStorage.setItem('user', JSON.stringify(profile.data.data));
    setUser(profile.data.data);
  };
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    const profile = await api.get('/users/me');
    localStorage.setItem('user', JSON.stringify(profile.data.data));
    setUser(profile.data.data);
  };

  const refreshUser = async () => {
    const profile = await api.get('/users/me');
    localStorage.setItem('user', JSON.stringify(profile.data.data));
    setUser(profile.data.data);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.clear();
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithTokens, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
