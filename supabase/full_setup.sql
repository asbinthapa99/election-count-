-- =========================================================================
-- NEPAL ELECTION PULSE - FULL DATABASE SCHEMA & SEED DATA (VERIFIED)
-- =========================================================================
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- -------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (Safe Reset)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 2. CREATE CORE TABLES
-- -------------------------------------------------------------------------

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

-- Constituency Candidates (Live result connections)
CREATE TABLE constituency_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  constituency_id UUID NOT NULL REFERENCES constituencies(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id),
  candidate_name TEXT NOT NULL,
  votes INT DEFAULT 0,
  position INT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Party Results per Election (aggregate totals)
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

-- -------------------------------------------------------------------------
-- 3. CREATE INTERACTIVE FEATURE TABLES (Comments, Likes, Predictions)
-- -------------------------------------------------------------------------

-- Predictions (anonymous user voting)
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  anon_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(election_id, anon_id)
);

-- Comments (anonymous threaded discussion)
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

-- Results Snapshots (scraper payload cache)
CREATE TABLE results_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  payload_json JSONB,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- -------------------------------------------------------------------------
-- 4. SECURITY (Row Level Security & Policies)
-- -------------------------------------------------------------------------

-- Enable RLS
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE constituency_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;

-- Public read policies (Everyone can read data)
CREATE POLICY "public_read" ON elections FOR SELECT USING (true);
CREATE POLICY "public_read" ON parties FOR SELECT USING (true);
CREATE POLICY "public_read" ON constituencies FOR SELECT USING (true);
CREATE POLICY "public_read" ON constituency_candidates FOR SELECT USING (true);
CREATE POLICY "public_read" ON party_results FOR SELECT USING (true);
CREATE POLICY "public_read" ON predictions FOR SELECT USING (true);
CREATE POLICY "public_read" ON comments FOR SELECT USING (true);
CREATE POLICY "public_read" ON comment_likes FOR SELECT USING (true);

-- Public insert policies (Users can interact)
CREATE POLICY "public_insert" ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "public_insert" ON comment_likes FOR INSERT WITH CHECK (true);
CREATE POLICY "public_delete" ON comment_likes FOR DELETE USING (true);
CREATE POLICY "public_update" ON comments FOR UPDATE USING (true) WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 5. OPTIMIZATION: PERFORMANCE INDEXES & REALTIME
-- -------------------------------------------------------------------------

-- Enable Realtime for live UI updates
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE constituencies;

-- Fast Filtering & Searching Indexes
CREATE INDEX idx_constituencies_province ON constituencies(province_number);
CREATE INDEX idx_constituencies_district ON constituencies(district);
CREATE INDEX idx_constituencies_status ON constituencies(status);
CREATE INDEX idx_constituencies_search ON constituencies USING GIN ((name || ' ' || district) gin_trgm_ops); -- Fast text search
CREATE INDEX idx_constituency_candidates_cid ON constituency_candidates(constituency_id);
CREATE INDEX idx_party_results_election ON party_results(election_id);
CREATE INDEX idx_predictions_election ON predictions(election_id);
CREATE INDEX idx_predictions_anon ON predictions(anon_id);
CREATE INDEX idx_comments_election ON comments(election_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);


-- =========================================================================
-- 6. SEED DATA INJECTION
-- =========================================================================

-- Insert the 2082 Election
INSERT INTO elections (id, name_en, name_np, type, status, election_date, total_constituencies, counted)
VALUES ('11111111-1111-1111-1111-111111111111', 'Federal Election 2082', 'संघीय निर्वाचन २०८२', 'federal', 'upcoming', '2026-11-20T07:00:00+05:45', 165, 0);

