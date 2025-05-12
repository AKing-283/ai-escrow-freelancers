'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWeb3 } from './Web3Context';

type UserRole = 'client' | 'freelancer' | null;

interface UserRoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isLoading: boolean;
}

const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined);

export const UserRoleProvider = ({ children }: { children: React.ReactNode }) => {
  const { account } = useWeb3();
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved role from localStorage when account changes
  useEffect(() => {
    if (account) {
      const savedRole = localStorage.getItem(`userRole_${account}`);
      setRole(savedRole as UserRole);
    } else {
      setRole(null);
    }
    setIsLoading(false);
  }, [account]);

  // Save role to localStorage when it changes
  const handleSetRole = (newRole: UserRole) => {
    if (account) {
      localStorage.setItem(`userRole_${account}`, newRole || '');
    }
    setRole(newRole);
  };

  return (
    <UserRoleContext.Provider
      value={{
        role,
        setRole: handleSetRole,
        isLoading,
      }}
    >
      {children}
    </UserRoleContext.Provider>
  );
};

export function useUserRole() {
  const context = useContext(UserRoleContext);
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
} 