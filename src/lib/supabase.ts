import { createClient } from '@supabase/supabase-js';
import type { Database } from '../integrations/supabase/types';

// Use the correct Supabase URL and anon key
const supabaseUrl = "https://jkoqqcmcciziwhgumgap.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imprb3FxY21jY2l6aXdoZ3VtZ2FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2MTc4NTEsImV4cCI6MjA1MzE5Mzg1MX0.SeHCl7BB5GxprskQFTFWNy9D5Sa5ruMnBqQP_NbAS0s";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
});

// Helper function to retry failed requests with exponential backoff
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (error instanceof Error) {
        // Log specific error details
        console.error('Error details:', {
          message: error.message,
          name: error.name,
          stack: error.stack
        });
      }
      
      if (i < maxRetries - 1) {
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
        continue;
      }
    }
  }
  
  throw lastError;
}