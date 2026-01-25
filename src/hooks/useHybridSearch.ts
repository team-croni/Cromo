import { useEffect, useMemo } from 'react';
import { useMemos } from '@hooks/useMemos';
import { useFolders } from '@hooks/useFolders';
import { useMemoBrowserStore } from '@store/memoBrowserStore';
import { getFilteredMemos } from '@utils/getFilteredItems';
import { useHybridSearchStore } from '@store/hybridSearchStore';
import { useVectorSearch } from '@hooks/useVectorSearch';
import { ExtendedMemo } from '@store/hybridSearchStore';
import { useMemoStore } from '@store/memoStore';
import { useSearchParams } from 'next/navigation';

export interface UseHybridSearchReturn {
  allMemos: ExtendedMemo[];
  folderNameMap: Record<string, string>;
  hybridSearchResults: ExtendedMemo[];
  classifiedResults: { high: ExtendedMemo[]; low: ExtendedMemo[] };
  correction: string | null;
  isLoading: boolean;
  isError: boolean;
  removeMemoFromSearchResults: (memoId: string) => void;
}

export const useHybridSearch = (): UseHybridSearchReturn => {
  const {
    processSearchResults,
    hybridSearchResults,
    classifiedResults,
    isProcessing: storeIsProcessing,
    isError: storeIsError,
    previousSearchTerm,
    setSearchTerm: setSearchTermInStore,
    dateFilter,
    vectorSearchResults,
    setVectorSearchResults,
    isSearchExecuted,
    setCorrection,
    setIsProcessing,
    setIsError,
    removeMemoFromSearchResults
  } = useHybridSearchStore();

  const { searchTerm } = useMemoStore();
  const searchParams = useSearchParams();
  const urlSearchTerm = searchParams.get('search') || '';

  useEffect(() => {
    setSearchTermInStore(searchTerm);
  }, [searchTerm, setSearchTermInStore]);

  const { memos, archivedMemos, sharedMemos, folderMemos } = useMemos();
  const { filterOptions } = useMemoBrowserStore();
  const { folders } = useFolders();

  const allMemos = useMemo(() => {
    const memoMap = new Map<string, ExtendedMemo>();
    [...memos, ...archivedMemos, ...sharedMemos, ...folderMemos].forEach(m => {
      if (!memoMap.has(m.id)) {
        memoMap.set(m.id, { ...m });
      }
    });
    return Array.from(memoMap.values());
  }, [memos, archivedMemos, sharedMemos, folderMemos]);

  const folderNameMap = useMemo(() => {
    return folders.reduce((acc, f) => ({ ...acc, [f.id]: f.name }), {} as Record<string, string>);
  }, [folders]);

  const textResults = useMemo(() => {
    return getFilteredMemos(allMemos, filterOptions);
  }, [allMemos, filterOptions]);

  // 💡 중요: API 응답 구조 변경 대응 ({ results, correction } 형태)
  const { data: searchResponse, isLoading: isVectorLoading, isError: isVectorError, isFetching: isVectorFetching } = useVectorSearch(urlSearchTerm);

  useEffect(() => {
    // API 응답에서 results와 correction을 분리하여 처리
    const results = searchResponse?.results || [];
    const correction = searchResponse?.correction || null;

    setVectorSearchResults(results);
    // 💡 만약 스토어에 setCorrection 함수가 없다면 추가하거나, 
    // 여기 hook에서 바로 리턴값으로 관리해야 합니다.
    if (setCorrection) {
      setCorrection(correction);
    }

    setIsError(isVectorError || false);
  }, [isVectorLoading, isVectorError]);

  useEffect(() => {
    if (!isVectorFetching) {
      setIsProcessing(false);
    }
  }, [isVectorFetching]);

  useEffect(() => {
    if (searchTerm && !isVectorLoading) {
      if (searchTerm === previousSearchTerm && isSearchExecuted) return;
      processSearchResults(textResults);
    } else if (!searchTerm) {
      if (hybridSearchResults.length === 0 && !isSearchExecuted) return;
      processSearchResults([]);
    }
  }, [searchTerm, textResults, dateFilter, isVectorLoading, processSearchResults]);

  // 폴더 이름 맵핑 로직 (동일)
  const resultsWithFolders = useMemo(() => {
    return hybridSearchResults.map(memo => ({
      ...memo,
      folderName: memo.folderId ? folderNameMap[memo.folderId] : 'Uncategorized'
    }));
  }, [hybridSearchResults, folderNameMap]);

  const classifiedResultsWithFolders = useMemo(() => {
    return {
      high: classifiedResults.high.map(memo => ({
        ...memo,
        folderName: memo.folderId ? folderNameMap[memo.folderId] : 'Uncategorized'
      })),
      low: classifiedResults.low.map(memo => ({
        ...memo,
        folderName: memo.folderId ? folderNameMap[memo.folderId] : 'Uncategorized'
      }))
    };
  }, [classifiedResults, folderNameMap]);

  return {
    allMemos,
    folderNameMap,
    hybridSearchResults: resultsWithFolders,
    classifiedResults: classifiedResultsWithFolders,
    correction: searchResponse?.correction || null,
    isLoading: storeIsProcessing || isVectorLoading,
    isError: storeIsError || isVectorError,
    removeMemoFromSearchResults: removeMemoFromSearchResults
  };
};