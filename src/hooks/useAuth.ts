'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication status on component mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/session');
      const data = await response.json();

      if (data.authenticated && data.user) {
        setUser(data.user);
        setAccounts(data.accounts || []);
      } else {
        setUser(null);
        setAccounts([]);
      }
    } catch (err) {
      console.error('Authentication check failed:', err);
      setError('فشل التحقق من حالة المصادقة');
      setUser(null);
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول');
      }

      await checkAuth();
      router.push('/dashboard');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username, email, password) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل إنشاء الحساب');
      }

      router.push('/auth/login');
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetch('/api/auth/logout');
      setUser(null);
      setAccounts([]);
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout failed:', err);
      setError('فشل تسجيل الخروج');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    accounts,
    loading,
    error,
    login,
    register,
    logout,
    checkAuth,
  };
}
