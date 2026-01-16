// backend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables if not in production
// Charger les variables d'environnement si ce n'est pas en production
if (process.env.NODE_ENV !== 'production') {
  // Try to load from root .env or local .env
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config(); // Also try default .env
}

// Supabase configuration / Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase configuration missing / Configuration Supabase manquante');
}

// Create Supabase client with service role key for server-side operations
// Créer le client Supabase avec la clé de rôle de service pour les opérations côté serveur
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to get user from Supabase Auth / Fonction helper pour obtenir l'utilisateur depuis Supabase Auth
export const getSupabaseUser = async (userId: string) => {
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      throw new Error(`Supabase user fetch error: ${error.message}`);
    }
    
    if (!user || !user.user) {
      throw new Error('User not found in Supabase / Utilisateur introuvable dans Supabase');
    }
    
    return {
      id: user.user.id,
      email: user.user.email,
      user_metadata: user.user.user_metadata || {},
    };
  } catch (error) {
    console.error('Error fetching Supabase user:', error);
    throw new Error('Failed to fetch user from Supabase / Échec de la récupération de l\'utilisateur depuis Supabase');
  }
};

// Helper function to verify Supabase JWT token / Fonction helper pour vérifier le token JWT Supabase
export const verifySupabaseToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      throw new Error(`Invalid Supabase token: ${error.message}`);
    }
    
    if (!user) {
      throw new Error('No user found in token / Aucun utilisateur trouvé dans le token');
    }
    
    return {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata || {},
    };
  } catch (error) {
    console.error('Error verifying Supabase token:', error);
    throw new Error('Invalid Supabase token / Token Supabase invalide');
  }
};
