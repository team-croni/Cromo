import { FoldersTab } from "@components/memo/folders-tab";
import { ArchivedMemoList } from "@components/memo/archived-memo-list";
import { RecentMemoList } from "@components/memo/recent-memo-list";
import { HybridSearchResults } from "@components/search/hybrid-search-results";
import { SharedMemoList } from "@components/memo/shared-memo-list";
import { TrashMemoList } from "@components/memo/trash-memo-list";
import { useMemoBrowserStore } from "@store/memoBrowserStore";
import { useSearchParams } from "next/navigation";

export function MemoBrowserContent() {
  const { isSearchOpen } = useMemoBrowserStore();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const folderId = searchParams.get('folderId');

  // 검색어가 있으면 검색 결과를 표시
  if (isSearchOpen) {
    return <HybridSearchResults />;
  }

  // 폴더가 선택되었으면 폴더 탭을 표시
  if (folderId) {
    return <FoldersTab />;
  }

  // 탭에 따라 적절한 메모 목록을 표시
  switch (tabParam) {
    case 'archived':
      return <ArchivedMemoList />;
    case 'trash':
      return <TrashMemoList />;
    case 'shared':
      return <SharedMemoList />;
    default:
      // 기본 탭 또는 폴더가 없는 경우
      return <RecentMemoList />;
  }
}