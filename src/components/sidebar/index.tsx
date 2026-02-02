"use client";

import LogoSymbolSvg from "@svgs/logo/logo-dark.svg"
import Link from "next/link";
import { useSidebarContext } from "@hooks/use-sidebar-context";
import { AccountNavigation } from "@components/sidebar/account-navigation";
import { FolderSection } from "@components/sidebar/folder-section";
import { MemoNavigation } from "@components/sidebar/memo-navigation";
import { PanelLeftClose } from "lucide-react";
import { useIsMobile } from "@hooks/useMediaQuery";

export function Sidebar() {
  const {
    pathname,
    isOpen,
    setIsOpen,
    isCollapsed,
    setIsCollapsed,
  } = useSidebarContext();

  const isMobile = useIsMobile();

  // 모바일 환경에서는 isCollapsed 상태를 무시
  const actualIsCollapsed = isMobile ? false : isCollapsed;

  if (pathname === '/login') {
    return null;
  }

  if (pathname === '/logs') {
    return null;
  }

  if (pathname === '/') {
    return null;
  }

  return (
    <>
      {/* 사이드바 */}
      <aside
        className={`fixed md:relative z-40 h-full transition-all duration-100 box-content bg-popover ${isOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 md:top-0 md:left-0 flex flex-col border-r ${actualIsCollapsed ? 'w-17' : 'w-80 md:w-72'}`}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <div className={`shrink-0 flex items-center ${actualIsCollapsed ? 'justify-center' : 'justify-between'} px-3 h-17`}>
          <Link href="/memo" className="flex items-center">
            <LogoSymbolSvg className={actualIsCollapsed ? 'h-7 w-7' : 'h-6.5 w-6.5 ml-1'} />
            <p className={`ml-2 text-[26px] font-medium font-baloo tracking-[-0.5px] text-foreground ${actualIsCollapsed ? 'hidden' : ''}`}>Cromo</p>
          </Link>
          {(!isCollapsed || isMobile) &&
            <button
              onClick={() => isMobile ? setIsOpen(false) : setIsCollapsed(!isCollapsed)}
              className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-full"
            >
              <PanelLeftClose className="h-5 w-5" />
            </button>
          }
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <MemoNavigation />
          <FolderSection />
          <AccountNavigation />
        </div>
      </aside>

      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
