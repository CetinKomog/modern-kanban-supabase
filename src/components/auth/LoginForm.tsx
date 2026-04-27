'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type Mode = 'login' | 'signup'

export function LoginForm() {
  const router   = useRouter()
  const supabase = createClient()

  const [mode, setMode]       = useState<Mode>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-posta veya şifre hatalı.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Hesabın oluşturuldu! E-postanı doğrulayarak giriş yapabilirsin.')
      }
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Başlık */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 mb-4">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="10" rx="1.5" fill="white"/>
            <rect x="2" y="14" width="7" height="4"  rx="1.5" fill="white" opacity=".5"/>
            <rect x="11" y="2" width="7" height="4"  rx="1.5" fill="white" opacity=".5"/>
            <rect x="11" y="8" width="7" height="10" rx="1.5" fill="white"/>
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-neutral-900 tracking-tight">TaskFlow</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {mode === 'login' ? 'Hesabınıza giriş yapın' : 'Ücretsiz hesap oluşturun'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="E-posta"
          type="email"
          placeholder="ornek@mail.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Input
          label="Şifre"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPass(e.target.value)}
          required
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          hint={mode === 'signup' ? 'En az 6 karakter' : undefined}
        />

        {/* Hata / Başarı mesajı */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <p className="text-xs text-emerald-700">{success}</p>
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" className="mt-1 w-full">
          {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </Button>
      </form>

      {/* Mod geçişi */}
      <p className="mt-6 text-center text-sm text-neutral-500">
        {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}{' '}
        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); setSuccess(null) }}
          className="font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-600 transition-colors"
        >
          {mode === 'login' ? 'Kayıt ol' : 'Giriş yap'}
        </button>
      </p>
    </div>
  )
}