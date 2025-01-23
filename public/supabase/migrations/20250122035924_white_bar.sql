/*
  # Create course tables

  1. New Tables
    - `course_submissions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `instructor` (text)
      - `price` (text)
      - `duration` (text)
      - `wallet_address` (text)
      - `image` (text)
      - `status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `courses`
      - Same fields as course_submissions
      - Only contains approved courses

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to submit courses
    - Add policies for admins to manage courses
*/

-- Create course_submissions table
CREATE TABLE IF NOT EXISTS course_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor text NOT NULL,
  price text NOT NULL,
  duration text NOT NULL,
  wallet_address text NOT NULL,
  image text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create courses table for approved courses
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructor text NOT NULL,
  price text NOT NULL,
  duration text NOT NULL,
  wallet_address text NOT NULL,
  image text NOT NULL,
  status text NOT NULL DEFAULT 'approved',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE course_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policies for course_submissions
CREATE POLICY "Anyone can view course submissions"
  ON course_submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can submit courses"
  ON course_submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own submissions"
  ON course_submissions FOR UPDATE
  TO authenticated
  USING (true);

-- Policies for courses
CREATE POLICY "Anyone can view approved courses"
  ON courses FOR SELECT
  TO authenticated
  USING (status = 'approved');

CREATE POLICY "Admins can manage courses"
  ON courses FOR ALL
  TO authenticated
  USING (true);