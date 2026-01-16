// backend/api/v1/draws/[id]/close.ts
import type { Request, Response } from 'express';
import { query } from '../../../../lib/db.js';
import { verifyUser } from '../../../../lib/auth.js';

/**
 * Close a draw (end participation period)
 * Fermer un tirage (fin de la période de participation)
 * 
 * This changes the draw status from 'active' to 'closed'
 * After closing, no new participants can join
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
    if (draw.status !== 'active') {
      return res.status(400).json({ 
        error: `Cannot close draw with status '${draw.status}'. Only 'active' draws can be closed. / Impossible de fermer un tirage avec le statut '${draw.status}'. Seul les tirages 'actifs' peuvent être fermés.`,
        currentStatus: draw.status
      });
    }

    // Close the draw / Fermer le tirage
    await query(
      'UPDATE draws SET status = $1, updated_at = NOW() WHERE id = $2',
      ['closed', id]
    );

    // Get final participant count / Obtenir le nombre final de participants
    const countResult = await query(
      'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Draw closed successfully / Tirage fermé avec succès',
      draw_id: id,
      status: 'closed',
      participant_count: parseInt(countResult.rows[0].count)
    });

  } catch (err: any) {
    console.error('Error closing draw:', err);
    
    if (err.message.includes('Token') || err.message.includes('token')) {
      return res.status(401).json({ error: err.message });
    }

    return res.status(500).json({ 
      error: 'Failed to close draw / Échec de la fermeture du tirage',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
