export const queryKeys = {
  peptideList: ['peptides', 'list'] as const,
  peptideDetail: (slug: string) => ['peptides', 'detail', slug] as const,
  peptideSearch: (q: string) => ['peptides', 'search', q] as const,
};
