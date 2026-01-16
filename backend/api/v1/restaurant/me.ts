import type { Request, Response } from 'express';
import { DEMO_BUSINESS_ID } from '../../../lib/constants.js';

/**
 * Get restaurant information
 * Obtenir les informations du restaurant
 * 
 * Authentication:
 * Requires 'X-Business-ID' header matching DEMO_BUSINESS_ID
 * Nécessite l'en-tête 'X-Business-ID' correspondant à DEMO_BUSINESS_ID
 */
export default function handler(req: Request, res: Response) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const businessId = req.headers['x-business-id'];

    if (!businessId || businessId !== DEMO_BUSINESS_ID) {
      return res.status(401).json({ error: 'Unauthorized: Invalid or missing Business ID' });
    }

    // Return hardcoded restaurant info
    // Retourner les informations du restaurant codées en dur
    return res.status(200).json({
      id: DEMO_BUSINESS_ID,
      name: "Le Gourmet Demo",
      description: "A fantastic culinary experience awaiting you. Join our exclusive draws!",
      address: "123 Demo Street, Tech City",
      logo_url: "https://placehold.co/200x200?text=Le+Gourmet",
      currency: "EUR"
    });

  } catch (error: any) {
    console.error('Error in /api/v1/restaurant/me:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