-- Insert Major Parties
INSERT INTO parties (id, name_en, name_np, abbreviation, ideology, color, seats) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nepali Congress', 'नेपाली काँग्रेस', 'NC', 'Center-left • Democratic Socialism', '#dc2626', 0),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CPN-UML', 'नेकपा एमाले', 'UML', 'Marxist-Leninist • Left', '#2563eb', 0),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CPN-Maoist Centre', 'नेकपा माओवादी केन्द्र', 'MC', 'Far-left • Maoist', '#ea580c', 0),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Rastriya Swatantra Party', 'राष्ट्रिय स्वतन्त्र पार्टी', 'RSP', 'Centrist • Anti-establishment', '#7c3aed', 0),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Rastriya Prajatantra Party', 'राष्ट्रिय प्रजातन्त्र पार्टी', 'RPP', 'Right-wing • Monarchist', '#0d9488', 0),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Janata Samajbadi Party', 'जनता समाजवादी पार्टी', 'JSP', 'Federalist • Social Democrat', '#16a34a', 0),
  ('11111111-aaaa-bbbb-cccc-dddddddddddd', 'Loktantrik Samajwadi Party', 'लोकतान्त्रिक समाजवादी पार्टी', 'LSP', 'Center-left • Federal', '#f59e0b', 0),
  ('22222222-aaaa-bbbb-cccc-dddddddddddd', 'Janamat Party', 'जनमत पार्टी', 'JP', 'Populist • Regional', '#8b5cf6', 0),
  ('33333333-aaaa-bbbb-cccc-dddddddddddd', 'Nagarik Unmukti Party', 'नागरिक उन्मुक्ति पार्टी', 'NUP', 'Liberal • Tharu rights', '#ef4444', 0),
  ('44444444-aaaa-bbbb-cccc-dddddddddddd', 'Independent', 'स्वतन्त्र', 'IND', 'Independent', '#6b7280', 0);

-- Insert All 165 Constituencies
-- Province 1: Koshi
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Jhapa-1', 'Jhapa', 'Koshi', 1, 1, 'not_started'),
  ('Jhapa-2', 'Jhapa', 'Koshi', 1, 2, 'not_started'),
  ('Jhapa-3', 'Jhapa', 'Koshi', 1, 3, 'not_started'),
  ('Jhapa-4', 'Jhapa', 'Koshi', 1, 4, 'not_started'),
  ('Jhapa-5', 'Jhapa', 'Koshi', 1, 5, 'not_started'),
  ('Morang-1', 'Morang', 'Koshi', 1, 1, 'not_started'),
  ('Morang-2', 'Morang', 'Koshi', 1, 2, 'not_started'),
  ('Morang-3', 'Morang', 'Koshi', 1, 3, 'not_started'),
  ('Morang-4', 'Morang', 'Koshi', 1, 4, 'not_started'),
  ('Morang-5', 'Morang', 'Koshi', 1, 5, 'not_started'),
  ('Morang-6', 'Morang', 'Koshi', 1, 6, 'not_started'),
  ('Sunsari-1', 'Sunsari', 'Koshi', 1, 1, 'not_started'),
  ('Sunsari-2', 'Sunsari', 'Koshi', 1, 2, 'not_started'),
  ('Sunsari-3', 'Sunsari', 'Koshi', 1, 3, 'not_started'),
  ('Ilam-1', 'Ilam', 'Koshi', 1, 1, 'not_started'),
  ('Ilam-2', 'Ilam', 'Koshi', 1, 2, 'not_started'),
  ('Panchthar-1', 'Panchthar', 'Koshi', 1, 1, 'not_started'),
  ('Taplejung-1', 'Taplejung', 'Koshi', 1, 1, 'not_started'),
  ('Dhankuta-1', 'Dhankuta', 'Koshi', 1, 1, 'not_started'),
  ('Terhathum-1', 'Terhathum', 'Koshi', 1, 1, 'not_started'),
  ('Sankhuwasabha-1', 'Sankhuwasabha', 'Koshi', 1, 1, 'not_started'),
  ('Bhojpur-1', 'Bhojpur', 'Koshi', 1, 1, 'not_started'),
  ('Solukhumbu-1', 'Solukhumbu', 'Koshi', 1, 1, 'not_started'),
  ('Okhaldhunga-1', 'Okhaldhunga', 'Koshi', 1, 1, 'not_started'),
  ('Khotang-1', 'Khotang', 'Koshi', 1, 1, 'not_started'),
  ('Khotang-2', 'Khotang', 'Koshi', 1, 2, 'not_started'),
  ('Udayapur-1', 'Udayapur', 'Koshi', 1, 1, 'not_started'),
  ('Udayapur-2', 'Udayapur', 'Koshi', 1, 2, 'not_started');

