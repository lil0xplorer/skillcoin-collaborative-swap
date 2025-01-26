export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      purchased_courses: {
        Row: {
          id: string
          user_id: string
          course_id: string
          purchase_date: string
          last_accessed: string
          progress: number
          completed_modules: Json
          certificate_id: string | null
          certificate_issued: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          purchase_date?: string
          last_accessed?: string
          progress?: number
          completed_modules?: Json
          certificate_id?: string | null
          certificate_issued?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          purchase_date?: string
          last_accessed?: string
          progress?: number
          completed_modules?: Json
          certificate_id?: string | null
          certificate_issued?: string | null
        }
      }
      course_notes: {
        Row: {
          id: string
          user_id: string
          course_id: string
          module_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          module_id: string
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          module_id?: string
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}