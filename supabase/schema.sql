-- Nepal Election Pulse - Database Schema
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vcytrexcffkfoujrgdhp/sql)

-- Elections
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_np TEXT,
  type TEXT NOT NULL CHECK (type IN ('federal', 'provincial', 'by-election', 'local')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'verified', 'completed')),
  description TEXT,
  total_constituencies INT DEFAULT 0,
  counted INT DEFAULT 0,
  date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parties
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_np TEXT,
  abbreviation TEXT NOT NULL UNIQUE,
  ideology TEXT,
  color TEXT DEFAULT '#6b7280',
  flag_url TEXT,
  symbol_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Party Results per Election
CREATE TABLE IF NOT EXISTS party_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  votes INT DEFAULT 0,
  seats INT DEFAULT 0,
  trend NUMERIC(5,2) DEFAULT 0,
  source TEXT DEFAULT 'Election Commission Nepal',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, party_id)
);

-- Predictions (anonymous voting)
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, anon_id)
);

-- Comments (anonymous discussion)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID REFERENCES elections(id) ON DELETE SET NULL,
  anon_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  is_official BOOLEAN DEFAULT false,
  author_name TEXT,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Comment Likes
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, anon_id)
);

-- Results Snapshots
CREATE TABLE IF NOT EXISTS results_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payload_json JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read elections" ON elections FOR SELECT USING (true);
CREATE POLICY "Public read parties" ON parties FOR SELECT USING (true);
CREATE POLICY "Public read party_results" ON party_results FOR SELECT USING (true);
CREATE POLICY "Public read predictions" ON predictions FOR SELECT USING (true);
CREATE POLICY "Public read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Public read comment_likes" ON comment_likes FOR SELECT USING (true);

-- Public insert policies for anonymous interactions
CREATE POLICY "Public insert predictions" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert comments" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert comment_likes" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public delete own likes" ON comment_likes FOR DELETE USING (true);
CREATE POLICY "Public update comments" ON comments FOR UPDATE USING (true) WITH CHECK (true);

-- Enable Realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_party_results_election ON party_results(election_id);
CREATE INDEX IF NOT EXISTS idx_predictions_election ON predictions(election_id);
CREATE INDEX IF NOT EXISTS idx_predictions_anon ON predictions(anon_id);
CREATE INDEX IF NOT EXISTS idx_comments_election ON comments(election_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment ON comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_anon ON comment_likes(anon_id);
