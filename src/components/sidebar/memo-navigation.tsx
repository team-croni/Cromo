"use client";

import Link from "next/link";
import { useMemoBrowserStore } from "@store/memoBrowserStore";
import { useSidebarContext } from "@hooks/use-sidebar-context";
import { usePathname, useSearchParams } from "next/navigation";
import { useIsMobile } from "@hooks/useMediaQuery";

export function MemoNavigation() {
  const {
    filteredNavItems: navItems,
    activeHref,
    isCollapsed,
    getHrefWithId,
    setIsOpen
  } = useSidebarContext();

  const isMobile = useIsMobile();

  // 모바일 환경에서는 isCollapsed 상태를 무시
  const actualIsCollapsed = isMobile ? false : isCollapsed;
  const { toggleMemoBrowser, isMemoBrowserOpen } = useMemoBrowserStore();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // "탐색" 항목과 나머지 메모 탭 항목들을 분리
  const exploreItem = navItems[0]; // "탐색" 항목
  const memoTabs = navItems.slice(1, 4);

  // 탐색 항목의 활성화 상태 확인 함수
  const isExploreActive = () => {
    if (!exploreItem) return false;
    const isMemoPage = pathname === '/memo';
    const hasSearchParam = searchParams.get('search') !== null;
    const hasTabParam = searchParams.get('tab') !== null;
    const hasFolderIdParam = searchParams.get('folderId') !== null;
    const hasMemoIdParam = searchParams.get('id') !== null;
    // 탐색 메뉴의 경우 pathname이 '/memo'이고 search 파라미터만 있을 때 또는 search와 tab 파라미터가 모두 없을 때 활성화
    return isMemoPage && !hasFolderIdParam && !hasMemoIdParam && (!hasTabParam || hasSearchParam);
  };

  return (
    <nav className="p-3 pt-0 space-y-2">
      {/* 탐색 항목 */}
      {exploreItem && (
        <Link
          key={exploreItem.name}
          href={getHrefWithId(exploreItem.href)}
          className={`flex items-center px-3 h-11 rounded-lg overflow-hidden ${isExploreActive() && isMemoBrowserOpen
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
            }`}
          onClick={() => {
            setIsOpen(false);
            toggleMemoBrowser(true);
          }}
        >
          <exploreItem.icon className="shrink-0 h-5 w-5" />
          <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>{exploreItem.name}</span>
        </Link>
      )}

      {/* 구분선 */}
      <div className="border-t border-popover-border my-3"></div>

      {/* 메모 탭 항목들 */}
      {memoTabs.map((item) => {
        const Icon = item.icon;
        const baseHref = item.href;
        const hrefWithId = getHrefWithId(baseHref);

        // 다른 메뉴는 기존 로직 유지 (탭에 따라 활성화)
        const isActive = activeHref === baseHref && isMemoBrowserOpen;

        return (
          <Link
            key={item.name}
            href={hrefWithId}
            className={`flex items-center px-3 h-11 rounded-lg overflow-hidden ${isActive
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
              }`}
            onClick={() => {
              setIsOpen(false);
              toggleMemoBrowser(true);
            }}
          >
            <Icon className="shrink-0 h-5 w-5" />
            <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}