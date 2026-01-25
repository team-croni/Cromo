"use client";

import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleLogoSvg from "@svgs/google.svg";
import LogoSymbolSvg from "@svgs/logo/logo-dark.svg"
import { Ring } from "ldrs/react";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      const callbackUrl = searchParams.get("callbackUrl") || "/memo";
      router.push(callbackUrl);
    }
  }, [status, router, searchParams]);

  useEffect(() => {
    // Check for previous login method
    const method = localStorage.getItem("lastLoginMethod");
    setLastLoginMethod(method);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    // Store login method preference
    localStorage.setItem("lastLoginMethod", "google");

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/memo";
      await signIn("google", {
        callbackUrl,
      });
      // Redirect happens automatically
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="w-full max-w-90 relative z-10">
        <div className="flex flex-col items-center justify-center w-full mb-12">
          <Link href="/">
            <div className="flex items-center">
              <LogoSymbolSvg className="ml-1 h-14 w-14" />
              <p className="ml-3 text-[4rem] font-medium font-baloo tracking-[-0.5px] text-foreground">Cromo</p>
            </div>
          </Link>
          <p className="text-zinc-400 text-sm">
            당신의 아이디어를 더 가치있게 만드세요
          </p>
        </div>
        <div className="">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className={`
                relative w-full flex items-center justify-center gap-3 px-4 py-3 
                bg-white hover:bg-zinc-200 transition
                text-zinc-800 font-medium rounded-2xl
                disabled:pointer-events-none
                group
              `}
            >
              {lastLoginMethod === 'google' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-black border text-[10px] font-bold text-white rounded-full shadow-md/20">
                  최근 로그인
                </div>
              )}

              {isLoading ? (
                <div className='flex justify-center items-center w-6 h-6 text-inverse'>
                  <Ring
                    size="18"
                    speed="2"
                    stroke={2.5}
                    color="currentColor"
                    bgOpacity={0.2}
                  />
                </div>
              ) : (
                <>
                  <GoogleLogoSvg className="w-6 h-6" />
                  <span>Google로 계속하기</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-12 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground/60 leading-relaxed">
              로그인 시 Cromo의 <Link href="/terms" className="text-muted-foreground hover:underline">이용약관</Link> 및 <Link href="/privacy" className="text-muted-foreground hover:underline">개인정보처리방침</Link>에<br />
              동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}