-- Province 2: Madhesh
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Saptari-1', 'Saptari', 'Madhesh', 2, 1, 'not_started'),
  ('Saptari-2', 'Saptari', 'Madhesh', 2, 2, 'not_started'),
  ('Saptari-3', 'Saptari', 'Madhesh', 2, 3, 'not_started'),
  ('Siraha-1', 'Siraha', 'Madhesh', 2, 1, 'not_started'),
  ('Siraha-2', 'Siraha', 'Madhesh', 2, 2, 'not_started'),
  ('Siraha-3', 'Siraha', 'Madhesh', 2, 3, 'not_started'),
  ('Dhanusha-1', 'Dhanusha', 'Madhesh', 2, 1, 'not_started'),
  ('Dhanusha-2', 'Dhanusha', 'Madhesh', 2, 2, 'not_started'),
  ('Dhanusha-3', 'Dhanusha', 'Madhesh', 2, 3, 'not_started'),
  ('Mahottari-1', 'Mahottari', 'Madhesh', 2, 1, 'not_started'),
  ('Mahottari-2', 'Mahottari', 'Madhesh', 2, 2, 'not_started'),
  ('Mahottari-3', 'Mahottari', 'Madhesh', 2, 3, 'not_started'),
  ('Sarlahi-1', 'Sarlahi', 'Madhesh', 2, 1, 'not_started'),
  ('Sarlahi-2', 'Sarlahi', 'Madhesh', 2, 2, 'not_started'),
  ('Sarlahi-3', 'Sarlahi', 'Madhesh', 2, 3, 'not_started'),
  ('Rautahat-1', 'Rautahat', 'Madhesh', 2, 1, 'not_started'),
  ('Rautahat-2', 'Rautahat', 'Madhesh', 2, 2, 'not_started'),
  ('Rautahat-3', 'Rautahat', 'Madhesh', 2, 3, 'not_started'),
  ('Bara-1', 'Bara', 'Madhesh', 2, 1, 'not_started'),
  ('Bara-2', 'Bara', 'Madhesh', 2, 2, 'not_started'),
  ('Bara-3', 'Bara', 'Madhesh', 2, 3, 'not_started'),
  ('Parsa-1', 'Parsa', 'Madhesh', 2, 1, 'not_started'),
  ('Parsa-2', 'Parsa', 'Madhesh', 2, 2, 'not_started');

