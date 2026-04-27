import Link from 'next/link'
import { Layout } from 'lucide-react'
import type { Board } from '@/types'

interface BoardCardProps {
  board: Board
}

export function BoardCard({ board }: BoardCardProps) {
  const initials = board.title.slice(0, 2).toUpperCase()

  return (
    <Link
      href={`/dashboard/board/${board.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm
                 hover:border-neutral-300 hover:shadow-md transition-all duration-200"
    >
      {/* İkon alanı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-neutral-100
                        group-hover:bg-neutral-900 transition-colors duration-200">
          <span className="text-xs font-semibold text-neutral-600 group-hover:text-white transition-colors">
            {initials}
          </span>
        </div>
        <Layout className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
      </div>

      {/* Başlık & açıklama */}
      <div>
        <h3 className="font-medium text-neutral-900 text-sm leading-snug line-clamp-1">
          {board.title}
        </h3>
      </div>

      {/* Alt bilgi */}
      <div className="mt-auto pt-2 border-t border-neutral-100">
        <p className="text-xs text-neutral-400">
          {new Date(board.created_at).toLocaleDateString('tr-TR', {
            day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>
    </Link>
  )
}