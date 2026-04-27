'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS }         from '@dnd-kit/utilities'
import { GripVertical, AlignLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Card as CardType } from '@/types'

interface CardProps {
  card:          CardType
  isDragOverlay?: boolean
  onClick?:      (card: CardType) => void
}

export function Card({ card, isDragOverlay = false, onClick }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id:   card.id,
    // KRİTİK: data objesinin şekli onDragStart/onDragEnd ile birebir eşleşmeli
    data: { type: 'card', card },
  })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
  }

  function handleClick() {
    // Sürükleme bittikten sonra gelen sahte click'leri engelle
    if (!isDragging) onClick?.(card)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      // KRİTİK: listeners tüm kart div'ine bağlı — dnd-kit pointer olaylarını buradan takip eder
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-xl border bg-white px-3.5 py-3',
        'shadow-sm select-none',
        'transition-all duration-150',
        isDragging && !isDragOverlay &&
          'opacity-40 border-dashed border-neutral-300 shadow-none bg-neutral-50',
        isDragOverlay &&
          'border-neutral-300 shadow-xl rotate-[1deg] cursor-grabbing scale-[1.02]',
        !isDragging && !isDragOverlay &&
          'border-neutral-200 hover:border-neutral-300 hover:shadow-md cursor-grab active:cursor-grabbing'
      )}
    >
      {/* Tutamak ikonu — sadece görsel, listener yok */}
      <div className={cn(
        'absolute right-2.5 top-2.5 flex items-center justify-center',
        'w-5 h-5 rounded-md text-neutral-300',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
        isDragOverlay && 'opacity-100'
      )}>
        <GripVertical className="w-3.5 h-3.5" />
      </div>

      {/* Başlık */}
      <p className="text-sm font-medium text-neutral-800 leading-snug pr-6">
        {card.title}
      </p>

      {/* Açıklama önizlemesi */}
      {card.description && (
        <div className="flex items-start gap-1.5">
          <AlignLeft className="w-3 h-3 text-neutral-300 mt-0.5 shrink-0" />
          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
            {card.description}
          </p>
        </div>
      )}

      {/* Alt çizgi + tarih */}
      <div className="flex items-center justify-between pt-1 border-t border-neutral-100 mt-1">
        <span className="text-[10px] text-neutral-300 font-medium tracking-wide">
          {new Date(card.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'short',
          })}
        </span>
      </div>
    </div>
  )
}