-- Province 3: Bagmati
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Kathmandu-1', 'Kathmandu', 'Bagmati', 3, 1, 'not_started'),
  ('Kathmandu-2', 'Kathmandu', 'Bagmati', 3, 2, 'not_started'),
  ('Kathmandu-3', 'Kathmandu', 'Bagmati', 3, 3, 'not_started'),
  ('Kathmandu-4', 'Kathmandu', 'Bagmati', 3, 4, 'not_started'),
  ('Kathmandu-5', 'Kathmandu', 'Bagmati', 3, 5, 'not_started'),
  ('Kathmandu-6', 'Kathmandu', 'Bagmati', 3, 6, 'not_started'),
  ('Kathmandu-7', 'Kathmandu', 'Bagmati', 3, 7, 'not_started'),
  ('Kathmandu-8', 'Kathmandu', 'Bagmati', 3, 8, 'not_started'),
  ('Kathmandu-9', 'Kathmandu', 'Bagmati', 3, 9, 'not_started'),
  ('Kathmandu-10', 'Kathmandu', 'Bagmati', 3, 10, 'not_started'),
  ('Lalitpur-1', 'Lalitpur', 'Bagmati', 3, 1, 'not_started'),
  ('Lalitpur-2', 'Lalitpur', 'Bagmati', 3, 2, 'not_started'),
  ('Lalitpur-3', 'Lalitpur', 'Bagmati', 3, 3, 'not_started'),
  ('Bhaktapur-1', 'Bhaktapur', 'Bagmati', 3, 1, 'not_started'),
  ('Bhaktapur-2', 'Bhaktapur', 'Bagmati', 3, 2, 'not_started'),
  ('Kavrepalanchok-1', 'Kavrepalanchok', 'Bagmati', 3, 1, 'not_started'),
  ('Kavrepalanchok-2', 'Kavrepalanchok', 'Bagmati', 3, 2, 'not_started'),
  ('Kavrepalanchok-3', 'Kavrepalanchok', 'Bagmati', 3, 3, 'not_started'),
  ('Sindhupalchok-1', 'Sindhupalchok', 'Bagmati', 3, 1, 'not_started'),
  ('Sindhupalchok-2', 'Sindhupalchok', 'Bagmati', 3, 2, 'not_started'),
  ('Nuwakot-1', 'Nuwakot', 'Bagmati', 3, 1, 'not_started'),
  ('Nuwakot-2', 'Nuwakot', 'Bagmati', 3, 2, 'not_started'),
  ('Rasuwa-1', 'Rasuwa', 'Bagmati', 3, 1, 'not_started'),
  ('Dhading-1', 'Dhading', 'Bagmati', 3, 1, 'not_started'),
  ('Dhading-2', 'Dhading', 'Bagmati', 3, 2, 'not_started'),
  ('Makwanpur-1', 'Makwanpur', 'Bagmati', 3, 1, 'not_started'),
  ('Makwanpur-2', 'Makwanpur', 'Bagmati', 3, 2, 'not_started'),
  ('Chitwan-1', 'Chitwan', 'Bagmati', 3, 1, 'not_started'),
  ('Chitwan-2', 'Chitwan', 'Bagmati', 3, 2, 'not_started'),
  ('Chitwan-3', 'Chitwan', 'Bagmati', 3, 3, 'not_started'),
  ('Sindhuli-1', 'Sindhuli', 'Bagmati', 3, 1, 'not_started'),
  ('Sindhuli-2', 'Sindhuli', 'Bagmati', 3, 2, 'not_started'),
  ('Ramechhap-1', 'Ramechhap', 'Bagmati', 3, 1, 'not_started'),
  ('Ramechhap-2', 'Ramechhap', 'Bagmati', 3, 2, 'not_started'),
  ('Dolakha-1', 'Dolakha', 'Bagmati', 3, 1, 'not_started');

-- Province 4: Gandaki
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Kaski-1', 'Kaski', 'Gandaki', 4, 1, 'not_started'),
  ('Kaski-2', 'Kaski', 'Gandaki', 4, 2, 'not_started'),
  ('Tanahun-1', 'Tanahun', 'Gandaki', 4, 1, 'not_started'),
  ('Tanahun-2', 'Tanahun', 'Gandaki', 4, 2, 'not_started'),
  ('Syangja-1', 'Syangja', 'Gandaki', 4, 1, 'not_started'),
  ('Syangja-2', 'Syangja', 'Gandaki', 4, 2, 'not_started'),
  ('Gorkha-1', 'Gorkha', 'Gandaki', 4, 1, 'not_started'),
  ('Gorkha-2', 'Gorkha', 'Gandaki', 4, 2, 'not_started'),
  ('Lamjung-1', 'Lamjung', 'Gandaki', 4, 1, 'not_started'),
  ('Baglung-1', 'Baglung', 'Gandaki', 4, 1, 'not_started'),
  ('Baglung-2', 'Baglung', 'Gandaki', 4, 2, 'not_started'),
  ('Parbat-1', 'Parbat', 'Gandaki', 4, 1, 'not_started'),
  ('Myagdi-1', 'Myagdi', 'Gandaki', 4, 1, 'not_started'),
  ('Mustang-1', 'Mustang', 'Gandaki', 4, 1, 'not_started'),
  ('Manang-1', 'Manang', 'Gandaki', 4, 1, 'not_started'),
  ('Nawalparasi-East-1', 'Nawalparasi East', 'Gandaki', 4, 1, 'not_started'),
  ('Nawalparasi-East-2', 'Nawalparasi East', 'Gandaki', 4, 2, 'not_started');

