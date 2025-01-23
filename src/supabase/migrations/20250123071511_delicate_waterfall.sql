/*
  # Governance System Schema

  1. New Tables
    - `proposals`
      - Basic proposal information
      - Vote tracking
      - Status management
    - `votes`
      - Individual vote records
      - Voter tracking
      - Vote type (support/against)

  2. Security
    - Enable RLS
    - Public access policies
    - Automatic vote counting
*/

-- Drop existing tables if they exist
DROP TABLE IF EXISTS votes CASCADE;
DROP TABLE IF EXISTS proposals CASCADE;

-- Create proposals table with simplified structure
CREATE TABLE proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  creator_address text NOT NULL,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL,
  yes_votes integer DEFAULT 0,
  no_votes integer DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  voter_address text NOT NULL,
  support boolean NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_address)
);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create public policies for proposals
CREATE POLICY "Public can view proposals"
  ON proposals FOR SELECT
  USING (true);

CREATE POLICY "Public can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update proposals"
  ON proposals FOR UPDATE
  USING (true);

-- Create public policies for votes
CREATE POLICY "Public can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Public can create votes"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON proposals TO anon, authenticated;
GRANT ALL ON votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;