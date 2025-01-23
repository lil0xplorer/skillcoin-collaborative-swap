/*
  # Proposal System Schema

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

-- Create proposals table
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- Create function to update vote counts
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE proposals
    SET 
      yes_votes = CASE 
        WHEN NEW.support THEN yes_votes + 1 
        ELSE yes_votes 
      END,
      no_votes = CASE 
        WHEN NOT NEW.support THEN no_votes + 1 
        ELSE no_votes 
      END,
      updated_at = now()
    WHERE id = NEW.proposal_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE proposals
    SET 
      yes_votes = CASE 
        WHEN OLD.support THEN yes_votes - 1 
        ELSE yes_votes 
      END,
      no_votes = CASE 
        WHEN NOT OLD.support THEN no_votes - 1 
        ELSE no_votes 
      END,
      updated_at = now()
    WHERE id = OLD.proposal_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote counting
CREATE TRIGGER update_proposal_votes
  AFTER INSERT OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_vote_counts();

-- Create policies for proposals
CREATE POLICY "Anyone can view proposals"
  ON proposals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create proposals"
  ON proposals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update proposals"
  ON proposals FOR UPDATE
  USING (true);

-- Create policies for votes
CREATE POLICY "Anyone can view votes"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can vote once per proposal"
  ON votes FOR INSERT
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON proposals TO anon, authenticated;
GRANT ALL ON votes TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;