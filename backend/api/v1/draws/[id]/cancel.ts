import type { Request, Response } from 'express';
import { query } from '../../../../lib/db.js';
import { verifyUser } from '../../../../lib/auth.js';

/**
 * Cancel a draw
 * Annuler un tirage
 */
export default async function handler(req: Request, res: Response) {
  try {
    const { id } = req.query;
    
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Invalid draw ID' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth required
    await verifyUser(req);

    // Check draw existence
    const drawResult = await query(
      'SELECT * FROM draws WHERE id = $1 AND is_active = true',
      [id]
    );

    if (drawResult.rows.length === 0) {
      return res.status(404).json({ error: 'Draw not found' });
    }

    // Check participants
    const participantResult = await query(
      'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
      [id]
    );
    
    if (parseInt(participantResult.rows[0].count) > 0) {
      return res.status(403).json({ 
        error: 'Cannot cancel draw with existing participants' 
      });
    }

    // Execute cancellation (Soft delete via status)
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

  } catch (err: any) {
    console.error('Error cancelling draw:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
