import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hkzfklybinwyewstwkdn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhremZrbHliaW53eWV3c3R3a2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5ODc3MTUsImV4cCI6MjA4NTU2MzcxNX0.62wT-w6CL5f0DRH_HZdrwQS0WneUAK1Rw_KjwgWQLpU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)