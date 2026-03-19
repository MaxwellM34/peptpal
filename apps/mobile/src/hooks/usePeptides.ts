import { useQuery } from '@tanstack/react-query';
import { fetchPeptideList, fetchPeptideDetail, searchPeptides } from '../api/client';
import { queryKeys } from './useQueryKeys';

export function usePeptideList() {
  return useQuery({
    queryKey: queryKeys.peptideList,
    queryFn: fetchPeptideList,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function usePeptideDetail(slug: string) {
  return useQuery({
    queryKey: queryKeys.peptideDetail(slug),
    queryFn: () => fetchPeptideDetail(slug),
    staleTime: 1000 * 60 * 60,
    enabled: !!slug,
  });
}

export function usePeptideSearch(q: string) {
  return useQuery({
    queryKey: queryKeys.peptideSearch(q),
    queryFn: () => searchPeptides(q),
    staleTime: 1000 * 60 * 5,
    enabled: q.length >= 2,
  });
}
