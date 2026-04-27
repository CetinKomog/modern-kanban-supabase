'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BoardCard } from '@/components/board/BoardCard'
import { CreateBoardModal } from '@/components/board/CreateBoardModal'
import { Button } from '@/components/ui/Button'
import { Plus, LogOut, LayoutDashboard, Loader2 } from 'lucide-react'
import type { Board } from '@/types'
import type { User } from '@supabase/supabase-js'

interface DashboardClientProps {
  initialBoards: Board[]
  user: User
}

export function DashboardClient({ initialBoards, user }: DashboardClientProps) {
  const router   = useRouter()
  const supabase = createClient()

  const [boards, setBoards]         = useState<Board[]>(initialBoards)
  const [showModal, setShowModal]   = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Board listesini Supabase'den tazele
  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setBoards(data ?? [])
  }, [supabase, user.id])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const displayName = user.email?.split('@')[0] ?? 'Kullanıcı'

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-neutral-900">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="10" rx="1.5" fill="white"/>
                <rect x="2" y="14" width="7" height="4"  rx="1.5" fill="white" opacity=".5"/>
                <rect x="11" y="2" width="7" height="4"  rx="1.5" fill="white" opacity=".5"/>
                <rect x="11" y="8" width="7" height="10" rx="1.5" fill="white"/>
              </svg>
            </div>
            <span className="font-semibold text-sm text-neutral-900 tracking-tight">TaskFlow</span>
          </div>

          {/* Sağ: kullanıcı & çıkış */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-neutral-500">{displayName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              loading={signingOut}
            >
              {!signingOut && <LogOut className="w-3.5 h-3.5" />}
              Çıkış
            </Button>
          </div>
        </div>
      </header>

      {/* İçerik */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Sayfa başlığı */}
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <LayoutDashboard className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-400 uppercase tracking-widest">
                Dashboard
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Board'larım
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {boards.length > 0
                ? `${boards.length} aktif board`
                : 'Henüz board yok'}
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} size="md">
            <Plus className="w-4 h-4" />
            Yeni Board
          </Button>
        </div>

        {/* Board Grid */}
        {boards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map(board => (
              <BoardCard key={board.id} board={board} />
            ))}

            {/* Yeni board ekle butonu — grid sonuna */}
            <button
              onClick={() => setShowModal(true)}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed
                         border-neutral-200 text-neutral-400 h-[152px]
                         hover:border-neutral-300 hover:text-neutral-600 hover:bg-neutral-50
                         transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-medium">Yeni board</span>
            </button>
          </div>
        ) : (
          /* Boş durum */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-6 h-6 text-neutral-400" />
            </div>
            <h2 className="text-base font-medium text-neutral-900 mb-1">
              Henüz board'un yok
            </h2>
            <p className="text-sm text-neutral-400 mb-6 max-w-xs">
              İlk Kanban board'unu oluşturarak projelerini yönetmeye başla.
            </p>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              İlk board'umu oluştur
            </Button>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <CreateBoardModal
          onClose={() => setShowModal(false)}
          onCreated={refresh}
        />
      )}
    </div>
  )
}