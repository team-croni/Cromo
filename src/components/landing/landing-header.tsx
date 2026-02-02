"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg"

export function LandingHeader() {
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "beta-test", "pricing", "faq"];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const offsetTop = element.offsetTop;
          const height = element.offsetHeight;

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + height) {
            setActiveSection(section);
            return;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 초기 상태 설정

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 z-50 w-full">
      <div className="absolute h-[200%] top-0 left-0 right-0 bg-linear-to-b to-transparent from-18% from-[#101012]" />
      <div className="relative container flex h-20 items-center px-4 mx-auto">
        {/* Left side - Logo */}
        <div className="w-1/3 flex items-center">
          <Link href="/">
            <div className="flex items-center">
              <LogoSymbolSvg className="ml-1 h-7 w-7" />
              <p className="ml-2 text-[1.75rem] font-medium font-baloo tracking-[-0.5px] text-foreground">Cromo</p>
            </div>
          </Link>
        </div>

        {/* Center - Navigation */}
        <nav className="hidden md:flex items-center space-x-2 justify-center w-1/3 text-base text-muted-foreground text-center">
          <Link
            href="#home"
            className={`px-4 py-2 min-w-16 font-medium rounded-full transition-colors hover:bg-muted-foreground/5 ${activeSection === "home"
              ? "text-foreground bg-muted-foreground/5"
              : "hover:text-foreground"
              }`}
          >
            홈
          </Link>
          <Link
            href="#features"
            className={`px-4 py-2 min-w-16 font-medium rounded-full transition-colors hover:bg-muted-foreground/5 ${activeSection === "features"
              ? "text-foreground bg-muted-foreground/5"
              : "hover:text-foreground"
              }`}
          >
            기능
          </Link>
          <Link
            href="#beta-test"
            className={`px-4 py-2 min-w-16 font-medium rounded-full transition-colors hover:bg-muted-foreground/5 ${activeSection === "beta-test"
              ? "text-foreground bg-muted-foreground/5"
              : "hover:text-foreground"
              }`}
          >
            BETA
          </Link>
          <Link
            href="#pricing"
            className={`px-4 py-2 min-w-16 font-medium rounded-full transition-colors hover:bg-muted-foreground/5 ${activeSection === "pricing"
              ? "text-foreground bg-muted-foreground/5"
              : "hover:text-foreground"
              }`}
          >
            가격
          </Link>
          <Link
            href="#faq"
            className={`px-4 py-2 min-w-16 font-medium rounded-full transition-colors hover:bg-muted-foreground/5 ${activeSection === "faq"
              ? "text-foreground bg-muted-foreground/5"
              : "hover:text-foreground"
              }`}
          >
            FAQ
          </Link>
        </nav>

        {/* Right side - Auth Buttons */}
        <div className="w-1/3 ml-auto flex items-center justify-end gap-4 text-sm">
          <Link href="/memo">
            <div className="flex items-center justify-center py-2 px-5 text-foreground transition duration-200 hover:text-foreground border border-muted-foreground/30 bg-transparent hover:bg-black/50 hover:border-primary rounded-full shine-border">
              시작하기
              <ChevronRight className="w-4 h-4 ml-2 -mr-1.5" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}