import { notFound, redirect } from 'next/navigation'
import { createClient }       from '@/lib/supabase/server'
import { BoardClient }        from '@/components/board/BoardClient'
import type { ColumnWithCards } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function BoardPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  /* Board'u sahip kontrolüyle çek */
  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!board) notFound()

  /* Sütunları ve kartları birlikte çek, position'a göre sırala */
  const { data: columnsRaw } = await supabase
    .from('columns')
    .select(`
      *,
      cards (*)
    `)
    .eq('board_id', id)
    .order('position', { ascending: true })
    .order('position', { foreignTable: 'cards', ascending: true })

  const columns: ColumnWithCards[] = (columnsRaw ?? []).map(col => ({
    ...col,
    cards: col.cards ?? [],
  }))

  return <BoardClient board={board} initialColumns={columns} />
}