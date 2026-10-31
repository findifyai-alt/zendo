-- ============================================================================
-- MIGRATION: 20261031_resend_email_channel.sql
-- PURPOSE: Extend Zendo chat system with Resend Email channel, AES-256-GCM
--          integration credentials storage, conversations, and delivery tracking.
-- ============================================================================

BEGIN;

-- 1. INTEGRATIONS TABLE
-- Stores encrypted provider API keys, webhook signing secrets, and custom from headers.
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'resend',
  encrypted_api_key TEXT,
  encrypted_webhook_secret TEXT,
  from_email TEXT,
  from_name TEXT,
  use_default_email BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'Not connected', -- 'Not connected' | 'Connected' | 'Error'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_integrations_user ON integrations(user_id);

-- Enable Row Level Security (RLS) on integrations
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read and manage their own integration rows
CREATE POLICY user_integrations_isolation_policy ON integrations
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true)::integer)
  WITH CHECK (user_id = current_setting('app.current_user_id', true)::integer);

-- 2. CONVERSATIONS TABLE
-- Tracks client portal conversations, unique tokens, presence and notification batching
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  client_company TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  proposal_id TEXT,
  client_last_active_at TIMESTAMP WITH TIME ZONE,
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conversations_token ON conversations(token);
CREATE INDEX IF NOT EXISTS idx_conversations_user_client ON conversations(user_id, client_company);

-- 3. EXTEND CLIENT_MESSAGES TABLE
-- Adds channel ('chat' | 'email'), sender_type, Resend email ID, delivery status, and deduplication
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'chat';
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'agency';
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS resend_email_id TEXT;
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS attachments_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE client_messages ADD COLUMN IF NOT EXISTS email_message_id TEXT;

CREATE INDEX IF NOT EXISTS idx_client_messages_resend_id ON client_messages(resend_email_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_email_msg_id ON client_messages(email_message_id);
CREATE INDEX IF NOT EXISTS idx_client_messages_conversation ON client_messages(conversation_id);

-- 4. EMAIL USAGE & LIMITS TABLE
-- Tracks daily sent and received counts against the per-user quota buffer
CREATE TABLE IF NOT EXISTS email_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_key TEXT NOT NULL, -- Format: YYYY-MM-DD
  sent_count INTEGER NOT NULL DEFAULT 0,
  received_count INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_date_usage UNIQUE (user_id, date_key)
);

CREATE INDEX IF NOT EXISTS idx_email_usage_user_date ON email_usage(user_id, date_key);

-- 5. EXTEND CLIENTS TABLE
-- Tracks bounce flags for client email addresses
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN NOT NULL DEFAULT FALSE;

COMMIT;
