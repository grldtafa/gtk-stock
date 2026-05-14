import { createClient } from '@supabase/supabase-js'

const url = 'https://beunpztasvcrfikmiwbj.supabase.co'
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJldW5wenRhc3ZjcmZpa21pd2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMzY0OTQsImV4cCI6MjA4NzkxMjQ5NH0.VU6daSv60agmUD-StbKNQTjzbCLBsdobI3Oz_1Oa6go'

export const supabase = createClient(url, key)
export const hasSupabase = true
