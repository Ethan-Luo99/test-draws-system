// backend/lib/auth.ts
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// Authentication middleware (validates Bearer Token) / Middleware d'authentification (valide le token Bearer)
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Get Authorization header / Récupérer l'en-tête Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid Token provided / Aucun token valide fourni' });
    }

    // 2. Extract and decode JWT / Extraire et décoder le JWT
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!);
    
    // 3. Validate user from database (TODO: query user table, validate is_active) / Valider l'utilisateur depuis la base de données (À faire : interroger la table utilisateur, valider is_active)
    req.user = decoded; // Attach to req object for subsequent routes / Attacher à l'objet req pour les routes suivantes
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token is invalid or expired / Le token est invalide ou expiré' });
  }
};

// Extend Express Request type (supports req.user) / Étendre le type Express Request (supporte req.user)
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}
