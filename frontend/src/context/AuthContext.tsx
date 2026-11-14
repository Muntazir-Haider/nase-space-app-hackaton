import React, { createContext, useContext, useState, useEffect } from 'react';
import { OperatorProfile, OperatorRoleOut } from '../types';
import { loginOperator, fetchOperatorRoles } from '../services/api';

interface AuthContextType {
  operator: OperatorProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableRoles: OperatorRoleOut[];
  login: (callsign: string, pin: string, role?: string) => Promise<void>;
  quickLogin: (roleKey: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const STORAGE_OPERATOR_KEY = 'mission_sentinel_operator';
const STORAGE_TOKEN_KEY = 'mission_sentinel_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [availableRoles, setAvailableRoles] = useState<OperatorRoleOut[]>([]);

  useEffect(() => {
    // 1. Load available roles
    fetchOperatorRoles()
      .then((roles) => setAvailableRoles(roles))
      .catch((err) => console.warn('Could not load station roles:', err));

    // 2. Restore saved session from offline storage
    try {
      const savedOp = localStorage.getItem(STORAGE_OPERATOR_KEY);
      const savedTok = localStorage.getItem(STORAGE_TOKEN_KEY);
      if (savedOp && savedTok) {
        setOperator(JSON.parse(savedOp));
        setToken(savedTok);
      }
    } catch (e) {
      console.error('Failed to parse cached operator session', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (callsign: string, pin: string, role?: string) => {
    const res = await loginOperator({ callsign, pin, role });
    setOperator(res.operator);
    setToken(res.token);
    try {
      localStorage.setItem(STORAGE_OPERATOR_KEY, JSON.stringify(res.operator));
      localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
    } catch (e) {
      console.warn('Storage unavailable', e);
    }
  };

  const quickLogin = async (roleKey: string) => {
    const roleMeta = availableRoles.find((r) => r.role_key === roleKey);
    const callsign = roleMeta ? roleMeta.default_callsign : 'ARTEMIS-CMO';
    const pin = roleMeta ? roleMeta.default_pin : '2026';
    await login(callsign, pin, roleKey);
  };

  const logout = () => {
    setOperator(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_OPERATOR_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
    } catch (e) {
      console.warn('Storage cleanup failed', e);
    }
  };

  const hasPermission = (permission: string) => {
    if (!operator) return false;
    return operator.permissions.includes('view_all') || operator.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider
      value={{
        operator,
        token,
        isAuthenticated: !!operator,
        isLoading,
        availableRoles,
        login,
        quickLogin,
        logout,
        hasPermission,
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
