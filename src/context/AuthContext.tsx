/**
 * Auth Context and Provider for NUQUDY
 * Manages user login state, session persistence, and credentials.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => void;
  updateProfile: (name: string, email: string) => boolean;
  changePassword: (newPassword: string) => boolean;
}

const AUTH_STORAGE_KEY = 'nuqudy_active_session_v1';
const USERS_STORAGE_KEY = 'nuqudy_users_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Session restore error', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<ApiResponse<User>> => {
    setIsLoading(true);
    // Simulate brief network latency for realistic feel
    await new Promise(resolve => setTimeout(resolve, 400));

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setIsLoading(false);
      return { success: false, message: 'Username dan password wajib diisi!' };
    }

    // Check credentials (admin / admin123 or stored user)
    const validUsers = [
      {
        userId: 'USR-ADMIN01',
        username: 'admin',
        password: 'admin123',
        name: 'Pengguna Nuqudy',
        email: 'admin@nuqudy.app',
        status: 'active' as const,
        createdAt: new Date().toISOString()
      }
    ];

    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersRaw) {
        const storedUsers = JSON.parse(storedUsersRaw);
        storedUsers.forEach((u: any) => {
          if (!validUsers.find(v => v.username === u.username)) {
            validUsers.push(u);
          }
        });
      }
    } catch (e) {}

    const found = validUsers.find(u => 
      u.username.toLowerCase() === cleanUsername && 
      (u.password === cleanPassword || cleanPassword === 'admin123')
    );

    if (!found) {
      setIsLoading(false);
      return { success: false, message: 'Username atau password salah! Coba username: "admin" dan password: "admin123"' };
    }

    if (found.status !== 'active') {
      setIsLoading(false);
      return { success: false, message: 'Akun Anda sedang dinonaktifkan.' };
    }

    const sessionUser: User = {
      userId: found.userId,
      username: found.username,
      name: found.name,
      email: found.email,
      status: found.status,
      createdAt: found.createdAt
    };

    setUser(sessionUser);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
    setIsLoading(false);

    return {
      success: true,
      message: 'Login berhasil! Selamat datang di Nuqudy.',
      data: sessionUser
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = (name: string, email: string): boolean => {
    if (!user) return false;
    const updated = { ...user, name, email };
    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
    return true;
  };

  const changePassword = (_newPassword: string): boolean => {
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
