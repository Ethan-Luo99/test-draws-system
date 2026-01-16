// backend/api/v1/draws/[id]/participants.ts
import type { Request, Response } from 'express';
import { query } from '../../../../lib/db.js';
import { verifyUser } from '../../../../lib/auth.js';
import { checkAndCompleteDraw } from '../../../../lib/draw-service.js';
import { DEMO_BUSINESS_ID } from '../../../../lib/constants.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Extract draw ID from URL / Extraire l'ID du tirage depuis l'URL
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid draw ID / ID de tirage invalide' });
    }

    // Verify draw exists / Vérifier que le tirage existe
    const drawResult = await query(
      'SELECT * FROM draws WHERE id = $1 AND is_active = true',
      [id]
    );

    if (drawResult.rows.length === 0) {
      return res.status(404).json({ error: 'Draw not found / Tirage introuvable' });
    }

    const draw = drawResult.rows[0];

    // Check if this is a demo request (for GET only)
    const businessIdHeader = req.headers['x-business-id'];
    const isDemoRequest = req.method === 'GET' && 
                          businessIdHeader === DEMO_BUSINESS_ID && 
                          draw.business_id === DEMO_BUSINESS_ID;

    // GET: Get participants list / Obtenir la liste des participants
    if (req.method === 'GET') {
      // Authentication required unless it's a demo draw
      // Authentification requise sauf si c'est un tirage démo
      if (!isDemoRequest) {
        await verifyUser(req);
      }

      // Pagination parameters / Paramètres de pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Get participants with pagination / Obtenir les participants avec pagination
      const participantsResult = await query(
        `SELECT dp.* 
         FROM draw_participants dp
         WHERE dp.draw_id = $1
         ORDER BY dp.participated_at DESC
         LIMIT $2 OFFSET $3`,
        [id, limit, offset]
      );

      // Get total count / Obtenir le nombre total
      const countResult = await query(
        'SELECT COUNT(*) as total FROM draw_participants WHERE draw_id = $1',
        [id]
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        participants: participantsResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      });
    }

    // POST: User participates in draw / L'utilisateur participe au tirage
    if (req.method === 'POST') {
      // Authentication required / Authentification requise
      const user = await verifyUser(req);

      // Check draw status / Vérifier le statut du tirage
      if (draw.status !== 'active') {
        return res.status(400).json({ 
          error: 'Draw is not active / Le tirage n\'est pas actif',
          currentStatus: draw.status
        });
      }

      // Check if draw date has passed (for fixed_date type) / Vérifier si la date du tirage est passée (pour le type fixed_date)
      if (draw.type === 'fixed_date' && draw.draw_date) {
        const drawDate = new Date(draw.draw_date);
        if (drawDate < new Date()) {
          return res.status(400).json({ 
            error: 'Draw date has passed / La date du tirage est passée' 
          });
        }
      }

      // Check if user already participated / Vérifier si l'utilisateur a déjà participé
      const existingParticipation = await query(
        'SELECT * FROM draw_participants WHERE draw_id = $1 AND user_id = $2',
        [id, user.id]
      );

      if (existingParticipation.rows.length > 0) {
        return res.status(409).json({ 
          error: 'User already participated / L\'utilisateur a déjà participé',
          participated_at: existingParticipation.rows[0].participated_at
        });
      }

      // Add participation / Ajouter la participation
      const participationResult = await query(
        `INSERT INTO draw_participants (draw_id, user_id)
         VALUES ($1, $2)
         RETURNING *`,
        [id, user.id]
      );

      // Check conditions and potentially trigger completion
      // Vérifier les conditions et déclencher potentiellement la complétion
      const completionResult = await checkAndCompleteDraw(id as string);
      
      let isWinner = false;
      if (completionResult && completionResult.status === 'completed' && completionResult.winner_user_id === user.id) {
        isWinner = true;
      }

      return res.status(201).json({
        participation: participationResult.rows[0],
        isWinner,
        completion: completionResult,
        message: isWinner 
          ? 'Congratulations! You won! / Félicitations ! Vous avez gagné !'
          : 'Participation recorded successfully / Participation enregistrée avec succès'
      });
    }

    // Method not allowed / Méthode non autorisée
    return res.status(405).json({ error: 'Method not allowed / Méthode non autorisée' });

  } catch (err: any) {
    console.error('Error in /api/v1/draws/[id]/participants:', err);
    
    if (err.message.includes('Token') || err.message.includes('token')) {
      return res.status(401).json({ error: err.message });
    }
    
    if (err.message.includes('User not found') || err.message.includes('Utilisateur introuvable')) {
      return res.status(401).json({ error: err.message });
    }

    // Handle unique constraint violation (duplicate participation) / Gérer la violation de contrainte unique (participation en double)
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'User already participated / L\'utilisateur a déjà participé' 
      });
    }

    return res.status(500).json({ 
      error: 'Internal server error / Erreur interne du serveur',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
