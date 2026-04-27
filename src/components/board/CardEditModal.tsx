'use client'

import { useState, useEffect } from 'react'
import { X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import type { Card } from '@/types'

interface CardEditModalProps {
  card: Card
  onClose:  () => void
  onSave:   (id: string, title: string, description: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function CardEditModal({ card, onClose, onSave, onDelete }: CardEditModalProps) {
  const [title, setTitle]     = useState(card.title)
  const [desc,  setDesc]      = useState(card.description ?? '')
  const [saving, setSaving]   = useState(false)
  const [deleting, setDel]    = useState(false)
  const [confirmDel, setConf] = useState(false)

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    await onSave(card.id, title.trim(), desc.trim())
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!confirmDel) { setConf(true); return }
    setDel(true)
    await onDelete(card.id)
    setDel(false)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-neutral-900">Kartı Düzenle</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Input
            label="Başlık"
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            autoFocus
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700 select-none">
              Açıklama <span className="font-normal text-neutral-400">(isteğe bağlı)</span>
            </label>
            <textarea
              rows={4}
              placeholder="Kart hakkında notlar..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm
                         text-neutral-900 placeholder:text-neutral-400 outline-none resize-none
                         focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 transition-colors"
            />
          </div>

          {/* Alt: silme + kaydetme */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              loading={deleting}
              className="mr-auto"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDel ? 'Eminmisin?' : 'Sil'}
            </Button>
            <Button variant="secondary" onClick={onClose}>İptal</Button>
            <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>
              Kaydet
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}