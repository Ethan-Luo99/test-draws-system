// backend/api/v1/draws/[id].ts
import type { Request, Response } from 'express';
import { query } from '../../../lib/db.js';
import { verifyUser } from '../../../lib/auth.js';
import { getSupabaseUser } from '../../../lib/supabase.js';

import { checkAndCompleteDraw } from '../../../lib/draw-service.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Extract draw ID from URL / Extraire l'ID du tirage depuis l'URL
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid draw ID / ID de tirage invalide' });
    }

    // Check if draw needs to be completed (lazy check)
    // Vérifier si le tirage doit être terminé (vérification paresseuse)
    if (req.method === 'GET') {
      await checkAndCompleteDraw(id);
    }

    // GET: Get draw details / Obtenir les détails du tirage
    if (req.method === 'GET') {
      const result = await query(
        'SELECT * FROM draws WHERE id = $1 AND is_active = true',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Draw not found / Tirage introuvable' });
      }

      // Get participant count / Obtenir le nombre de participants
      const countResult = await query(
        'SELECT COUNT(*) as participant_count FROM draw_participants WHERE draw_id = $1',
        [id]
      );

      const draw = result.rows[0];
      
      // Enrich with participant count / Enrichir avec le nombre de participants
      draw.participant_count = parseInt(countResult.rows[0].participant_count);
      
      // If there's a winner, fetch winner information from Supabase / S'il y a un gagnant, récupérer les informations du gagnant depuis Supabase
      if (draw.winner_user_id) {
        try {
          const winnerUser = await getSupabaseUser(draw.winner_user_id);
          draw.winner = {
            id: winnerUser.id,
            email: winnerUser.email,
            name: winnerUser.user_metadata?.name || null,
            user_metadata: winnerUser.user_metadata || {}
          };
        } catch (error) {
          console.error('Failed to fetch winner information:', error);
          // Don't fail the entire request if winner info can't be fetched
          draw.winner_error = 'Failed to fetch winner information / Échec de la récupération des informations du gagnant';
        }
      }

      return res.status(200).json(draw);
    }

    // Authentication required for PUT, DELETE, and CANCEL (POST) / Authentification requise pour PUT, DELETE et CANCEL
    const user = await verifyUser(req);

    // POST: Cancel draw (using POST for semantic action) / Annuler le tirage
    if (req.method === 'POST' && req.url.includes('/cancel')) {
      const drawResult = await query(
        'SELECT * FROM draws WHERE id = $1 AND is_active = true',
        [id]
      );

      if (drawResult.rows.length === 0) {
        return res.status(404).json({ error: 'Draw not found' });
      }

      const draw = drawResult.rows[0];

      // Check participants
      const participantResult = await query(
        'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
        [id]
      );
      const hasParticipants = parseInt(participantResult.rows[0].count) > 0;

      if (hasParticipants) {
        return res.status(403).json({ 
          error: 'Cannot cancel draw with existing participants' 
        });
      }

      // Cancel logic: set status to 'closed' (or 'cancelled' if enum allows, but 'closed' fits schema)
      // Logique d'annulation : définir le statut sur 'closed'
      const updateResult = await query(
        `UPDATE draws 
         SET status = 'closed', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      return res.status(200).json({
        message: 'Draw cancelled successfully',
        draw: updateResult.rows[0]
      });
    }

    // PUT: Update draw / Mettre à jour le tirage
    if (req.method === 'PUT') {
      const { title, description, type, draw_date, winning_probability, status } = req.body;

      // Check if draw exists and belongs to user's business / Vérifier si le tirage existe et appartient à l'entreprise de l'utilisateur
      const drawResult = await query(
        'SELECT * FROM draws WHERE id = $1 AND is_active = true',
        [id]
      );

      if (drawResult.rows.length === 0) {
        return res.status(404).json({ error: 'Draw not found / Tirage introuvable' });
      }

      const draw = drawResult.rows[0];

      // Check if draw has participants / Vérifier si le tirage a des participants
      const participantResult = await query(
        'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
        [id]
      );

      const hasParticipants = parseInt(participantResult.rows[0].count) > 0;

      // Cannot modify draw with participants / Impossible de modifier un tirage avec des participants
      if (hasParticipants) {
        return res.status(403).json({ 
          error: 'Cannot modify draw with participants / Impossible de modifier un tirage avec des participants' 
        });
      }

      // Validate required fields / Valider les champs requis
      if (!title || !type) {
        return res.status(400).json({ 
          error: 'Title and type are required / Le titre et le type sont requis' 
        });
      }

      // Validate type-specific fields / Valider les champs spécifiques au type
      if (type === 'fixed_date' && !draw_date) {
        return res.status(400).json({ 
          error: 'draw_date is required for fixed_date type / draw_date est requis pour le type fixed_date' 
        });
      }

      // Update draw / Mettre à jour le tirage
      const updateResult = await query(
        `UPDATE draws 
         SET title = $1, description = $2, type = $3, draw_date = $4, 
             winning_probability = $5, status = $6, updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [title, description, type, draw_date, winning_probability || draw.winning_probability, status || draw.status, id]
      );

      return res.status(200).json(updateResult.rows[0]);
    }

    // DELETE: Delete draw / Supprimer le tirage
    if (req.method === 'DELETE') {
      // Check if draw exists / Vérifier si le tirage existe
      const drawResult = await query(
        'SELECT * FROM draws WHERE id = $1 AND is_active = true',
        [id]
      );

      if (drawResult.rows.length === 0) {
        return res.status(404).json({ error: 'Draw not found / Tirage introuvable' });
      }

      // Check if draw has participants / Vérifier si le tirage a des participants
      const participantResult = await query(
        'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
        [id]
      );

      const hasParticipants = parseInt(participantResult.rows[0].count) > 0;

      // Cannot delete draw with participants / Impossible de supprimer un tirage avec des participants
      if (hasParticipants) {
        return res.status(403).json({ 
          error: 'Cannot delete draw with participants / Impossible de supprimer un tirage avec des participants' 
        });
      }

      // Soft delete (set is_active to false) / Suppression douce (définir is_active à false)
      await query(
        'UPDATE draws SET is_active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );

      return res.status(204).send();
    }

    // Method not allowed / Méthode non autorisée
    return res.status(405).json({ error: 'Method not allowed / Méthode non autorisée' });

  } catch (err: any) {
    console.error('Error in /api/v1/draws/[id]:', err);
    
    if (err.message.includes('Token') || err.message.includes('token')) {
      return res.status(401).json({ error: err.message });
    }
    
    if (err.message.includes('User not found') || err.message.includes('Utilisateur introuvable')) {
      return res.status(401).json({ error: err.message });
    }

    return res.status(500).json({ 
      error: 'Internal server error / Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
