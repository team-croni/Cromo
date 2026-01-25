import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useFolderStore } from '@/store/folderStore';
import { useMemoStore } from '@/store/memoStore';

export function useFolderExpansion() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { folders, expandFolder, expandedFolders } = useFolderStore();
  const { memos } = useMemoStore();

  useEffect(() => {
    // 현재 페이지가 /memo인지 확인
    const isMemoPage = pathname === '/memo';

    let memoId = null;
    if (isMemoPage) {
      // /memo 페이지에서는 ?id=[id] 파라미터 사용
      memoId = searchParams.get('id');
    } else {
      // 다른 페이지에서는 ?memo=[id] 파라미터 사용 (기존 호환성 유지)
      memoId = searchParams.get('memo');
    }

    if (memoId) {
      // 메모의 상위 폴더들을 모두 확장
      // folders와 memos가 모두 로드되었는지 확인
      if (folders.length > 0 && memos.length > 0) {
        const memo = memos.find(m => m.id === memoId);
        if (memo && memo.folderId) {
          // 메모가 속한 폴더의 모든 상위 폴더를 찾기
          const expandParentFolders = (folderId: string) => {
            const folder = folders.find(f => f.id === folderId);
            if (folder) {
              // 이미 확장된 폴더는 다시 확장하지 않음
              if (!expandedFolders.has(folder.id)) {
                expandFolder(folder.id);
              }
              // 재귀적으로 상위 폴더도 확장
              if (folder.parentId) {
                expandParentFolders(folder.parentId);
              }
            }
          };

          // 메모가 속한 폴더부터 상위 폴더들까지 모두 확장
          expandParentFolders(memo.folderId);
        }
      }
    }
  }, [searchParams, pathname, expandedFolders]); // folders와 memos를 의존성에서 제거하여 불필요한 재실행 방지
}