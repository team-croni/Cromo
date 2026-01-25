import { useQuery } from '@tanstack/react-query';
import { get } from '@/utils/fetchWrapper';

interface MemoCounts {
  recent: number;
  archived: number;
  deleted: number;
  shared: number;
}

interface UseMemoCountsResult {
  counts: MemoCounts;
  loading: boolean;
  error: string | null;
}

const fetchMemoCounts = async (): Promise<MemoCounts> => {
  return get<MemoCounts>('/api/memos/count');
};

export function useMemoCounts(enabled: boolean = true): UseMemoCountsResult {
  const {
    data: counts = { recent: 0, archived: 0, deleted: 0, shared: 0 },
    isLoading: loading,
    error,
  } = useQuery<MemoCounts, Error>({
    queryKey: ['memo-counts'],
    queryFn: fetchMemoCounts,
    staleTime: 1000 * 60 * 10,
    enabled,
  });

  return {
    counts,
    loading,
    error: error?.message || null,
  };
}