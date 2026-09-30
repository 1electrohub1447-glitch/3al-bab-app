import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nebkahwtafepixrrwtri.supabase.co'
const supabaseAnonKey = 'sb_publishable_sp1RvBXoStp0fIxqmNHgjQ_zvoJf_Xm'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
})