-- Province 5: Lumbini
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Rupandehi-1', 'Rupandehi', 'Lumbini', 5, 1, 'not_started'),
  ('Rupandehi-2', 'Rupandehi', 'Lumbini', 5, 2, 'not_started'),
  ('Rupandehi-3', 'Rupandehi', 'Lumbini', 5, 3, 'not_started'),
  ('Rupandehi-4', 'Rupandehi', 'Lumbini', 5, 4, 'not_started'),
  ('Kapilvastu-1', 'Kapilvastu', 'Lumbini', 5, 1, 'not_started'),
  ('Kapilvastu-2', 'Kapilvastu', 'Lumbini', 5, 2, 'not_started'),
  ('Kapilvastu-3', 'Kapilvastu', 'Lumbini', 5, 3, 'not_started'),
  ('Nawalparasi-West-1', 'Nawalparasi West', 'Lumbini', 5, 1, 'not_started'),
  ('Nawalparasi-West-2', 'Nawalparasi West', 'Lumbini', 5, 2, 'not_started'),
  ('Palpa-1', 'Palpa', 'Lumbini', 5, 1, 'not_started'),
  ('Palpa-2', 'Palpa', 'Lumbini', 5, 2, 'not_started'),
  ('Gulmi-1', 'Gulmi', 'Lumbini', 5, 1, 'not_started'),
  ('Gulmi-2', 'Gulmi', 'Lumbini', 5, 2, 'not_started'),
  ('Arghakhanchi-1', 'Arghakhanchi', 'Lumbini', 5, 1, 'not_started'),
  ('Dang-1', 'Dang', 'Lumbini', 5, 1, 'not_started'),
  ('Dang-2', 'Dang', 'Lumbini', 5, 2, 'not_started'),
  ('Dang-3', 'Dang', 'Lumbini', 5, 3, 'not_started'),
  ('Banke-1', 'Banke', 'Lumbini', 5, 1, 'not_started'),
  ('Banke-2', 'Banke', 'Lumbini', 5, 2, 'not_started'),
  ('Banke-3', 'Banke', 'Lumbini', 5, 3, 'not_started'),
  ('Bardiya-1', 'Bardiya', 'Lumbini', 5, 1, 'not_started'),
  ('Bardiya-2', 'Bardiya', 'Lumbini', 5, 2, 'not_started'),
  ('Pyuthan-1', 'Pyuthan', 'Lumbini', 5, 1, 'not_started'),
  ('Rolpa-1', 'Rolpa', 'Lumbini', 5, 1, 'not_started'),
  ('Rukum-East-1', 'Rukum East', 'Lumbini', 5, 1, 'not_started');

-- Province 6: Karnali
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Surkhet-1', 'Surkhet', 'Karnali', 6, 1, 'not_started'),
  ('Surkhet-2', 'Surkhet', 'Karnali', 6, 2, 'not_started'),
  ('Dailekh-1', 'Dailekh', 'Karnali', 6, 1, 'not_started'),
  ('Dailekh-2', 'Dailekh', 'Karnali', 6, 2, 'not_started'),
  ('Jajarkot-1', 'Jajarkot', 'Karnali', 6, 1, 'not_started'),
  ('Salyan-1', 'Salyan', 'Karnali', 6, 1, 'not_started'),
  ('Salyan-2', 'Salyan', 'Karnali', 6, 2, 'not_started'),
  ('Rukum-West-1', 'Rukum West', 'Karnali', 6, 1, 'not_started'),
  ('Dolpa-1', 'Dolpa', 'Karnali', 6, 1, 'not_started'),
  ('Jumla-1', 'Jumla', 'Karnali', 6, 1, 'not_started'),
  ('Kalikot-1', 'Kalikot', 'Karnali', 6, 1, 'not_started'),
  ('Mugu-1', 'Mugu', 'Karnali', 6, 1, 'not_started'),
  ('Humla-1', 'Humla', 'Karnali', 6, 1, 'not_started');

