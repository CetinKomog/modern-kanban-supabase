'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X } from 'lucide-react'

interface CreateBoardModalProps {
  onClose: () => void
  onCreated: () => void
}

export function CreateBoardModal({ onClose, onCreated }: CreateBoardModalProps) {
  const supabase   = createClient()
  const inputRef   = useRef<HTMLInputElement>(null)

  const [title, setTitle]       = useState('')
  const [desc, setDesc]         = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Modal açılınca input'a odaklan
  useEffect(() => { inputRef.current?.focus() }, [])

  // ESC ile kapat
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleCreate() {
    if (!title.trim()) { setError('Başlık zorunludur.'); return }
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Oturum bulunamadı.'); setLoading(false); return }

    const { error } = await supabase.from('boards').insert({
      owner_id: user.id,
      title: title.trim(),
      description: desc.trim() || null,
    })

    if (error) {
      setError('Board oluşturulamadı.')
    } else {
      onCreated()
      onClose()
    }
    setLoading(false)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">Yeni board oluştur</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            label="Board adı"
            placeholder="örn. Q3 Ürün Roadmap"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 select-none">
              Açıklama <span className="font-normal text-neutral-400">(isteğe bağlı)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Bu board ne için?"
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm
                         text-neutral-900 placeholder:text-neutral-400 outline-none resize-none
                         focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-colors"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={onClose} className="flex-1">İptal</Button>
            <Button onClick={handleCreate} loading={loading} className="flex-1">Oluştur</Button>
          </div>
        </div>
      </div>
    </div>
  )
}