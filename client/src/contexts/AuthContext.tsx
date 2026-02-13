import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { 
  getCurrentUser, 
  setCurrentUser, 
  getUserByEmail, 
  addUser, 
  updateUser,
  generateId,
  initializeStorage,
  addActivityLog
} from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeStorage();
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const foundUser = getUserByEmail(email);
    
    if (!foundUser) {
      return { success: false, error: 'User not found' };
    }
    
    if (foundUser.password !== password) {
      return { success: false, error: 'Invalid password' };
    }
    
    if (!foundUser.isActive) {
      return { success: false, error: 'Account is deactivated' };
    }

    setUser(foundUser);
    setCurrentUser(foundUser);
    
    addActivityLog({
      id: generateId(),
      userId: foundUser.id,
      action: 'login',
      details: 'User logged in',
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  };

  const register = async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    const existingUser = getUserByEmail(data.email);
    
    if (existingUser) {
      return { success: false, error: 'Email already registered' };
    }

    const newUser: User = {
      id: generateId(),
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: data.role || 'applicant',
      joinedAt: new Date().toISOString(),
      isActive: true,
    };

    addUser(newUser);
    setUser(newUser);
    setCurrentUser(newUser);

    addActivityLog({
      id: generateId(),
      userId: newUser.id,
      action: 'register',
      details: 'New user registered',
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  };

  const logout = () => {
    if (user) {
      addActivityLog({
        id: generateId(),
        userId: user.id,
        action: 'logout',
        details: 'User logged out',
        timestamp: new Date().toISOString(),
      });
    }
    setUser(null);
    setCurrentUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      updateUser(user.id, updates);
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      setCurrentUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}