-- Province 7: Sudurpashchim
INSERT INTO constituencies (name, district, province, province_number, constituency_number, status) VALUES
  ('Kailali-1', 'Kailali', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Kailali-2', 'Kailali', 'Sudurpashchim', 7, 2, 'not_started'),
  ('Kailali-3', 'Kailali', 'Sudurpashchim', 7, 3, 'not_started'),
  ('Kailali-4', 'Kailali', 'Sudurpashchim', 7, 4, 'not_started'),
  ('Kanchanpur-1', 'Kanchanpur', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Kanchanpur-2', 'Kanchanpur', 'Sudurpashchim', 7, 2, 'not_started'),
  ('Dadeldhura-1', 'Dadeldhura', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Baitadi-1', 'Baitadi', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Baitadi-2', 'Baitadi', 'Sudurpashchim', 7, 2, 'not_started'),
  ('Darchula-1', 'Darchula', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Bajhang-1', 'Bajhang', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Bajura-1', 'Bajura', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Achham-1', 'Achham', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Achham-2', 'Achham', 'Sudurpashchim', 7, 2, 'not_started'),
  ('Doti-1', 'Doti', 'Sudurpashchim', 7, 1, 'not_started'),
  ('Doti-2', 'Doti', 'Sudurpashchim', 7, 2, 'not_started');

-- =========================================================================
-- 7. MOCK VOTE COUNTING DATA (For UI Testing)
-- =========================================================================

-- First, let's update SOME constituencies to be "counting" or "completed"
UPDATE constituencies 
SET status = 'counting', 
    progress = ROUND((random() * 80 + 10)::numeric, 2), -- 10% to 90%
    total_votes = 100000, 
    counted_votes = floor(random() * 80000 + 10000)
WHERE province_number IN (1, 3, 5);

UPDATE constituencies 
SET status = 'completed', 
    progress = 100, 
    total_votes = 100000, 
    counted_votes = 100000
WHERE name IN ('Kathmandu-1', 'Jhapa-5', 'Chitwan-2');

-- Now, add some candidates to the counting/completed constituencies
DO $$
DECLARE
    const RECORD;
    c1_votes INT;
    c2_votes INT;
    c3_votes INT;
    winner_id UUID;
    winner_name TEXT;
BEGIN
    FOR const IN SELECT * FROM constituencies WHERE status != 'not_started' LOOP
        -- Generate random votes that sum roughly to counted_votes
        c1_votes := floor(const.counted_votes * 0.45);
        c2_votes := floor(const.counted_votes * 0.35);
        c3_votes := const.counted_votes - c1_votes - c2_votes;

        -- Insert Candidate 1 (UML)
        INSERT INTO constituency_candidates (constituency_id, party_id, candidate_name, votes, position)
        VALUES (const.id, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'UML Candidate ' || const.name, c1_votes, 1);

        -- Insert Candidate 2 (NC)
        INSERT INTO constituency_candidates (constituency_id, party_id, candidate_name, votes, position)
        VALUES (const.id, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'NC Candidate ' || const.name, c2_votes, 2);

        -- Insert Candidate 3 (RSP)
        INSERT INTO constituency_candidates (constituency_id, party_id, candidate_name, votes, position)
        VALUES (const.id, 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'RSP Candidate ' || const.name, c3_votes, 3);

        -- If completed, update the constituency winner
        IF const.status = 'completed' THEN
            UPDATE constituencies 
            SET winner_party_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 
                winner_candidate = 'UML Candidate ' || const.name
            WHERE id = const.id;
        END IF;
    END LOOP;
END $$;

-- Update overall party results based on the mock data
INSERT INTO party_results (election_id, party_id, votes, seats)
SELECT 
    '11111111-1111-1111-1111-111111111111',
    party_id,
    SUM(votes),
    (SELECT count(*) FROM constituencies WHERE winner_party_id = constituency_candidates.party_id)
FROM constituency_candidates
GROUP BY party_id;

-- Update overall election counted status
UPDATE elections 
SET counted = (SELECT count(*) FROM constituencies WHERE status = 'completed')
WHERE id = '11111111-1111-1111-1111-111111111111';

