"use client";

import Link from "next/link";
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg";
import GithubSvg from "@svgs/github.svg";
import { Mail, Send } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-[#151618] border-t border-muted-foreground/10 pt-6 pb-8">
      <div className="container mx-auto">
        <div className="flex justify-between">
          <div className="flex items-center">
            <Link href="/" className="inline-block">
              <div className="flex items-center">
                <LogoSymbolSvg className="h-7 w-7" />
                <p className="ml-2 text-[1.75rem] font-medium font-baloo tracking-[-0.5px] text-foreground">Cromo</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="mailto:team.croni@gmail.com" className="w-6 h-6 flex justify-center items-center text-muted-foreground hover:text-foreground transition-colors">
              <Send className="w-5 h-5" />
            </Link>
            <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <GithubSvg className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
      <div className="pt-8 sm:pt-6 text-center md:text-left flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground/70">
        <div className="container flex sm:items-center justify-between flex-col-reverse sm:flex-row gap-3 sm:gap-0">
          <p className="text-left sm:text-center">&copy; {currentYear} Croni. All rights reserved.</p>
          <div className="flex space-x-4 text-sm">
            <Link href="/terms" className="hover:text-foreground transition-colors">이용 약관</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">개인정보 처리방침</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">쿠키 정책</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
