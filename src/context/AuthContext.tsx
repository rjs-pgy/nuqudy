/**
 * Auth Context and Provider for NUQUDY
 * Manages user login state, session persistence, multi-user accounts, credentials,
 * and automatic synchronization with Google Spreadsheet backend (Users sheet).
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiResponse } from '../types';
import { storageService, DEFAULT_DEMO_USER, STORAGE_KEYS } from '../services/storageService';

interface ChangePasswordResult {
  success: boolean;
  message: string;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<ApiResponse<User>>;
  logout: () => void;
  updateProfile: (profileOrName: string | { name?: string; email?: string; currency?: string; username?: string }, email?: string) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<ChangePasswordResult>;
  addUser: (user: { username: string; name: string; email?: string; password?: string; role?: 'admin' | 'member' }) => Promise<ApiResponse<User>>;
  deleteUser: (userId: string) => Promise<ApiResponse>;
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load and refresh user list from storageService
  const refreshUsers = () => {
    try {
      const allUsers = storageService.getUsers();
      setUsers(allUsers);
    } catch (e) {
      console.warn('Failed to load users', e);
    }
  };

  // Restore session on mount with self-healing
  useEffect(() => {
    try {
      storageService.initDatabase();
      const allUsers = storageService.getUsers();
      setUsers(allUsers);

      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          // Cross-reference with database to ensure up-to-date name, username, email
          const dbUser = allUsers.find(u => u.userId === parsed.userId || u.username.toLowerCase() === (parsed.username || '').toLowerCase());
          
          const sanitizedUser: User = {
            userId: dbUser?.userId || parsed.userId || 'USR-ADMIN01',
            username: dbUser?.username || parsed.username || 'admin',
            name: dbUser?.name || parsed.name || 'Pengguna Nuqudy',
            email: dbUser?.email !== undefined ? dbUser.email : (parsed.email || ''),
            currency: dbUser?.currency || parsed.currency || 'Rp',
            role: dbUser?.role || parsed.role || 'admin',
            status: dbUser?.status || parsed.status || 'active',
            createdAt: dbUser?.createdAt || parsed.createdAt || new Date().toISOString()
          };

          setUser(sanitizedUser);
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sanitizedUser));
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
    await new Promise(resolve => setTimeout(resolve, 300));

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setIsLoading(false);
      return { success: false, message: 'Username dan password wajib diisi!' };
    }

    // 1. Check strictly in stored users list
    const storedUsers = storageService.getUsers();
    let found = storedUsers.find(
      u => u.username.toLowerCase() === cleanUsername && u.password === cleanPassword
    );

    // 2. If not found locally, try Google Apps Script live login if configured
    const settings = storageService.getSettings();
    if (!found && settings.gasWebAppUrl) {
      try {
        const gasRes = await fetch(settings.gasWebAppUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'LOGIN', username: cleanUsername, password: cleanPassword })
        });
        const gasJson = await gasRes.json();
        if (gasJson && gasJson.success && gasJson.data) {
          const remoteUser: User = {
            userId: gasJson.data.userId || 'USR-' + Date.now(),
            username: gasJson.data.username || cleanUsername,
            password: cleanPassword,
            name: gasJson.data.name || cleanUsername,
            email: gasJson.data.email || '',
            currency: gasJson.data.currency || 'Rp',
            role: gasJson.data.role || 'admin',
            status: 'active',
            createdAt: gasJson.data.createdAt || new Date().toISOString()
          };
          // Save locally
          storageService.addUser(remoteUser);
          refreshUsers();
          found = remoteUser;
        }
      } catch (err) {
        console.warn('Google Sheets live auth check error:', err);
      }
    }

    if (!found) {
      setIsLoading(false);
      return {
        success: false,
        message: 'Username atau password salah! Pastikan username dan kata sandi yang Anda masukkan sesuai.'
      };
    }

    if (found.status === 'inactive') {
      setIsLoading(false);
      return { success: false, message: 'Akun Anda sedang dinonaktifkan.' };
    }

    const sessionUser: User = {
      userId: found.userId,
      username: found.username,
      name: found.name,
      email: found.email,
      currency: found.currency || 'Rp',
      role: found.role || 'admin',
      status: found.status,
      createdAt: found.createdAt
    };

    setUser(sessionUser);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));

    // Immediately pull latest database bundle from Google Sheets so new device receives all transactions & data
    if (settings.gasWebAppUrl) {
      try {
        await storageService.fetchGasData();
      } catch (e) {
        console.warn('Initial login GAS sync error:', e);
      }
    }

    setIsLoading(false);

    return {
      success: true,
      message: `Selamat datang kembali, ${sessionUser.name}!`,
      data: sessionUser
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  };

  const updateProfile = async (
    profileOrName: string | { name?: string; email?: string; currency?: string; username?: string },
    emailArg?: string
  ): Promise<boolean> => {
    if (!user) return false;
    let newName = user.name || 'Pengguna Nuqudy';
    let newEmail = user.email || 'admin@nuqudy.app';
    let newCurrency = user.currency || 'Rp';
    let newUsername = user.username || 'admin';

    if (typeof profileOrName === 'object' && profileOrName !== null) {
      if (profileOrName.name !== undefined) newName = String(profileOrName.name).trim();
      if (profileOrName.email !== undefined) newEmail = String(profileOrName.email).trim();
      if (profileOrName.currency !== undefined) newCurrency = String(profileOrName.currency).trim();
      if (profileOrName.username !== undefined) newUsername = String(profileOrName.username).trim().toLowerCase();
    } else if (typeof profileOrName === 'string') {
      newName = profileOrName.trim();
      if (emailArg !== undefined) newEmail = emailArg.trim();
    }

    const updated: User = {
      ...user,
      username: newUsername,
      name: newName,
      email: newEmail,
      currency: newCurrency
    };

    setUser(updated);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));

    // Update in local users storage list
    storageService.updateUser(user.userId, {
      name: newName,
      email: newEmail,
      currency: newCurrency,
      username: newUsername
    });
    refreshUsers();

    // Also update Google Spreadsheet Users sheet in real-time
    const settings = storageService.getSettings();
    if (settings.gasWebAppUrl) {
      storageService.updateUserGas({
        userId: user.userId,
        username: user.username,
        newUsername: newUsername,
        name: newName,
        email: newEmail,
        currency: newCurrency
      } as any).catch(e => console.warn('GAS profile sync error', e));
    }

    return true;
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    if (!user) return { success: false, message: 'Tidak ada sesi login aktif.' };

    const cleanOld = oldPassword.trim();
    const cleanNew = newPassword.trim();

    if (!cleanNew) {
      return { success: false, message: 'Kata sandi baru tidak boleh kosong!' };
    }

    if (cleanNew.length < 4) {
      return { success: false, message: 'Kata sandi baru minimal 4 karakter!' };
    }

    // Verify old password against stored user list
    const storedUsers = storageService.getUsers();
    const currentUserInStore = storedUsers.find(
      u => u.userId === user.userId || u.username.toLowerCase() === user.username.toLowerCase()
    );

    const currentSavedPass = currentUserInStore?.password || 'admin123';

    if (cleanOld !== currentSavedPass) {
      return { success: false, message: 'Kata sandi lama yang Anda masukkan salah.' };
    }

    // Update locally in storage
    storageService.updateUser(user.userId, {
      password: cleanNew,
      updatedAt: new Date().toISOString()
    });
    refreshUsers();

    // Push to Google Spreadsheet Users sheet in real-time
    const settings = storageService.getSettings();
    if (settings.gasWebAppUrl) {
      try {
        const res = await storageService.changePasswordGas({
          userId: user.userId,
          username: user.username,
          oldPassword: cleanOld,
          newPassword: cleanNew
        });
        if (res && res.success) {
          return {
            success: true,
            message: 'Kata sandi berhasil diperbarui di database Google Spreadsheet dan penyimpanan lokal!'
          };
        }
      } catch (e: any) {
        console.warn('GAS change password error', e);
      }
    }

    return {
      success: true,
      message: 'Kata sandi berhasil diperbarui! Silakan gunakan kata sandi baru untuk login berikutnya.'
    };
  };

  const addUser = async (newUser: { username: string; name: string; email?: string; password?: string; role?: 'admin' | 'member' }): Promise<ApiResponse<User>> => {
    const cleanUsername = newUser.username.trim().toLowerCase();
    if (!cleanUsername) {
      return { success: false, message: 'Username tidak boleh kosong.' };
    }

    const existingUsers = storageService.getUsers();
    if (existingUsers.some(u => u.username.toLowerCase() === cleanUsername)) {
      return { success: false, message: `Username "${cleanUsername}" sudah digunakan.` };
    }

    const created = storageService.addUser({
      username: cleanUsername,
      name: newUser.name.trim() || cleanUsername,
      email: newUser.email?.trim() || `${cleanUsername}@nuqudy.app`,
      password: newUser.password?.trim() || 'admin123',
      role: newUser.role || 'member',
      status: 'active'
    });

    refreshUsers();

    // Sync to Google Spreadsheet
    const settings = storageService.getSettings();
    if (settings.gasWebAppUrl) {
      storageService.addUserGas(created).catch(e => console.warn('GAS add user error', e));
    }

    return {
      success: true,
      message: `Akun "${cleanUsername}" berhasil ditambahkan ke database!`,
      data: created
    };
  };

  const deleteUser = async (userId: string): Promise<ApiResponse> => {
    if (user?.userId === userId) {
      return { success: false, message: 'Anda tidak dapat menghapus akun yang sedang aktif digunakan!' };
    }

    const success = storageService.deleteUser(userId);
    if (!success) {
      return { success: false, message: 'Akun pengguna tidak ditemukan.' };
    }

    refreshUsers();

    // Sync to Google Spreadsheet
    const settings = storageService.getSettings();
    if (settings.gasWebAppUrl) {
      storageService.deleteUserGas(userId).catch(e => console.warn('GAS delete user error', e));
    }

    return { success: true, message: 'Akun pengguna berhasil dihapus dari database.' };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        users,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateProfile,
        changePassword,
        addUser,
        deleteUser,
        refreshUsers
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
