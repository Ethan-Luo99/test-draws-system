// backend/api/v1/draws/[id]/participants-with-users.ts
import type { Request, Response } from 'express';
import { query } from '../../../../lib/db.js';
import { getSupabaseUser } from '../../../../lib/supabase.js';

/**
 * Get draw participants with full user information
 * Obtenir les participants du tirage avec les informations utilisateur complètes
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        error: 'Invalid draw ID / ID de tirage invalide' 
      });
    }

    // Get all participants / Obtenir tous les participants
    const participantsResult = await query(
      'SELECT * FROM draw_participants WHERE draw_id = $1 ORDER BY participated_at DESC',
      [id]
    );

    // Enrich each participant with user information from Supabase / Enrichir chaque participant avec les informations utilisateur depuis Supabase
    const enrichedParticipants = [];
    
    for (const participant of participantsResult.rows) {
      try {
        const user = await getSupabaseUser(participant.user_id);
        enrichedParticipants.push({
          ...participant,
          user: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || null,
            user_metadata: user.user_metadata || {}
          }
        });
      } catch (error) {
        console.error(`Failed to fetch user ${participant.user_id}:`, error);
        // Still include participant but mark as having no user info
        enrichedParticipants.push({
          ...participant,
          user: null,
          user_error: 'Failed to fetch user information / Échec de la récupération des informations utilisateur'
        });
      }
    }

    return res.status(200).json({
      participants: enrichedParticipants,
      total: enrichedParticipants.length
    });

  } catch (err: any) {
    console.error('Error fetching participants with users:', err);
    return res.status(500).json({ 
      error: 'Failed to fetch participants / Échec de la récupération des participants',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
