// backend/lib/auth.ts
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { query } from './db.js';
import { verifySupabaseToken } from './supabase.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables if not in production
// Charger les variables d'environnement si ce n'est pas en production
if (process.env.NODE_ENV !== 'production') {
  // Try to load from root .env or local .env
  dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  dotenv.config(); // Also try default .env
}

// Validate JWT_SECRET at module load / Valider JWT_SECRET au chargement du module
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable not configured / Variable d\'environnement JWT_SECRET non configurée');
}

/**
 * Verify and authenticate user from request using Supabase Auth + custom JWT
 * Vérifier et authentifier l'utilisateur depuis la requête en utilisant Supabase Auth + JWT personnalisé
 * 
 * This function:
 * 1. Verifies the custom JWT token format
 * 2. Extracts Supabase user ID from the token
 * 3. Validates the user with Supabase Auth
 * 4. Returns user information
 * 
 * Cette fonction:
 * 1. Vérifie le format du token JWT personnalisé
 * 2. Extrait l'ID utilisateur Supabase du token
 * 3. Valide l'utilisateur avec Supabase Auth
 * 4. Retourne les informations utilisateur
 * 
 * @param req - Express Request object
 * @returns User object from Supabase
 * @throws Error if authentication fails
 */
export const verifyUser = async (req: Request): Promise<any> => {
  // 1. Extract Authorization header / Extraire l'en-tête Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No valid Token provided / Aucun token valide fourni');
  }

  // 2. Extract token / Extraire le token
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new Error('Token not found / Token introuvable');
  }

  // 3. Verify custom JWT / Vérifier le JWT personnalisé
  let decoded: any;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new Error('Token is invalid or expired / Le token est invalide ou expiré');
  }

  // 4. Extract Supabase user ID from token / Extraire l'ID utilisateur Supabase du token
  const supabaseUserId = decoded.userId || decoded.sub || decoded.supabase_user_id;
  if (!supabaseUserId) {
    throw new Error('Invalid token: no Supabase user ID found / Token invalide : aucun ID utilisateur Supabase trouvé');
  }

  // 5. Verify user with Supabase Auth / Vérifier l'utilisateur avec Supabase Auth
  try {
    const supabaseUser = await verifySupabaseToken(token);
    
    // Return user information / Retourner les informations utilisateur
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      user_metadata: supabaseUser.user_metadata,
      // Include business_id if available in metadata
      business_id: supabaseUser.user_metadata?.business_id || null,
    };
  } catch (supabaseError) {
    if (supabaseError instanceof Error) {
      throw new Error('User verification failed: ' + supabaseError.message);
    } else {
      throw new Error('User verification failed: Unknown error / Erreur inconnue');
    }
  }
};

/**
 * Create a custom JWT token for a Supabase user
 * Créer un token JWT personnalisé pour un utilisateur Supabase
 * 
 * This function creates a custom JWT token that includes the Supabase user ID
 * Cette fonction crée un token JWT personnalisé qui inclut l'ID utilisateur Supabase
 * 
 * @param supabaseUserId - Supabase User ID
 * @param businessId - Business ID (optional)
 * @returns JWT token string
 */
export const createToken = (supabaseUserId: string, businessId?: string): string => {
  const payload: any = {
    userId: supabaseUserId,
    sub: supabaseUserId,
    supabase_user_id: supabaseUserId,
  };
  
  // Add business_id to metadata if provided
  if (businessId) {
    payload.business_id = businessId;
  }
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' } as jwt.SignOptions);
};

/**
 * Authentication middleware for Express (for traditional Express routes if needed)
 * Middleware d'authentification pour Express (pour les routes Express traditionnelles si nécessaire)
 * 
 * Note: This is for compatibility with Express middleware pattern
 * Note: Ceci est pour la compatibilité avec le pattern middleware Express
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await verifyUser(req);
    req.user = user; // Attach to req object for subsequent routes / Attacher à l'objet req pour les routes suivantes
    next();
  } catch (err: any) {
    return res.status(401).json({ error: err.message || 'Authentication failed / Échec de l\'authentification' });
  }
};

// Extend Express Request type (supports req.user) / Étendre le type Express Request (supporte req.user)
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        user_metadata: any;
        business_id?: string;
      };
    }
  }
}
