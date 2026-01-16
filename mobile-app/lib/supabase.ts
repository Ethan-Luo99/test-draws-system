// mobile-app/lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// Supabase configuration / Configuration Supabase
const supabaseUrl = 'https://qysnwpgtomamnraslpmb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5c253cGd0b21hbW5yYXNscG1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNTkzOTEsImV4cCI6MjA4MzczNTM5MX0.KvZ8sBHKwJfN6rY7tI7dM2r9xG8p5sJ3k2mN4b7cO1A';

// Create Supabase client with React Native storage
// Créer le client Supabase avec stockage React Native
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Auth helper functions / Fonctions d'aide pour l'authentification
export const authHelpers = {
  // Sign up with email and password / S'inscrire avec email et mot de passe
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Sign in with email and password / Se connecter avec email et mot de passe
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  },

  // Sign out / Se déconnecter
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }
  },

  // Get current session / Obtenir la session actuelle
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return session;
  },

  // Get current user / Obtenir l'utilisateur actuel
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new Error(error.message);
    }
    
    return user;
  },

  // Listen to auth state changes / Écouter les changements d'état d'authentification
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
};
