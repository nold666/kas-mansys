import { createClient } from '@supabase/supabase-js'

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
      members: {
        Row: {
          id: string
          name: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          active?: boolean
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          member_id: string
          period: string
          amount: number
          status: 'unpaid' | 'pending' | 'paid' | 'rejected'
          proof_path: string | null
          note: string | null
          submitted_at: string | null
          verified_at: string | null
        }
        Insert: {
          id?: string
          member_id: string
          period: string
          amount?: number
          status?: 'unpaid' | 'pending' | 'paid' | 'rejected'
          proof_path?: string | null
          note?: string | null
          submitted_at?: string | null
          verified_at?: string | null
        }
        Update: {
          id?: string
          member_id?: string
          period?: string
          amount?: number
          status?: 'unpaid' | 'pending' | 'paid' | 'rejected'
          proof_path?: string | null
          note?: string | null
          submitted_at?: string | null
          verified_at?: string | null
        }
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient<Database>(supabaseUrl, serviceRoleKey)
}