CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  tone_slider INT DEFAULT 0 CHECK (tone_slider BETWEEN -2 AND 2),
  banned_words TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brand_voice (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  embedding VECTOR(1536),
  example_posts TEXT[]
);

CREATE TABLE IF NOT EXISTS user_platform_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  token_encrypted BYTEA NOT NULL,
  external_user_id TEXT,
  UNIQUE(user_id, platform)
);

DO $$
BEGIN
  CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS calendar_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  pillar TEXT,
  content TEXT,
  media_url TEXT,
  scheduled_time TIMESTAMPTZ,
  status post_status DEFAULT 'draft',
  external_id TEXT,
  idempotency_key UUID UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ,
  CONSTRAINT future_schedule CHECK (scheduled_time > now() OR status != 'scheduled')
);

CREATE TABLE IF NOT EXISTS user_content_pillar_weights (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL,
  weight REAL DEFAULT 0.1 CHECK (weight BETWEEN 0.05 AND 0.5),
  PRIMARY KEY (user_id, pillar)
);

CREATE TABLE IF NOT EXISTS conversion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES calendar_entries(id),
  event_type TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES calendar_entries(id) ON DELETE CASCADE,
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  retrieved_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id SERIAL PRIMARY KEY,
  job_id TEXT,
  queue_name TEXT,
  payload JSONB,
  failed_at TIMESTAMPTZ DEFAULT now()
);
