'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  arrayMove,
} from '@dnd-kit/sortable'
import { createPortal } from 'react-dom'
import { Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

import { Column }             from './Column'
import { Card }               from './Card'
import { CardEditModal }      from './CardEditModal'
import { Button }             from '@/components/ui/Button'
import { createClient }       from '@/lib/supabase/client'
import { getPositionBetween } from '@/lib/fractional-index'
import type {
  Board,
  Card as CardType,
  ColumnWithCards,
  ActiveDragItem,
} from '@/types'

interface BoardClientProps {
  board:          Board
  initialColumns: ColumnWithCards[]
}

export function BoardClient({ board, initialColumns }: BoardClientProps) {
  const supabase = createClient()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [columns, setColumns]       = useState<ColumnWithCards[]>(initialColumns)
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null)
  const [editingCard, setEditCard]  = useState<CardType | null>(null)
  const [addingCol, setAddingCol]   = useState(false)
  const [newColTitle, setNewColT]   = useState('')
  const [colLoading, setColLoad]    = useState(false)

  /* ─── Sensörler ─────────────────────────────────────────── */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /* ─── Yardımcılar ───────────────────────────────────────── */
  const columnIds = useMemo(() => columns.map(c => c.id), [columns])

  function findColumnOfCard(cardId: string): ColumnWithCards | undefined {
    return columns.find(col => col.cards.some(c => c.id === cardId))
  }

  function findCard(cardId: string): CardType | undefined {
    for (const col of columns) {
      const found = col.cards.find(c => c.id === cardId)
      if (found) return found
    }
  }

  /* ─── Drag Start ────────────────────────────────────────── */
  function onDragStart(event: DragStartEvent) {
    const raw = event.active.data.current as
      | { type: 'card';   card:   CardType }
      | { type: 'column'; column: ColumnWithCards }
      | undefined

    if (!raw) return

    if (raw.type === 'card') {
      setActiveItem({ type: 'card', data: raw.card })
    } else {
      setActiveItem({ type: 'column', data: raw.column })
    }
  }

  /* ─── Drag Over ─────────────────────────────────────────── */
  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeRaw = active.data.current as { type: string } | undefined
    if (!activeRaw || activeRaw.type !== 'card') return

    const activeCard = findCard(String(active.id))
    if (!activeCard) return

    const sourceCol  = findColumnOfCard(String(active.id))
    const overIsCard = !!findCard(String(over.id))
    const targetColId = overIsCard
      ? findColumnOfCard(String(over.id))?.id
      : String(over.id)

    if (!sourceCol || !targetColId) return
    if (sourceCol.id === targetColId) return

    setColumns(prev =>
      prev.map(col => {
        if (col.id === sourceCol.id) {
          return { ...col, cards: col.cards.filter(c => c.id !== active.id) }
        }
        if (col.id === targetColId) {
          const overIndex = overIsCard
            ? col.cards.findIndex(c => c.id === over.id)
            : col.cards.length
          const newCards = [...col.cards]
          newCards.splice(
            overIndex >= 0 ? overIndex : newCards.length,
            0,
            { ...activeCard, column_id: targetColId }
          )
          return { ...col, cards: newCards }
        }
        return col
      })
    )
  }

  /* ─── Drag End ──────────────────────────────────────────── */
  function onDragEnd(event: DragEndEvent) {
    // KRİTİK: Koşulsuz log — bu satır çalışmıyorsa DndContext bağlantısı kopuk
    console.log('[onDragEnd] tetiklendi', {
      activeId: event.active.id,
      overId:   event.over?.id ?? null,
      data:     event.active.data.current,
    })

    setActiveItem(null)
    const { active, over } = event
    if (!over) {
      console.log('[onDragEnd] over yok, çıkılıyor')
      return
    }

    const activeRaw = active.data.current as
      | { type: 'card';   card:   CardType }
      | { type: 'column'; column: ColumnWithCards }
      | undefined

    if (!activeRaw) {
      console.warn('[onDragEnd] active.data.current boş — useSortable data prop eksik olabilir')
      return
    }

    const activeId = String(active.id)
    const overId   = String(over.id)

    /* ── Kart sürükleme ── */
    if (activeRaw.type === 'card') {
      // onDragOver zaten kartı hedef sütuna taşıdı; şimdi sadece pozisyonu hesapla
      const targetCol = columns.find(col =>
        col.cards.some(c => c.id === activeId)
      )

      if (!targetCol) {
        console.warn('[onDragEnd] targetCol bulunamadı, kartId:', activeId)
        return
      }

      const sortedCards = [...targetCol.cards].sort((a, b) => a.position - b.position)
      const activeIndex = sortedCards.findIndex(c => c.id === activeId)
      const overIndex   = sortedCards.findIndex(c => c.id === overId)

      console.log('[onDragEnd] kart hareketi', {
        targetColId: targetCol.id,
        activeIndex,
        overIndex,
        sortedCardIds: sortedCards.map(c => c.id),
      })

      let newPosition: number

      if (overId === targetCol.id) {
        // Sütunun boş alanına bırakıldı → sona ekle
        const others = sortedCards.filter(c => c.id !== activeId)
        const last   = others[others.length - 1]
        newPosition  = getPositionBetween(last?.position ?? null, null)
      } else {
        if (activeIndex === -1 || overIndex === -1) {
          console.warn('[onDragEnd] index bulunamadı', { activeIndex, overIndex })
          return
        }
        if (activeIndex === overIndex) return

        const reordered = arrayMove(sortedCards, activeIndex, overIndex)
        const newIdx    = reordered.findIndex(c => c.id === activeId)
        const before    = reordered[newIdx - 1]?.position ?? null
        const after     = reordered[newIdx + 1]?.position ?? null
        newPosition     = getPositionBetween(before, after)
      }

      console.log('[onDragEnd] yeni pozisyon hesaplandı:', newPosition)

      // Optimistik güncelle
      setColumns(prev =>
        prev.map(col => {
          if (col.id !== targetCol.id) return col
          return {
            ...col,
            cards: col.cards.map(c =>
              c.id === activeId
                ? { ...c, position: newPosition, column_id: targetCol.id }
                : c
            ),
          }
        })
      )

      // Supabase'e yaz — .select() ile RLS hatalarını yakala
      supabase
        .from('cards')
        .update({
          position:  newPosition,
          column_id: targetCol.id,
        })
        .eq('id', activeId)
        .select('id, position, column_id')
        .then(({ data, error }) => {
          if (error) {
            console.error('[supabase] kart güncellenemedi:', {
              message: error.message,
              code:    error.code,
              hint:    error.hint,
              details: error.details,
            })
            // Geri al
            setColumns(initialColumns)
          } else {
            console.log('[supabase] güncellendi:', data)
          }
        })

      return
    }

    /* ── Sütun sürükleme ── */
    if (activeRaw.type === 'column') {
      if (activeId === overId) return

      setColumns(prev => {
        const oldIdx = prev.findIndex(c => c.id === activeId)
        const newIdx = prev.findIndex(c => c.id === overId)
        const moved  = arrayMove(prev, oldIdx, newIdx)

        Promise.all(
          moved.map((col, index) =>
            supabase
              .from('columns')
              .update({ position: index })
              .eq('id', col.id)
              .select('id, position')
          )
        ).then(results => {
          results.forEach(({ error }) => {
            if (error) console.error('[supabase] sütun sıralama hatası:', error.message)
          })
        })

        return moved
      })
    }
  }

  /* ─── CRUD ──────────────────────────────────────────────── */
  const handleAddColumn = useCallback(async () => {
    if (!newColTitle.trim()) return
    setColLoad(true)

    const { data, error } = await supabase
      .from('columns')
      .insert({ board_id: board.id, title: newColTitle.trim(), position: columns.length })
      .select()
      .single()

    if (error) {
      console.error('[column] eklenemedi:', error.message)
    } else {
      setColumns(prev => [...prev, { ...data, cards: [] }])
      setNewColT('')
      setAddingCol(false)
    }
    setColLoad(false)
  }, [newColTitle, columns.length, board.id, supabase])

  const handleDeleteColumn = useCallback(async (columnId: string) => {
    setColumns(prev => prev.filter(c => c.id !== columnId))
    const { error } = await supabase.from('columns').delete().eq('id', columnId)
    if (error) {
      console.error('[column] silinemedi:', error.message)
      setColumns(initialColumns)
    }
  }, [supabase, initialColumns])

  const handleRenameColumn = useCallback(async (columnId: string, title: string) => {
    setColumns(prev => prev.map(c => c.id === columnId ? { ...c, title } : c))
    const { error } = await supabase.from('columns').update({ title }).eq('id', columnId)
    if (error) {
      console.error('[column] yeniden adlandırılamadı:', error.message)
      setColumns(initialColumns)
    }
  }, [supabase, initialColumns])

  const handleAddCard = useCallback(async (columnId: string, title: string) => {
    const col    = columns.find(c => c.id === columnId)
    if (!col) return

    const sorted   = [...col.cards].sort((a, b) => a.position - b.position)
    const last     = sorted[sorted.length - 1]
    const position = getPositionBetween(last?.position ?? null, null)

    const { data, error } = await supabase
      .from('cards')
      .insert({ column_id: columnId, board_id: board.id, title: title.trim(), position })
      .select()
      .single()

    if (error) {
      console.error('[card] eklenemedi:', error.message)
      return
    }
    setColumns(prev =>
      prev.map(c => c.id === columnId ? { ...c, cards: [...c.cards, data] } : c)
    )
  }, [columns, board.id, supabase])

  const handleEditCard = useCallback(async (id: string, title: string, desc: string) => {
    setColumns(prev =>
      prev.map(col => ({
        ...col,
        cards: col.cards.map(c =>
          c.id === id ? { ...c, title, description: desc || null } : c
        ),
      }))
    )
    const { error } = await supabase
      .from('cards')
      .update({ title, description: desc || null })
      .eq('id', id)
    if (error) {
      console.error('[card] düzenlenemedi:', error.message)
      setColumns(initialColumns)
    }
  }, [supabase, initialColumns])

  const handleDeleteCard = useCallback(async (id: string) => {
    setColumns(prev =>
      prev.map(col => ({ ...col, cards: col.cards.filter(c => c.id !== id) }))
    )
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) {
      console.error('[card] silinemedi:', error.message)
      setColumns(initialColumns)
    }
  }, [supabase, initialColumns])
  if (!mounted) return null
  /* ─── Render ────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-neutral-50 overflow-hidden">

      <header className="shrink-0 border-b border-neutral-200 bg-white/80 backdrop-blur-sm z-30">
        <div className="px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-neutral-400 hover:text-neutral-700
                       transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <div className="w-px h-4 bg-neutral-200" />
          <h1 className="text-sm font-semibold text-neutral-900 truncate flex-1">
            {board.title}
          </h1>

          {addingCol ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                placeholder="Sütun adı..."
                value={newColTitle}
                onChange={e => setNewColT(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleAddColumn()
                  if (e.key === 'Escape') { setAddingCol(false); setNewColT('') }
                }}
                className="h-8 w-40 rounded-lg border border-neutral-300 px-3 text-sm
                           outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100"
              />
              <Button size="sm" onClick={handleAddColumn} loading={colLoading}>Ekle</Button>
              <Button size="sm" variant="ghost"
                onClick={() => { setAddingCol(false); setNewColT('') }}>İptal</Button>
            </div>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setAddingCol(true)}>
              <Plus className="w-3.5 h-3.5" />
              Sütun ekle
            </Button>
          )}
        </div>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          <main
            className="flex-1 flex items-start gap-4 px-4 sm:px-6 py-6
                       overflow-x-auto overflow-y-hidden
                       [&::-webkit-scrollbar]:h-1.5
                       [&::-webkit-scrollbar-track]:transparent
                       [&::-webkit-scrollbar-thumb]:rounded-full
                       [&::-webkit-scrollbar-thumb]:bg-neutral-300"
          >
            {columns.map(col => (
              <Column
                key={col.id}
                column={col}
                onAddCard={handleAddCard}
                onEditCard={setEditCard}
                onDeleteColumn={handleDeleteColumn}
                onRenameColumn={handleRenameColumn}
              />
            ))}

            {!addingCol && (
              <button
                onClick={() => setAddingCol(true)}
                className="flex items-center gap-2 w-72 shrink-0 h-16 rounded-2xl border-2
                           border-dashed border-neutral-200 text-neutral-400 text-sm font-medium
                           hover:border-neutral-300 hover:text-neutral-600 hover:bg-neutral-100/50
                           transition-all duration-200 justify-center"
              >
                <Plus className="w-4 h-4" />
                Yeni sütun
              </button>
            )}
          </main>
        </SortableContext>

        {typeof document !== 'undefined' && createPortal(
          <DragOverlay dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
          }}>
            {activeItem?.type === 'card' && (
              <Card card={activeItem.data} isDragOverlay />
            )}
            {activeItem?.type === 'column' && (
              <Column
                column={activeItem.data as ColumnWithCards}
                isDragOverlay
                onAddCard={async () => {}}
                onEditCard={() => {}}
                onDeleteColumn={async () => {}}
                onRenameColumn={async () => {}}
              />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {editingCard && (
        <CardEditModal
          card={editingCard}
          onClose={() => setEditCard(null)}
          onSave={handleEditCard}
          onDelete={handleDeleteCard}
        />
      )}
    </div>
  )
}