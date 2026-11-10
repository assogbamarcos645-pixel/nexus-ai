-- ==============================================================================
-- NEXUS AI — Schéma PostgreSQL & Politiques de Sécurité RLS (Supabase)
-- Fichier : supabase/migrations/20261016_initial_schema.sql
-- ==============================================================================
-- Ce script configure les tables de données privées et active les Row Level
-- Security (RLS) policies pour garantir l'isolation stricte des données de chaque
-- utilisateur (auth.uid() = user_id).
--
-- Tables incluses :
--  1. profiles (Profils utilisateur)
--  2. user_preferences (Préférences de l'interface)
--  3. conversations (Historique de chat)
--  4. messages (Messages échangés avec les agents)
--  5. memories (Souvenirs et contexte mémoire IA)
--  6. projects (Projets NEXUS LAB)
--  7. project_files (Fichiers de code source)
-- ==============================================================================

-- 1. Table des préférences de l'interface (créée en premier pour le trigger profil)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'cosmic' NOT NULL CHECK (theme IN ('cosmic', 'dark', 'light')),
  default_agent_id TEXT DEFAULT 'general' NOT NULL,
  auto_save_lab BOOLEAN DEFAULT true NOT NULL,
  cloud_sync_enabled BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_preferences_select_own" ON public.user_preferences;
CREATE POLICY "user_preferences_select_own"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_preferences_delete_own" ON public.user_preferences;
CREATE POLICY "user_preferences_delete_own"
  ON public.user_preferences FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Table des profils utilisateur
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

-- Trigger automatique de création de profil et préférences à l'inscription auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id, theme, default_agent_id, auto_save_lab, cloud_sync_enabled)
  VALUES (NEW.id, 'cosmic', 'general', true, true)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Table des conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT DEFAULT 'general' NOT NULL,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select_own" ON public.conversations;
CREATE POLICY "conversations_select_own"
  ON public.conversations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_insert_own" ON public.conversations;
CREATE POLICY "conversations_insert_own"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_update_own" ON public.conversations;
CREATE POLICY "conversations_update_own"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_delete_own" ON public.conversations;
CREATE POLICY "conversations_delete_own"
  ON public.conversations FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);

-- 4. Table des messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "messages_select_own" ON public.messages;
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_insert_own" ON public.messages;
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_update_own" ON public.messages;
CREATE POLICY "messages_update_own"
  ON public.messages FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "messages_delete_own" ON public.messages;
CREATE POLICY "messages_delete_own"
  ON public.messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 5. Table des souvenirs IA (Memories)
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'fact' NOT NULL CHECK (category IN ('preference', 'context', 'fact', 'project')),
  agent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "memories_select_own" ON public.memories;
CREATE POLICY "memories_select_own"
  ON public.memories FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_insert_own" ON public.memories;
CREATE POLICY "memories_insert_own"
  ON public.memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_update_own" ON public.memories;
CREATE POLICY "memories_update_own"
  ON public.memories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "memories_delete_own" ON public.memories;
CREATE POLICY "memories_delete_own"
  ON public.memories FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_category ON public.memories(category);

-- 6. Table des projets NEXUS LAB
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_id TEXT NOT NULL,
  is_demo BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_own" ON public.projects;
CREATE POLICY "projects_select_own"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_insert_own" ON public.projects;
CREATE POLICY "projects_insert_own"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_update_own" ON public.projects;
CREATE POLICY "projects_update_own"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "projects_delete_own" ON public.projects;
CREATE POLICY "projects_delete_own"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

-- 7. Table des fichiers de projets NEXUS LAB
CREATE TABLE IF NOT EXISTS public.project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT NOT NULL,
  language TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.project_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_files_select_own" ON public.project_files;
CREATE POLICY "project_files_select_own"
  ON public.project_files FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_files_insert_own" ON public.project_files;
CREATE POLICY "project_files_insert_own"
  ON public.project_files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_files_update_own" ON public.project_files;
CREATE POLICY "project_files_update_own"
  ON public.project_files FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "project_files_delete_own" ON public.project_files;
CREATE POLICY "project_files_delete_own"
  ON public.project_files FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON public.project_files(project_id);
CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON public.project_files(user_id);

-- 8. Fonction RPC sécurisée pour la suppression complète du compte (Droit à l'oubli / RGPD)
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Action non autorisée : utilisateur non authentifié.';
  END IF;

  -- Suppression ordonnée des données utilisateur
  DELETE FROM public.messages WHERE user_id = current_user_id;
  DELETE FROM public.conversations WHERE user_id = current_user_id;
  DELETE FROM public.project_files WHERE user_id = current_user_id;
  DELETE FROM public.projects WHERE user_id = current_user_id;
  DELETE FROM public.memories WHERE user_id = current_user_id;
  DELETE FROM public.user_preferences WHERE user_id = current_user_id;
  DELETE FROM public.profiles WHERE id = current_user_id;

  -- Suppression de l'utilisateur dans auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
