"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { PanelLeftOpen, Settings, Trash2 } from "lucide-react";
import { UserAvatar } from "@components/ui/user-avatar";
import { useUser } from "@hooks/useUser";
import { useSidebarContext } from "@hooks/use-sidebar-context";
import { useSidebarStore } from "@store/sidebarStore";
import { useMemoCounts } from "@hooks/useMemoCounts";
import { useIsMobile } from "@hooks/useMediaQuery";

export function AccountNavigation() {
  const {
    filteredNavItems: navItems,
    activeHref,
    isCollapsed,
    setIsCollapsed,
    getHrefWithId,
    setIsOpen,
  } = useSidebarContext();
  const { data: session } = useSession();
  const { user } = useUser();
  const { avatarColor, avatarType } = useSidebarStore();
  const { counts: memoCounts } = useMemoCounts();
  const accountGroup = navItems.slice(4);

  const isMobile = useIsMobile();

  // 모바일 환경에서는 isCollapsed 상태를 무시
  const actualIsCollapsed = isMobile ? false : isCollapsed;

  // 세션 상태에 따른 UI 렌더링
  const renderAccountSection = () => {
    if (session && user) {
      // 인증된 사용자의 프로필 정보
      return actualIsCollapsed ? (
        <div className="m-4 flex items-center justify-center">
          <Link href='/settings'>
            <UserAvatar
              userName={user.name || undefined}
              userImage={user.image || undefined}
              avatarColor={avatarColor}
              avatarType={avatarType}
              size="md"
              showBorder={false}
            />
          </Link>
        </div>
      ) : (
        <div className='flex items-center justify-center h-17 m-3 px-4 py-4 bg-black/20 rounded-xl'>
          <div className='flex-1 flex items-center space-x-2'>
            <UserAvatar
              userName={user.name || undefined}
              userImage={user.image || undefined}
              avatarColor={avatarColor ? avatarColor : user.avatarColor}
              avatarType={avatarType ? avatarType : user.avatarType}
              size="md"
              showBorder={false}
            />
            <div className="flex-1 min-w-0">
              <p className="flex items-center text-xs font-medium">
                <span className="truncate">{user.name}</span>
                <span className="text-[0.625rem] ml-1 px-1 py-0.5 border border-popover-border rounded text-primary bg-black/50">BETA</span>
              </p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className={`${actualIsCollapsed ? 'm-4' : 'flex items-center justify-center h-17 m-3 px-4 py-4 bg-black/20 rounded-xl'}`}>
          <div className={`flex-1 flex items-center ${actualIsCollapsed ? 'justify-center' : 'space-x-2'}`}>
            {/* 프로필 이미지 스켈레톤 */}
            <div className="w-8.5 h-8.5 bg-muted-foreground/20 rounded-full animate-pulse" />
            {!actualIsCollapsed && (
              <div className="flex-1 min-w-0">
                {/* 이름과 배지 스켈레톤 */}
                <div className="flex items-center mb-1">
                  <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-20 mr-2" />
                  <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-8" />
                </div>
                {/* 이메일 스켈레톤 */}
                <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-32" />
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <div className="mx-3 border-t border-popover-border" />
      <nav className="p-3 pb-0 space-y-2">
        {accountGroup.map((item) => {
          const Icon = item.icon;
          const baseHref = item.href;
          const hrefWithId = getHrefWithId(baseHref);
          const isActive = activeHref === baseHref;

          // 휴지통 항목에 대한 특별한 처리
          if (item.name === "휴지통") {
            const trashCount = memoCounts.deleted || 0;
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
                }}
              >
                <Icon className="shrink-0 h-5 w-5" />
                <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>{item.name}</span>
                {!actualIsCollapsed && trashCount > 0 && (
                  <span className={`ml-auto text-[0.625rem] text-center px-2 py-1 rounded font-medium fade-in ${isActive ? 'bg-foreground text-inverse' : 'bg-muted-foreground/10 text-muted-foreground'} ${actualIsCollapsed ? 'hidden' : ''}`}>
                    {trashCount}
                  </span>
                )}
              </Link>
            );
          }

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
              }}
            >
              <Icon className="shrink-0 h-5 w-5" />
              <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>{item.name}</span>
            </Link>
          );
        })}
        {/* 설정 메뉴 추가 */}
        <Link
          href="/settings"
          className={`flex items-center px-3 h-11 rounded-lg overflow-hidden ${activeHref === '/settings'
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
            }`}
          onClick={() => {
            setIsOpen(false);
          }}
        >
          <Settings className="shrink-0 h-5 w-5" />
          <span className={`ml-3 text-sm whitespace-nowrap ${actualIsCollapsed ? 'hidden' : ''}`}>설정</span>
        </Link>
        {actualIsCollapsed &&
          <button
            onClick={() => setIsCollapsed(!actualIsCollapsed)}
            className="p-3 h-11 text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 rounded-lg"
          >
            <PanelLeftOpen className="h-5 w-5" strokeWidth={1.5} />
          </button>
        }
      </nav>
      {renderAccountSection()}
    </>
  );
}