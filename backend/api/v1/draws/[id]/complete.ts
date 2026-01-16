// backend/api/v1/draws/[id]/complete.ts
import type { Request, Response } from 'express';
import { query } from '../../../../lib/db.js';
import { verifyUser } from '../../../../lib/auth.js';
import { getSupabaseUser } from '../../../../lib/supabase.js';

/**
 * Complete a draw and randomly select a winner
 * Terminer un tirage et sélectionner aléatoirement un gagnant
 * 
 * This changes the draw status from 'closed' to 'completed'
 * And randomly selects a winner from all participants
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid draw ID / ID de tirage invalide' });
    }

    // Verify user authentication / Vérifier l'authentification de l'utilisateur
    await verifyUser(req);

    // Check if draw exists / Vérifier si le tirage existe
    const drawResult = await query(
      'SELECT * FROM draws WHERE id = $1 AND is_active = true',
      [id]
    );

    if (drawResult.rows.length === 0) {
      return res.status(404).json({ error: 'Draw not found / Tirage introuvable' });
    }

    const draw = drawResult.rows[0];

    // Validate draw status / Valider le statut du tirage
    if (draw.status !== 'closed') {
      return res.status(400).json({ 
        error: `Cannot complete draw with status '${draw.status}'. Only 'closed' draws can be completed. / Impossible de terminer un tirage avec le statut '${draw.status}'. Seul les tirages 'fermés' peuvent être terminés.`,
        currentStatus: draw.status
      });
    }

    // Get all participants / Obtenir tous les participants
    const participantsResult = await query(
      'SELECT user_id FROM draw_participants WHERE draw_id = $1 ORDER BY RANDOM()',
      [id]
    );

    if (participantsResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No participants in this draw / Aucun participant dans ce tirage'
      });
    }

    // If only one participant, they are automatically the winner
    // Si un seul participant, il est automatiquement le gagnant
    let winnerUserId: string;
    const isAutomaticWinner = participantsResult.rows.length === 1;
    
    if (isAutomaticWinner) {
      // Only one participant - automatic win
      winnerUserId = participantsResult.rows[0].user_id;
    } else {
      // Multiple participants - random selection
      const randomIndex = Math.floor(Math.random() * participantsResult.rows.length);
      winnerUserId = participantsResult.rows[randomIndex].user_id;
    }

    // Update draw with winner / Mettre à jour le tirage avec le gagnant
    await query(
      'UPDATE draws SET winner_user_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [winnerUserId, 'completed', id]
    );

    // Mark the participant as winner / Marquer le participant comme gagnant
    await query(
      'UPDATE draw_participants SET is_winner = true WHERE draw_id = $1 AND user_id = $2',
      [id, winnerUserId]
    );

    // Get winner information from Supabase / Obtenir les informations du gagnant depuis Supabase
    let winnerInfo = null;
    try {
      const winnerUser = await getSupabaseUser(winnerUserId);
      winnerInfo = {
        id: winnerUser.id,
        email: winnerUser.email,
        name: winnerUser.user_metadata?.name || null,
        user_metadata: winnerUser.user_metadata || {}
      };
    } catch (error) {
      console.error('Failed to fetch winner info:', error);
    }

    return res.status(200).json({
      success: true,
      message: isAutomaticWinner 
        ? 'Draw completed - Only one participant / Tirage terminé - Un seul participant'
        : 'Draw completed successfully / Tirage terminé avec succès',
      draw_id: id,
      status: 'completed',
      winner: winnerInfo,
      total_participants: participantsResult.rows.length,
      is_automatic_winner: isAutomaticWinner
    });

  } catch (err: any) {
    console.error('Error completing draw:', err);
    
    if (err.message.includes('Token') || err.message.includes('token')) {
      return res.status(401).json({ error: err.message });
    }

    return res.status(500).json({ 
      error: 'Failed to complete draw / Échec de la terminaison du tirage',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
