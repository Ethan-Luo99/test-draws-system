-- backend/migrations/1_add_draws_system.sql

-- Used to store lottery/draw information / Utilisé pour stocker les informations de tirage
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL, -- Restaurant ID / ID du restaurant
  title VARCHAR(255) NOT NULL, -- Draw title (e.g., "Win a dinner for two") / Titre du tirage (ex: "Gagner un dîner pour deux")
  description TEXT, -- Draw description / Description du tirage
  type VARCHAR(50) NOT NULL CHECK (type IN ('fixed_date', 'condition')), -- Draw type / Type de tirage
  trigger_value INTEGER, -- Trigger value for condition-based draws (e.g. number of participants) / Valeur de déclenchement
  draw_date TIMESTAMP, -- Draw date (only for fixed_date type) / Date de tirage (seulement pour le type fixed_date)
  winning_probability DECIMAL(5,4) NOT NULL DEFAULT 0.01, -- Winning probability / Probabilité de gain
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed', 'completed')),
  winner_user_id UUID, -- Winning user ID / ID de l'utilisateur gagnant
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_draws_business_id ON draws(business_id);  -- Query draws by restaurant / Requête de tirages par restaurant
CREATE INDEX idx_draws_status      ON draws(status);      -- Query draws by status / Requête de tirages par statut
CREATE INDEX idx_draws_draw_date   ON draws(draw_date);   -- Query draws by date / Requête de tirages par date

-- Stores user participation records / Stocke les enregistrements de participation des utilisateurs
CREATE TABLE IF NOT EXISTS draw_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  participated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_winner BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (draw_id, user_id) -- Unique constraint: prevent duplicate participation / Contrainte unique : empêcher la participation en double
);

CREATE INDEX idx_draw_participants_draw_id ON draw_participants(draw_id);
CREATE INDEX idx_draw_participants_user_id ON draw_participants(user_id);
