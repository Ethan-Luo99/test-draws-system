// backend/api/v1/draws/index.ts
import type { Request, Response } from 'express';
import { query } from '../../../lib/db.js';
import { verifyUser } from '../../../lib/auth.js';

import { DEMO_BUSINESS_ID } from '../../../lib/constants.js';

export default async function handler(req: Request, res: Response) {
  try {
    // Authentication required for all methods unless it's a demo request
    // Authentification requise pour toutes les méthodes sauf si c'est une demande de démo avec header
    let user = null;
    const businessIdHeader = req.headers['x-business-id'];
    const isDemoRequest = businessIdHeader === DEMO_BUSINESS_ID;

    if (!isDemoRequest) {
      user = await verifyUser(req);
    }

    // GET: Get draws list / Obtenir la liste des tirages
    if (req.method === 'GET') {
      const { status } = req.query;
      // Use header business_id if available (demo mode), otherwise from query (admin/user mode?) 
      // or actually for users we might need to know which restaurant they are looking at.
      // For now, let's prioritize the demo flow:
      
      const targetBusinessId = isDemoRequest ? DEMO_BUSINESS_ID : req.query.business_id;
      
      if (!targetBusinessId) {
        return res.status(400).json({ error: 'business_id is required (in query or X-Business-ID header)' });
      }

      // Build query with filters / Construire la requête avec des filtres
      let sql = 'SELECT * FROM draws WHERE business_id = $1 AND is_active = true';
      const params: any[] = [targetBusinessId];

      // Optional: filter by status / Optionnel : filtrer par statut
      if (status) {
        sql += ' AND status = $2';
        params.push(status);
      }

      // Add ordering / Ajouter le tri
      sql += ' ORDER BY created_at DESC';

      const result = await query(sql, params);
      
      // Add participant count for each draw / Ajouter le nombre de participants pour chaque tirage
      const drawsWithCount = await Promise.all(
        result.rows.map(async (draw) => {
          const countResult = await query(
            'SELECT COUNT(*) as participant_count FROM draw_participants WHERE draw_id = $1',
            [draw.id]
          );
          return {
            ...draw,
            participant_count: parseInt(countResult.rows[0].participant_count)
          };
        })
      );

      return res.status(200).json(drawsWithCount);
    }

    // POST: Create draw / Créer un tirage
    if (req.method === 'POST') {
      // If demo request, ensure business_id is set from header
      if (isDemoRequest) {
        req.body.business_id = DEMO_BUSINESS_ID;
      } else {
        // If regular user (future), maybe get business_id from user profile or body? 
        // For now, enforce body.business_id for non-demo users if any.
        // But logic says: restaurant creates draw. Restaurant is identified by header now.
        if (!req.body.business_id) {
             // Fallback or error? Let's assume for now creation is only via this demo flow or strict business_id in body
        }
      }

      const { title, description, type, draw_date, winning_probability, business_id, trigger_value } = req.body;

      // Validate required fields / Valider les champs requis
      if (!title || !type || !business_id) {
        return res.status(400).json({ 
          error: 'title, type, and business_id are required / title, type et business_id sont requis' 
        });
      }

      // Validate draw type / Valider le type de tirage
      if (!['fixed_date', 'condition'].includes(type)) {
        return res.status(400).json({ 
          error: 'type must be fixed_date or condition / type doit être fixed_date ou condition' 
        });
      }

      // Validate type-specific requirements / Valider les exigences spécifiques au type
      if (type === 'fixed_date' && !draw_date) {
        return res.status(400).json({ 
          error: 'draw_date is required for fixed_date type / draw_date est requis pour le type fixed_date' 
        });
      }

      // Validate draw_date is in the future / Valider que draw_date est dans le futur
      if (type === 'fixed_date' && draw_date) {
        const drawDateObj = new Date(draw_date);
        if (drawDateObj <= new Date()) {
          return res.status(400).json({ 
            error: 'draw_date must be in the future / draw_date doit être dans le futur' 
          });
        }
      }

      // Validate winning_probability / Valider winning_probability
      if (winning_probability !== undefined) {
        const prob = parseFloat(winning_probability);
        if (isNaN(prob) || prob < 0 || prob > 1) {
          return res.status(400).json({ 
            error: 'winning_probability must be between 0 and 1 / winning_probability doit être entre 0 et 1' 
          });
        }
      }

      // Insert into database / Insérer dans la base de données
      const sql = `
        INSERT INTO draws (title, description, type, draw_date, winning_probability, business_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const params = [
        title, 
        description, 
        type, 
        type === 'fixed_date' ? draw_date : null, 
        winning_probability || 0.01, 
        business_id,
        'draft' // Default status / Statut par défaut
      ];
      
      const result = await query(sql, params);
      return res.status(201).json(result.rows[0]);
    }

    // Method not allowed / Méthode non autorisée
    return res.status(405).json({ error: 'Method not allowed / Méthode non autorisée' });

  } catch (err: any) {
    console.error('Error in /api/v1/draws:', err);
    
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