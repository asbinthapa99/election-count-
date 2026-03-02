-- Nepal Election Pulse - Seed Data
-- Run this AFTER schema.sql

-- Insert Elections
INSERT INTO elections (id, name_en, name_np, type, status, description, total_constituencies, counted, date) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Federal Election 2024', 'संघीय निर्वाचन २०८१', 'federal', 'live', 'Nationwide representatives selection for the House of Representatives.', 165, 82, '2024-11-20'),
  ('22222222-2222-2222-2222-222222222222', 'Provincial Assembly', 'प्रदेश सभा', 'provincial', 'verified', 'Regional governance elections across 7 provinces of Nepal.', 330, 330, '2024-11-20'),
  ('33333333-3333-3333-3333-333333333333', 'By-Elections: Kirtipur', 'उप-निर्वाचन: कीर्तिपुर', 'by-election', 'upcoming', 'Vacant local level leadership positions in specialized constituencies.', 3, 0, '2024-12-12');

-- Insert Parties
INSERT INTO parties (id, name_en, name_np, abbreviation, ideology, color) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nepali Congress', 'नेपाली काँग्रेस', 'NC', 'Center-left • Democratic', '#dc2626'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'CPN-UML', 'नेकपा एमाले', 'UML', 'Center-left • Marxist-Leninist', '#2563eb'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'CPN-Maoist Centre', 'नेकपा माओवादी केन्द्र', 'MC', 'Far-left • Maoist', '#ea580c'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Rastriya Swatantra Party', 'राष्ट्रिय स्वतन्त्र पार्टी', 'RSP', 'Centrist • Anti-establishment', '#7c3aed'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Rastriya Prajatantra Party', 'राष्ट्रिय प्रजातन्त्र पार्टी', 'RPP', 'Right-wing • Monarchist', '#0d9488'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Janata Samajbadi Party', 'जनता समाजवादी पार्टी', 'JSP', 'Center-left • Federalist', '#16a34a');

-- Insert Party Results for Federal Election
INSERT INTO party_results (election_id, party_id, votes, seats, trend, source) VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3450210, 62, 1.2, 'Election Commission Nepal'),
  ('11111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 3120445, 58, 0.5, 'Election Commission Nepal'),
  ('11111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 1980112, 21, 0.0, 'Election Commission Nepal'),
  ('11111111-1111-1111-1111-111111111111', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 1245670, 18, 4.8, 'Election Commission Nepal'),
  ('11111111-1111-1111-1111-111111111111', 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 412300, 4, -0.3, 'Election Commission Nepal'),
  ('11111111-1111-1111-1111-111111111111', 'ffffffff-ffff-ffff-ffff-ffffffffffff', 274164, 2, -1.1, 'Election Commission Nepal');

-- Insert sample comments
INSERT INTO comments (election_id, anon_id, content, likes_count) VALUES
  ('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'The voter turnout in Kathmandu District 4 seems significantly higher than 2017. Any official figures yet? Watching closely from the booth.', 12),
  ('11111111-1111-1111-1111-111111111111', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Smooth voting process in Pokhara. The digital verification system is working much faster this time around. Kudos to the Election Commission.', 24),
  ('11111111-1111-1111-1111-111111111111', 'c3d4e5f6-a7b8-9012-cdef-123456789012', 'Just heard reports of ballot box security issues in Saptari. Can anyone confirm? Stay safe everyone.', 8);
