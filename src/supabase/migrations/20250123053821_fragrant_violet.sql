/*
  # DAO Structure Implementation

  1. New Tables
    - `proposals`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `creator_address` (text)
      - `action_data` (jsonb)
      - `start_time` (timestamptz)
      - `end_time` (timestamptz)
      - `status` (text)
      - `yes_votes` (numeric)
      - `no_votes` (numeric)
      - `executed` (boolean)
      - `created_at` (timestamptz)
      
    - `votes`
      - `id` (uuid, primary key)
      - `proposal_id` (uuid)
      - `voter_address` (text)
      - `vote_amount` (numeric)
      - `vote_type` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proposal creation and voting
*/

-- Create proposals table
CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  creator_address text NOT NULL,
  action_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active',
  yes_votes numeric DEFAULT 0,
  no_votes numeric DEFAULT 0,
  executed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  voter_address text NOT NULL,
  vote_amount numeric NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('yes', 'no')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(proposal_id, voter_address)
);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Policies for proposals
CREATE POLICY "Anyone can view proposals"
  ON proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can create proposals"
  ON proposals FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can vote"
  ON votes FOR INSERT
  TO authenticated
  WITH CHECK (true);