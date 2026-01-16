// backend/api/v1/auth/exchange.ts
import type { Request, Response } from 'express';
import { verifySupabaseToken } from '../../../lib/supabase.js';
import { createToken } from '../../../lib/auth.js';
import { DEMO_BUSINESS_ID } from '../../../lib/constants.js';
/**
 * Exchange Supabase token for custom JWT
 * Échanger le token Supabase pour un JWT personnalisé
 * 
 * This endpoint:
 * 1. Receives Supabase access token
 * 2. Validates it with Supabase
 * 3. Returns custom JWT token for our API
 * 
 * Ce point de terminaison:
 * 1. Reçoit le token d'accès Supabase
 * 2. Le valide avec Supabase
 * 3. Retourne le token JWT personnalisé pour notre API
 */
export default async function handler(req: Request, res: Response) {
  try {
    // Check HTTP method / Vérifier la méthode HTTP
    if (req.method !== 'POST') {
      return res.status(405).json({ 
        error: 'Method not allowed / Méthode non autorisée' 
      });
    }

    // Extract Supabase token from request body / Extraire le token Supabase du corps de la requête
    const { supabase_token } = req.body;

    if (!supabase_token) {
      return res.status(400).json({ 
        error: 'Supabase token is required / Le token Supabase est requis' 
      });
    }

    // Verify Supabase token and get user info / Vérifier le token Supabase et obtenir les informations utilisateur
    const supabaseUser = await verifySupabaseToken(supabase_token);

    // Create custom JWT token for our API / Créer un token JWT personnalisé pour notre API
    const customToken = createToken(supabaseUser.id);

    // Return success response / Retourner une réponse de succès
    return res.status(200).json({
      success: true,
      custom_token: customToken,
      user: {
        id: supabaseUser.id,
        email: supabaseUser.email,
        user_metadata: supabaseUser.user_metadata,
      },
      // Include default business info for frontend convenience
      // Inclure les infos du commerce par défaut pour la commodité du frontend
      default_business: {
        id: DEMO_BUSINESS_ID,
        name: "Le Gourmet Demo",
        description: "A fantastic culinary experience awaiting you. Join our exclusive draws!",
        logo_url: "https://placehold.co/200x200?text=Le+Gourmet"
      },
      message: 'Token exchange successful / Échange de token réussi'
    });

  } catch (error: any) {
    console.error('Token exchange error:', error);

    // Handle different types of errors / Gérer différents types d'erreurs
    if (error.message.includes('Invalid Supabase token') || 
        error.message.includes('No user found')) {
      return res.status(401).json({
        error: 'Invalid Supabase token / Token Supabase invalide',
        details: error.message
      });
    }

    return res.status(500).json({
      error: 'Token exchange failed / Échec de l\'échange de token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
