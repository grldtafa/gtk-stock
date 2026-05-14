-- ═══════════════════════════════════════════════════════
-- GTK STOCK v2 — Schéma Supabase
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- ═══════════════════════════════════════════════════════

-- ── Table app_state (key-value JSON store) ──
-- Note: cette table existe probablement déjà dans votre projet GTK Réseaux
CREATE TABLE IF NOT EXISTS app_state (
  key        TEXT PRIMARY KEY,
  data       JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Table stock (legacy, pour compatibilité avec GTK Réseaux) ──
CREATE TABLE IF NOT EXISTS stock (
  id   TEXT PRIMARY KEY,
  nom  TEXT,
  cat  TEXT,
  qty  INTEGER DEFAULT 0,
  prix NUMERIC(10, 2) DEFAULT 0
);

-- ── Table profiles (roles utilisateurs) ──
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role       TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: créer un profil admin pour chaque nouvel utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Row Level Security ──
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock      ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles   ENABLE ROW LEVEL SECURITY;

-- Politique: utilisateurs authentifiés peuvent tout lire/écrire app_state
DROP POLICY IF EXISTS "Authenticated users can manage app_state" ON app_state;
CREATE POLICY "Authenticated users can manage app_state" ON app_state
  FOR ALL USING (auth.role() = 'authenticated');

-- Politique: utilisateurs authentifiés peuvent tout faire sur stock
DROP POLICY IF EXISTS "Authenticated users can manage stock" ON stock;
CREATE POLICY "Authenticated users can manage stock" ON stock
  FOR ALL USING (auth.role() = 'authenticated');

-- Politique: chaque user peut lire/écrire son propre profil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Données initiales de démonstration ──
-- (optionnel: insérer via l'app après connexion)
-- Les données sont stockées dans app_state avec les clés:
--   gtk-stock-articles-v2  → { articles: [...] }
--   gtk-stock-techniciens-v2 → { techniciens: [...] }
--   gtk-stock-mouvements-v2 → { mouvements: [...] }
