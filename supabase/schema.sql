-- Nepal Election Pulse - Updated Schema (v2)
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/vcytrexcffkfoujrgdhp/sql)

-- Drop old tables if re-running
DROP TABLE IF EXISTS comment_likes CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS party_results CASCADE;
DROP TABLE IF EXISTS constituency_results CASCADE;
DROP TABLE IF EXISTS constituency_candidates CASCADE;
DROP TABLE IF EXISTS constituencies CASCADE;
DROP TABLE IF EXISTS parties CASCADE;
DROP TABLE IF EXISTS elections CASCADE;
DROP TABLE IF EXISTS results_snapshots CASCADE;

-- Elections
CREATE TABLE elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_np TEXT,
  type TEXT NOT NULL CHECK (type IN ('federal', 'provincial', 'by-election', 'local')),
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'live', 'completed')),
  election_date TIMESTAMPTZ,
  total_constituencies INT DEFAULT 165,
  counted INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parties
CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_np TEXT,
  abbreviation TEXT NOT NULL UNIQUE,
  ideology TEXT,
  color TEXT DEFAULT '#6b7280',
  seats INT DEFAULT 0,
  total_votes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Constituencies (165 for federal)
CREATE TABLE constituencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  province TEXT NOT NULL,
  province_number INT NOT NULL CHECK (province_number BETWEEN 1 AND 7),
  constituency_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'counting', 'completed')),
  progress NUMERIC(5,2) DEFAULT 0,
  total_votes INT DEFAULT 0,
  counted_votes INT DEFAULT 0,
  winner_party_id UUID REFERENCES parties(id),
  winner_candidate TEXT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(district, constituency_number)
);

-- Constituency Candidate Results
CREATE TABLE constituency_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id),
  candidate_name TEXT NOT NULL,
  votes INT DEFAULT 0,
  position INT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Party Results per Election (aggregate)
CREATE TABLE party_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  votes BIGINT DEFAULT 0,
  seats INT DEFAULT 0,
  trend NUMERIC(5,2) DEFAULT 0,
  source TEXT DEFAULT 'Election Commission Nepal',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, party_id)
);

-- Predictions (anonymous voting)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, anon_id)
);

-- Comments (anonymous discussion)
CREATE TABLE comments (
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
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(comment_id, anon_id)
);

-- Results Snapshots (scraper cache)
CREATE TABLE results_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payload_json JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituency_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read" ON elections FOR SELECT USING (true);
CREATE POLICY "public_read" ON parties FOR SELECT USING (true);
CREATE POLICY "public_read" ON constituencies FOR SELECT USING (true);
CREATE POLICY "public_read" ON constituency_candidates FOR SELECT USING (true);
CREATE POLICY "public_read" ON party_results FOR SELECT USING (true);
CREATE POLICY "public_read" ON predictions FOR SELECT USING (true);
CREATE POLICY "public_read" ON comments FOR SELECT USING (true);
CREATE POLICY "public_read" ON comment_likes FOR SELECT USING (true);

-- Public insert for anonymous interactions
CREATE POLICY "public_insert" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete" ON comment_likes FOR DELETE USING (true);
CREATE POLICY "public_update" ON comments FOR UPDATE USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE constituencies;

-- Indexes
CREATE INDEX idx_constituencies_province ON constituencies(province_number);
CREATE INDEX idx_constituencies_district ON constituencies(district);
CREATE INDEX idx_constituencies_status ON constituencies(status);
CREATE INDEX idx_constituency_candidates_cid ON constituency_candidates(constituency_id);
CREATE INDEX idx_party_results_election ON party_results(election_id);
CREATE INDEX idx_predictions_election ON predictions(election_id);
CREATE INDEX idx_predictions_anon ON predictions(anon_id);
CREATE INDEX idx_comments_election ON comments(election_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);
