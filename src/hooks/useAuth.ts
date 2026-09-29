import { useState, useEffect } from 'react';
import { UserProfile } from '@/shared/types/ninja';
import {
  auth,
  signInWithGoogle as firebaseGoogleSignIn,
  firebaseSignOut,
} from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          const isAdmin =
            fbUser.email === 'prajwal9625@gmail.com' ||
            fbUser.email === 'admin@ninja.local';

          const mappedUser: UserProfile = {
            id: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
            photoURL: fbUser.photoURL || undefined,
            role: isAdmin ? 'admin' : 'user',
            createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          };

          setUser(mappedUser);
          setToken(idToken);
          localStorage.setItem('ninja_token', idToken);
          localStorage.setItem('ninja_user', JSON.stringify(mappedUser));
        } catch (e) {
          console.error('Error fetching Firebase auth token:', e);
        }
      } else {
        // Fallback to local storage if signed in via local backend credentials
        const savedToken = localStorage.getItem('ninja_token');
        const savedUser = localStorage.getItem('ninja_user');

        if (savedToken && savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            // Only keep if it was not a firebase session
            setUser(parsed);
            setToken(savedToken);
          } catch (e) {
            localStorage.removeItem('ninja_token');
            localStorage.removeItem('ninja_user');
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const fbUser = await firebaseGoogleSignIn();
      const idToken = await fbUser.getIdToken();
      const isAdmin =
        fbUser.email === 'prajwal9625@gmail.com' ||
        fbUser.email === 'admin@ninja.local';

      const mappedUser: UserProfile = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Google User',
        photoURL: fbUser.photoURL || undefined,
        role: isAdmin ? 'admin' : 'user',
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
      };

      setUser(mappedUser);
      setToken(idToken);
      localStorage.setItem('ninja_token', idToken);
      localStorage.setItem('ninja_user', JSON.stringify(mappedUser));
      return mappedUser;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to sign in');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('ninja_token', data.token);
    localStorage.setItem('ninja_user', JSON.stringify(data.user));
    return data.user;
  };

  const register = async (email: string, password: string, name?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create account');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('ninja_token', data.token);
    localStorage.setItem('ninja_user', JSON.stringify(data.user));
    return data.user;
  };

  const forgotPassword = async (email: string) => {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Password reset request failed');
    }
    return data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reset password');
    }
    return data;
  };

  const logout = async () => {
    try {
      if (auth.currentUser) {
        await firebaseSignOut();
      }
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // ignore
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem('ninja_token');
    localStorage.removeItem('ninja_user');
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    forgotPassword,
    resetPassword,
    loginWithGoogle,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
}
