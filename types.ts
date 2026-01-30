
export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: number;
}

export type EditorMode = 'create' | 'edit';
export type SortOption = 'name-asc' | 'name-desc' | 'newest' | 'oldest';
