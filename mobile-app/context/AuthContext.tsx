// mobile-app/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, authHelpers } from '../lib/supabase';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session / Obtenir la session initiale
    const getInitialSession = async () => {
      try {
        const currentSession = await authHelpers.getSession();
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // If user is logged in, ensure we have a custom JWT / Si l'utilisateur est connecté, s'assurer que nous avons un JWT personnalisé
        if (currentSession?.user) {
          await authApi.ensureValidToken();
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes / Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event, currentSession);
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // If user is logged in, ensure we have a custom JWT / Si l'utilisateur est connecté, s'assurer que nous avons un JWT personnalisé
        if (currentSession?.user) {
          await authApi.ensureValidToken();
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authHelpers.signIn(email, password);
      
      // After successful Supabase auth, the onAuthStateChange will handle token exchange
      // Après une authentification Supabase réussie, onAuthStateChange gérera l'échange de token
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      return await authHelpers.signUp(email, password);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await authApi.clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async (): Promise<Session | null> => {
    try {
      const currentSession = await authHelpers.getSession();
      return currentSession;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
