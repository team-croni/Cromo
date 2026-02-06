"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useSidebarContext } from "@hooks/use-sidebar-context";
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg";

export function MobileHeader() {
  const { pathname, isOpen, setIsOpen } = useSidebarContext();

  // 랜딩 페이지에서는 모바일 헤더를 표시하지 않음
  if (pathname === '/') {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 w-full bg-background border-b md:pointer-events-none md:opacity-0">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <Link href="/memo">
            <div className="flex items-center">
              <LogoSymbolSvg className="h-6.5 w-6.5" />
              <p className="ml-2 text-[1.625rem] font-medium font-baloo tracking-[-0.5px] text-foreground">Cromo</p>
            </div>
          </Link>
        </div>

        <button
          className="-mr-2 p-2 rounded-md text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );
}