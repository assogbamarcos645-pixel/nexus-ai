-- ==============================================================================
-- NEXUS AI — Schéma PostgreSQL & Politiques de Sécurité RLS pour les Instantanés
-- Fichier : supabase/migrations/20261110_snapshots_schema.sql
-- ==============================================================================
-- Active la persistance cloud sécurisée des instantanés (Snapshots & Rollback)
-- avec isolation stricte par utilisateur (auth.uid() = user_id).
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.project_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  description TEXT,
  author TEXT DEFAULT 'user' NOT NULL CHECK (author IN ('user', 'ai-dev', 'ai-swarm', 'copilot', 'auto')),
  file_count INTEGER NOT NULL DEFAULT 0,
  files JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation impérative de la sécurité au niveau des lignes (Row Level Security)
ALTER TABLE public.project_snapshots ENABLE ROW LEVEL SECURITY;

-- Politiques RLS granulaires : chaque utilisateur n'accède qu'à ses propres instantanés
DROP POLICY IF EXISTS "project_snapshots_select_own" ON public.project_snapshots;
CREATE POLICY "project_snapshots_select_own"
  ON public.project_snapshots FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_snapshots_insert_own" ON public.project_snapshots;
CREATE POLICY "project_snapshots_insert_own"
  ON public.project_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_snapshots_update_own" ON public.project_snapshots;
CREATE POLICY "project_snapshots_update_own"
  ON public.project_snapshots FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_snapshots_delete_own" ON public.project_snapshots;
CREATE POLICY "project_snapshots_delete_own"
  ON public.project_snapshots FOR DELETE
  USING (auth.uid() = user_id);

-- Index de performance pour des restaurations et des listes rapides
CREATE INDEX IF NOT EXISTS idx_snapshots_project_id ON public.project_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON public.project_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_created_at ON public.project_snapshots(created_at DESC);
