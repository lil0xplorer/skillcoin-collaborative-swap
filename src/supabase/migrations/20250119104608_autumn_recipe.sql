


/*
  # Initial Schema Setup for SkillShare DAO

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, matches auth.users)
      - `email` (text)
      - `full_name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `purchased_courses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (text)
      - `purchase_date` (timestamp)
      - `last_accessed` (timestamp)
      - `progress` (integer)
      - `completed_modules` (jsonb)
      - `certificate_id` (text)
      - `certificate_issued` (timestamp)

    - `course_notes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `course_id` (text)
      - `module_id` (text)
      - `content` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create purchased_courses table
CREATE TABLE purchased_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  course_id text NOT NULL,
  purchase_date timestamptz DEFAULT now(),
  last_accessed timestamptz DEFAULT now(),
  progress integer DEFAULT 0,
  completed_modules jsonb DEFAULT '[]'::jsonb,
  certificate_id text,
  certificate_issued timestamptz,
  UNIQUE(user_id, course_id)
);

-- Create course_notes table
CREATE TABLE course_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles ON DELETE CASCADE NOT NULL,
  course_id text NOT NULL,
  module_id text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view own purchased courses"
  ON purchased_courses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchased courses"
  ON purchased_courses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own purchased courses"
  ON purchased_courses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notes"
  ON course_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notes"
  ON course_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON course_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON course_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add category column to courses table
ALTER TABLE courses ADD COLUMN category VARCHAR(20);

-- Update existing courses with categories
UPDATE courses SET category = 'crypto' WHERE title LIKE '%Crypto%' OR title LIKE '%DeFi%';
UPDATE courses SET category = 'ai' WHERE title LIKE '%AI%' OR title LIKE '%Machine Learning%';
UPDATE courses SET category = 'creative' WHERE title LIKE '%Video%' OR title LIKE '%Digital Art%';
UPDATE courses SET category = 'web3' WHERE title LIKE '%Smart Contract%' OR title LIKE '%NFT%';
UPDATE courses SET category = 'business' WHERE title LIKE '%Marketing%' OR title LIKE '%Business%';