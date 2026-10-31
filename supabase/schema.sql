-- ============================================================================
-- ZENDO SUPABASE DATABASE SETUP & ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- 1. Create the 'clients' table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT NOT NULL,
  industry TEXT DEFAULT 'Technology',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. Create index for fast user-specific client lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies: users can ONLY read, insert, update, and delete their own clients

-- Policy 1: SELECT - Users can only view their own clients
DROP POLICY IF EXISTS "Users can view own clients" ON public.clients;
CREATE POLICY "Users can view own clients"
  ON public.clients
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: INSERT - Users can only insert rows where user_id matches their auth.uid()
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients"
  ON public.clients
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: UPDATE - Users can only update their own clients
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients"
  ON public.clients
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: DELETE - Users can only delete their own clients
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Users can delete own clients"
  ON public.clients
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
