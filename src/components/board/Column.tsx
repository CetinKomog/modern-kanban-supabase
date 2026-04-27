'use client'

import { useMemo, useState } from 'react'
import { useDroppable }      from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS }         from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, GripVertical } from 'lucide-react'
import { cn }          from '@/lib/utils'
import { Card }        from './Card'
import type { Card as CardType, ColumnWithCards } from '@/types'

interface ColumnProps {
  column:          ColumnWithCards
  isDragOverlay?:  boolean
  isOver?:         boolean
  onAddCard:       (columnId: string, title: string) => Promise<void>
  onEditCard:      (card: CardType) => void
  onDeleteColumn:  (columnId: string) => Promise<void>
  onRenameColumn:  (columnId: string, title: string) => Promise<void>
}

export function Column({
  column,
  isDragOverlay  = false,
  isOver         = false,
  onAddCard,
  onEditCard,
  onDeleteColumn,
  onRenameColumn,
}: ColumnProps) {

  // Sütunun kendi sürüklenebilirliği
  const {
    attributes,
    listeners,
    setNodeRef:    setSortableRef,
    transform,
    transition,
    isDragging:    isColumnDragging,
  } = useSortable({
    id:   column.id,
    data: { type: 'column', column },
  })

  // KRİTİK: useDroppable ayrı bir ref — kart listesinin sarmalayıcısına bağlanacak
  const { setNodeRef: setDropRef, isOver: isDraggedOver } = useDroppable({
    id:   column.id,
    data: { type: 'column', column },
  })

  const sortedCards = useMemo(
    () => [...column.cards].sort((a, b) => a.position - b.position),
    [column.cards]
  )
  const cardIds = useMemo(() => sortedCards.map(c => c.id), [sortedCards])

  const [addingCard,   setAddingCard]   = useState(false)
  const [newCardTitle, setNewTitle]     = useState('')
  const [addLoading,   setAddLoading]   = useState(false)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [renaming,     setRenaming]     = useState(false)
  const [renameValue,  setRenameValue]  = useState(column.title)

  async function handleAddCard() {
    if (!newCardTitle.trim()) return
    setAddLoading(true)
    await onAddCard(column.id, newCardTitle.trim())
    setNewTitle('')
    setAddingCard(false)
    setAddLoading(false)
  }

  async function handleRename() {
    if (renameValue.trim() && renameValue !== column.title) {
      await onRenameColumn(column.id, renameValue.trim())
    }
    setRenaming(false)
  }

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  }

  const showDropIndicator = isDraggedOver && sortedCards.length === 0

  return (
    // KRİTİK: Sadece useSortable'ın ref'i bu div'e bağlı
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-2xl border transition-all duration-150',
        isColumnDragging && !isDragOverlay &&
          'opacity-40 border-dashed border-neutral-300',
        isDragOverlay &&
          'shadow-2xl rotate-[0.8deg] border-neutral-300 bg-neutral-50/60',
        isDraggedOver && !isDragOverlay &&
          'border-neutral-400 bg-neutral-100/80',
        !isColumnDragging && !isDragOverlay && !isDraggedOver &&
          'border-neutral-200 bg-neutral-50/60'
      )}
    >
      {/* Sütun başlığı */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Tutamak — listeners burada, sadece tutamak ikonunda */}
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'shrink-0 text-neutral-300 hover:text-neutral-500 transition-colors',
              'cursor-grab active:cursor-grabbing touch-none',
              isDragOverlay && 'cursor-grabbing'
            )}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>

          {renaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={handleRename}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleRename()
                if (e.key === 'Escape') { setRenameValue(column.title); setRenaming(false) }
              }}
              className="flex-1 text-sm font-semibold text-neutral-900 bg-transparent
                         border-b border-neutral-300 outline-none py-0.5 min-w-0"
            />
          ) : (
            <h2
              className="text-sm font-semibold text-neutral-900 truncate"
              onDoubleClick={() => setRenaming(true)}
            >
              {column.title}
            </h2>
          )}
        </div>

        {/* Kart sayısı + menü */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-xs font-medium text-neutral-400 bg-neutral-100 rounded-md px-1.5 py-0.5">
            {sortedCards.length}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700
                         hover:bg-neutral-200 transition-colors"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-7 z-20 w-40 rounded-xl border border-neutral-200
                                bg-white shadow-lg py-1 text-sm">
                  <button
                    onClick={() => { setRenaming(true); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Yeniden adlandır
                  </button>
                  <div className="h-px bg-neutral-100 mx-2 my-1" />
                  <button
                    onClick={() => { onDeleteColumn(column.id); setMenuOpen(false) }}
                    className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Sütunu sil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* KRİTİK: Kart listesi sarmalayıcısı — useDroppable'ın ref'i BURAYA bağlı */}
      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setDropRef}
          className={cn(
            'flex flex-col gap-2 px-3 pb-2 flex-1 min-h-[4rem]',
            'overflow-y-auto max-h-[calc(100vh-280px)]',
            '[&::-webkit-scrollbar]:w-1.5',
            '[&::-webkit-scrollbar-track]:transparent',
            '[&::-webkit-scrollbar-thumb]:rounded-full',
            '[&::-webkit-scrollbar-thumb]:bg-neutral-200',
          )}
        >
          {sortedCards.map(card => (
            <Card
              key={card.id}
              card={card}
              onClick={onEditCard}
            />
          ))}

          {/* Boş sütun drop göstergesi */}
          {sortedCards.length === 0 && (
            <div className={cn(
              'flex items-center justify-center rounded-xl border-2 border-dashed h-20',
              'text-xs transition-colors duration-150',
              showDropIndicator
                ? 'border-neutral-400 bg-neutral-100 text-neutral-500'
                : 'border-neutral-200 text-neutral-300'
            )}>
              {showDropIndicator ? 'Buraya bırak' : 'Henüz kart yok'}
            </div>
          )}
        </div>
      </SortableContext>

      {/* Kart ekleme */}
      <div className="px-3 pb-3 pt-1">
        {addingCard ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              rows={2}
              placeholder="Kart başlığı..."
              value={newCardTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddCard() }
                if (e.key === 'Escape') { setAddingCard(false); setNewTitle('') }
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2
                         text-sm text-neutral-900 placeholder:text-neutral-400
                         outline-none focus:border-neutral-400 focus:ring-2
                         focus:ring-neutral-100 resize-none transition-colors"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleAddCard}
                disabled={addLoading || !newCardTitle.trim()}
                className="flex-1 h-8 rounded-lg bg-neutral-900 text-white text-xs font-medium
                           hover:bg-neutral-700 disabled:opacity-40 transition-colors"
              >
                {addLoading ? '…' : 'Ekle'}
              </button>
              <button
                onClick={() => { setAddingCard(false); setNewTitle('') }}
                className="flex-1 h-8 rounded-lg border border-neutral-200 text-neutral-600
                           text-xs hover:bg-neutral-50 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingCard(true)}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-medium
                       text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors group"
          >
            <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            Kart ekle
          </button>
        )}
      </div>
    </div>
  )
}