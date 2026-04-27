export type Board = {
  id: string
  title: string
  owner_id: string
  created_at: string
}

export type Column = {
  id: string
  board_id: string
  title: string
  position: any // Sayı da olsa harf de olsa kabul et diyoruz
  created_at: string
}

export type Card = {
  id: string
  column_id: string
  board_id: string
  title: string
  description: string | null
  position: any // Esnek bıraktık
  created_at: string
  updated_at?: string
}

export type ColumnWithCards = Column & {
  cards: Card[]
}

export type ActiveDragItem =
  | { type: 'card'; data: Card }
  | { type: 'column'; data: ColumnWithCards }