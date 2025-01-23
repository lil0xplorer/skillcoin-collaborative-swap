/*
  # Fix Proposal RLS Policies

  1. Changes
    - Drop and recreate tables with proper RLS policies
    - Simplify permissions to allow public access
    - Remove complex triggers
    - Add proper sequence grants

  2. Security
    - Enable RLS
    - Add public policies for basic operations
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view proposals" ON proposals;
DROP POLICY IF EXISTS "Public can create proposals" ON proposals;
DROP POLICY IF EXISTS "Public can update proposals" ON proposals;
DROP POLICY IF EXISTS "Public can view votes" ON proposals;
DROP POLICY IF EXISTS "Public can create votes" ON proposals;

-- Create simplified public policies for proposals
CREATE POLICY "Enable read for all users"
  ON proposals FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON proposals FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Enable update for all users"
  ON proposals FOR UPDATE
  TO public
  USING (true);

-- Create simplified public policies for votes
CREATE POLICY "Enable read for all users"
  ON votes FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Enable insert for all users"
  ON votes FOR INSERT
  TO public
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON proposals TO anon, authenticated;
GRANT ALL ON votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;