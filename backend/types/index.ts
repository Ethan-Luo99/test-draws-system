// backend/types/index.ts
// TypeScript type definitions / Définitions de types TypeScript

export interface Draw {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  type: 'fixed_date' | 'condition';
  draw_date?: Date;
  winning_probability: number;
  status: 'draft' | 'active' | 'closed' | 'completed';
  winner_user_id?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DrawParticipant {
  id: string;
  draw_id: string;
  user_id: string;
  participated_at: Date;
  is_winner: boolean;
}

export interface User {
  id: string;
  is_active: boolean;
  [key: string]: any;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}
