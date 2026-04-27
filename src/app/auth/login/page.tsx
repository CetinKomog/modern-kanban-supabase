import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from '@/components/auth/LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Zaten giriş yapmışsa dashboard'a gönder
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      {/* Arka plan dokusu */}
      <div
        className="fixed inset-0 -z-10 opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle, #d4d4d4 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Kart */}
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
        <LoginForm />
      </div>
    </main>
  )
}