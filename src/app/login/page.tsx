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
  const [isCredentialsLoading, setIsCredentialsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastLoginMethod, setLastLoginMethod] = useState<string | null>(null);

  // 에러 쿼리 파라미터 처리
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      // 다양한 에러类型에 대한 사용자 친화적 메시지
      const errorMessages: Record<string, string> = {
        "Callback": "로그인 중 오류가 발생했습니다. 다시 시도해 주세요.",
        "OAuthSignin": "로그인 중 오류가 발생했습니다.",
        "OAuthCallback": "로그인 중 오류가 발생했습니다.",
        "Default": "로그인 중 오류가 발생했습니다.",
        "AccountNotLinked": "이 이메일로 이미 다른 계정이 연결되어 있습니다.",
        "InvalidCredentials": "이메일 또는 비밀번호가 올바르지 않습니다.",
        "SessionRequired": "로그인이 필요합니다.",
      };
      setError(errorMessages[errorParam] || errorMessages["Default"]);
    }
  }, [searchParams]);

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

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCredentialsLoading(true);
    setError(null);

    try {
      const callbackUrl = searchParams.get("callbackUrl") || "/memo";
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다.");
        setIsCredentialsLoading(false);
      } else {
        localStorage.setItem("lastLoginMethod", "email");
        router.push(callbackUrl);
      }
    } catch (err) {
      setError("로그인 중 오류가 발생했습니다.");
      setIsCredentialsLoading(false);
    }
  };

  if (status === "loading") {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 mx-auto relative overflow-hidden">
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
        <div>
          <form onSubmit={handleCredentialsSignIn} className="space-y-4 mb-6">
            <div className="space-y-2">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-transparent"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-2xl bg-transparent"
              />
            </div>
            {error && (
              <div className="mb-6 flex items-center gap-3">
                <p className="pl-2 text-xs text-destructive slide-up">{error}</p>
              </div>
            )}
            <button
              type="submit"
              disabled={isCredentialsLoading || isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-primary/50 bg-primary/5 text-foreground font-medium rounded-2xl hover:border-primary/80 hover:bg-primary/10 disabled:opacity-50"
            >
              {isCredentialsLoading ? (
                <div className='flex justify-center items-center w-6 h-6 text-foreground'>
                  <Ring size="18"
                    speed="2"
                    stroke={2}
                    color="currentColor"
                    bgOpacity={0.2}
                  />
                </div>
              ) : (
                "로그인"
              )}
            </button>
          </form>

          <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800"></div>
            </div>
            <span className="relative px-4 bg-background text-zinc-500 text-sm">또는</span>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading || isCredentialsLoading}
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

          <div className="mt-16 pt-6 border-t text-center">
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