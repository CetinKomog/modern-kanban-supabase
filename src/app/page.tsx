import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Giriş yapmışsa doğrudan dashboard'a gönder
  if (user) redirect('/dashboard')

  // Yapmamışsa login'e
  redirect('/auth/login')
}