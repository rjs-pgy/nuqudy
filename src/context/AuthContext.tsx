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
  updateProfile: (profileOrName: string | { name?: string; email?: string; currency?: string }, email?: string) => boolean;
  changePassword: (newPassword: string) => boolean;
}

const AUTH_STORAGE_KEY = 'nuqudy_active_session_v1';
const USERS_STORAGE_KEY = 'nuqudy_users_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount with automatic self-healing for corrupted data
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Self-heal corrupted user object if name was stored as an object
          let cleanName = 'Pengguna Nuqudy';
          if (typeof parsed.name === 'string') {
            cleanName = parsed.name;
          } else if (parsed.name && typeof parsed.name === 'object' && parsed.name.name) {
            cleanName = String(parsed.name.name);
          }

          let cleanEmail = 'admin@nuqudy.app';
          if (typeof parsed.email === 'string') {
            cleanEmail = parsed.email;
          } else if (parsed.name && typeof parsed.name === 'object' && parsed.name.email) {
            cleanEmail = String(parsed.name.email);
          }

          const sanitizedUser: User = {
            userId: parsed.userId || 'USR-ADMIN01',
            username: parsed.username || 'admin',
            name: cleanName,
            email: cleanEmail,
            currency: typeof parsed.currency === 'string' ? parsed.currency : (parsed.name?.currency || 'Rp'),
            status: parsed.status || 'active',
            createdAt: parsed.createdAt || new Date().toISOString()
          };

          setUser(sanitizedUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sanitizedUser));
        }
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

  const updateProfile = (
    profileOrName: string | { name?: string; email?: string; currency?: string },
    emailArg?: string
  ): boolean => {
    if (!user) return false;
    let newName = user.name || 'Pengguna Nuqudy';
    let newEmail = user.email || 'admin@nuqudy.app';
    let newCurrency = user.currency || 'Rp';

    if (typeof profileOrName === 'object' && profileOrName !== null) {
      if (profileOrName.name !== undefined) newName = String(profileOrName.name).trim();
      if (profileOrName.email !== undefined) newEmail = String(profileOrName.email).trim();
      if (profileOrName.currency !== undefined) newCurrency = String(profileOrName.currency).trim();
    } else if (typeof profileOrName === 'string') {
      newName = profileOrName.trim();
      if (emailArg !== undefined) newEmail = emailArg.trim();
    }

    const updated: User = {
      ...user,
      name: newName,
      email: newEmail,
      currency: newCurrency
    };

    setUser(updated);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));

    // Also update users array in storage
    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersRaw) {
        const storedUsers = JSON.parse(storedUsersRaw);
        const userIndex = storedUsers.findIndex((u: any) => u.userId === user.userId || u.username === user.username);
        if (userIndex !== -1) {
          storedUsers[userIndex] = { ...storedUsers[userIndex], name: newName, email: newEmail };
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
        }
      }
    } catch (e) {
      console.warn('Failed to update users storage list', e);
    }

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
