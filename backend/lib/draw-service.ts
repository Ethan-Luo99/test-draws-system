import { query } from './db.js';
import { getSupabaseUser } from './supabase.js';

/**
 * Check if a draw should be completed and execute completion logic if needed
 * Vérifier si un tirage doit être terminé et exécuter la logique de complétion si nécessaire
 */
export async function checkAndCompleteDraw(drawId: string) {
  try {
    // 1. Get draw details
    const drawResult = await query(
      'SELECT * FROM draws WHERE id = $1 AND is_active = true',
      [drawId]
    );

    if (drawResult.rows.length === 0) {
      return null;
    }

    const draw = drawResult.rows[0];

    // 2. Check conditions based on type
    let shouldComplete = false;

    if (draw.status === 'completed') {
      return draw; // Already completed
    }

    if (draw.type === 'fixed_date') {
      // Check if date has passed
      if (draw.draw_date && new Date(draw.draw_date) <= new Date()) {
        shouldComplete = true;
      }
    } else if (draw.type === 'condition') {
      // Check participant count
      const countResult = await query(
        'SELECT COUNT(*) as count FROM draw_participants WHERE draw_id = $1',
        [drawId]
      );
      const count = parseInt(countResult.rows[0].count);
      
      // If trigger_value is set, check if we reached it
      // Default to 1 if not set (immediate win?) or maybe strict check
      // Based on requirement: "satisfy participants n people"
      const target = draw.trigger_value || 1000000; // Default high if not set to avoid accidental trigger
      
      if (count >= target) {
        shouldComplete = true;
      }
    }

    // 3. Execute completion if needed
    if (shouldComplete && draw.status !== 'completed') {
      return await executeDrawCompletion(drawId);
    }

    return draw;
  } catch (error) {
    console.error('Error in checkAndCompleteDraw:', error);
    throw error;
  }
}

/**
 * Execute the draw completion logic (pick winner)
 * Exécuter la logique de complétion du tirage (choisir un gagnant)
 */
export async function executeDrawCompletion(drawId: string) {
  try {
    // Get all participants
    const participantsResult = await query(
      'SELECT user_id FROM draw_participants WHERE draw_id = $1 ORDER BY RANDOM()',
      [drawId]
    );

    if (participantsResult.rows.length === 0) {
      // No participants - just close it without winner
      await query(
        'UPDATE draws SET status = $1, updated_at = NOW() WHERE id = $2',
        ['closed', drawId]
      );
      return { status: 'closed', message: 'No participants' };
    }

    // Pick winner
    const randomIndex = Math.floor(Math.random() * participantsResult.rows.length);
    const winnerUserId = participantsResult.rows[randomIndex].user_id;

    // Update draw
    await query(
      'UPDATE draws SET winner_user_id = $1, status = $2, updated_at = NOW() WHERE id = $3',
      [winnerUserId, 'completed', drawId]
    );

    // Update participant
    await query(
      'UPDATE draw_participants SET is_winner = true WHERE draw_id = $1 AND user_id = $2',
      [drawId, winnerUserId]
    );

    // Fetch winner info
    let winnerInfo = null;
    try {
      const winnerUser = await getSupabaseUser(winnerUserId);
      winnerInfo = {
        id: winnerUser.id,
        email: winnerUser.email,
        name: winnerUser.user_metadata?.name || null
      };
    } catch (e) {
      console.error('Could not fetch winner info', e);
    }

    return {
      status: 'completed',
      winner: winnerInfo,
      winner_user_id: winnerUserId
    };
  } catch (error) {
    console.error('Error in executeDrawCompletion:', error);
    throw error;
  }
}
