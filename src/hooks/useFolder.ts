import { useQuery } from '@tanstack/react-query';
import { Folder } from '@/types';
import { defaultRetryConfig } from '@/utils/errorHandler';
import { get } from '@/utils/fetchWrapper';

// 특정 폴더를 가져오는 API 함수
const fetchFolder = async (id: string): Promise<Folder> => {
  return get<Folder>(`/api/folders/${id}`);
};

// 특정 폴더를 가져오는 훅
export function useFolder(folderId: string) {
  return useQuery<Folder, Error>({
    queryKey: ['folder', folderId],
    queryFn: () => fetchFolder(folderId),
    enabled: !!folderId, // folderId가 있을 때만 쿼리를 실행
    ...defaultRetryConfig,
  });
}