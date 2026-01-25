import Link from "next/link";
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg"

export default function ContactLayout({ children }: { children?: React.ReactNode }) {
  return (
    <main className="flex-1">
      <header className="fixed top-0 z-50 w-full bg-background">
        <div className="flex items-center px-6 py-4 mx-auto">
          <Link href="/">
            <div className="flex items-center">
              <LogoSymbolSvg className="ml-1 h-7 w-7" />
              <p className="ml-2 text-[1.75rem] font-medium font-baloo tracking-[-0.5px] text-foreground">Cromo</p>
            </div>
          </Link>
        </div>
      </header>
      {children}
    </main>
  );
}
