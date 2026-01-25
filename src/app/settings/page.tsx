"use client";

import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { UserAvatar } from "@components/ui/user-avatar";
import { useUser } from "@hooks/useUser";
import { DEFAULT_AVATAR_GRADIENT, AVATAR_GRADIENT_OPTIONS } from "@constants/avatar-gradients";
import MainLayout from "@components/layout/main-layout";
import { Ring } from "ldrs/react";
import { Check, ChevronLeft, LogOut, Calendar, Shield, Trash2, FileText, Lock, Info, MessageCircle, CloudDownload, History } from "lucide-react";
import Link from "next/link";
import GoogleLogoSvg from "@svgs/google.svg";
import { useSocketContext } from "@contexts/SocketContext";

interface ProfileDetails {
  createdAt: string;
  accounts: { provider: string }[];
}

interface MemoCounts {
  recent: number;
  archived: number;
  deleted: number;
  shared: number;
}

export default function SettingsPage() {
  const { status } = useSession();
  const { user, updateUser } = useUser();
  const { socket } = useSocketContext(); // 소켓 컨텍스트 가져오기
  const [selectedGradient, setSelectedGradient] = useState(user?.avatarColor || DEFAULT_AVATAR_GRADIENT);
  const [selectedType, setSelectedType] = useState<"gradient" | "solid" | "image">(user?.avatarType || "gradient");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [memoCounts, setMemoCounts] = useState<MemoCounts | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setSelectedGradient(user.avatarColor || DEFAULT_AVATAR_GRADIENT);
      setSelectedType(user.avatarType || "gradient");
    }
  }, [user]);

  useEffect(() => {
    const fetchMemoCounts = async () => {
      try {
        const res = await fetch('/api/memos/count');
        if (res.ok) {
          const data = await res.json();
          setMemoCounts(data);
        }
      } catch (e) {
        console.error("Failed to fetch memo counts:", e);
      }
    };

    if (status === "authenticated") {
      fetchMemoCounts();
    }
  }, [status]);

  if (status === "unauthenticated") {
    redirect("/login");
  }

  const handleSaveAvatar = async (color: string, type: "gradient" | "solid" | "image") => {
    setIsSaving(true);
    try {
      const updatedUser = await updateUser({
        avatarColor: color,
        avatarType: type
      });

      // 소켓을 통해 아바타 변경 알림 전송
      if (socket && updatedUser) {
        socket.emit('user-avatar-updated', updatedUser);
      }
    } catch (error) {
      console.error("Failed to update avatar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const deleteAccountMessage = `정말로 계정을 삭제하시겠습니까?

[삭제 전 확인 사항]
1. 계정 삭제 시 즉시 서비스 이용이 중단됩니다.
2. 데이터 복구 지원 및 부정 이용 방지를 위해 데이터는 90일간 암호화되어 안전하게 보관됩니다.
3. 90일 유예 기간이 경과하면 모든 데이터는 영구 파기되며, 이후에는 어떠한 방법으로도 복구가 불가능합니다.
4. 중요한 데이터는 삭제 전 반드시 개별적으로 백업해 주시기 바랍니다.

위 내용을 확인하였으며, 삭제에 동의하십니까?`;

    if (!window.confirm(deleteAccountMessage)) {
      return;
    }

    try {
      const res = await fetch('/api/user/delete', { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        alert("계정이 삭제되었습니다.");

        // 계정 삭제 후 로컬 스토리지 및 쿠키 삭제
        if (data.clearLocalStorage) {
          // 사용자 관련 모든 로컬 스토리지 데이터 삭제
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
              key.startsWith('cromo_') ||
              key.includes('memo') ||
              key.includes('folder') ||
              key.includes('search') ||
              key.includes('sidebar') ||
              key.includes('theme')
            )) {
              keysToRemove.push(key);
            }
          }

          keysToRemove.forEach(key => {
            localStorage.removeItem(key);
          });
        }

        signOut({ callbackUrl: '/' });
      } else {
        const error = await res.json();
        alert(`계정 삭제 실패: ${error.error || "알 수 없는 오류"}`);
      }
    } catch (e) {
      console.error(e);
      alert("오류가 발생했습니다.");
    }
  };

  const onTypeChange = (type: "gradient" | "solid" | "image") => {
    setSelectedType(type);
    // For solid type, we should preserve the color, for gradient we use the selected gradient, for image we use the user's image
    let color = selectedGradient;
    if (type === "solid" && !selectedGradient.includes('-')) {
      // If it's not a valid tailwind color class, default to blue-500
      color = "blue-500";
    } else if (type === "image" && user?.image) {
      // For image type, we don't need a color
      color = selectedGradient;
    }
    handleSaveAvatar(color, type);
  };

  const onGradientChange = (gradient: string) => {
    setSelectedGradient(gradient);
    handleSaveAvatar(gradient, selectedType);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <GoogleLogoSvg className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      default:
        return provider;
    }
  };

  if (status === "loading" || !user || !mounted || !user.createdAt || !memoCounts) {
    return (
      <MainLayout>
        <div className="flex-1 flex h-screen items-center justify-center">
          <Ring
            size="28"
            speed="2"
            stroke={3}
            color="var(--color-foreground)"
            bgOpacity={0.2}
          />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col h-full pt-4 bg-background overflow-y-scroll scrollbar-normal">
        <div className="flex-1 max-w-2xl mx-auto w-full p-6 space-y-8 pb-20">
          {/* User Info Section */}
          <section className="space-y-4 opacity-0 slide-up" style={{ animationDelay: "0ms", animationFillMode: 'forwards' }}>
            <h2 className="text-sm font-medium text-muted-foreground">내 계정</h2>
            <div className="flex items-center space-x-4 p-4 rounded-xl border bg-popover/50">
              <UserAvatar
                userName={user.name || undefined}
                userImage={user.image || undefined}
                avatarColor={user.avatarColor}
                avatarType={user.avatarType}
                size="lg"
                showBorder={false}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <p className="font-medium truncate">{user.name}</p>
                  <span className="text-[0.625rem] ml-1.5 px-1 py-0.5 border rounded text-primary bg-black/50 font-medium">BETA</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>

            {/* Additional Profile Details */}
            {user && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    가입일
                  </div>
                  <p className="text-sm font-medium">{formatDate(user.createdAt)}</p>
                </div>
                <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                  <div className="flex items-center text-xs text-muted-foreground mb-2">
                    <Shield className="w-3.5 h-3.5 mr-1.5" />
                    로그인 방식
                  </div>
                  <div className="flex items-center space-x-2">
                    {user.accounts && user.accounts.length > 0 ? (
                      <>
                        {getProviderIcon(user.accounts[0].provider)}
                        <span className="text-sm font-medium capitalize">{getProviderName(user.accounts[0].provider)}</span>
                      </>
                    ) : (
                      <span className="text-sm font-medium">Email</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Avatar Style Section */}
          <section className="space-y-4 opacity-0 slide-up" style={{ animationDelay: "100ms", animationFillMode: 'forwards' }}>
            <div className="flex items-center">
              <h2 className="text-sm font-medium text-muted-foreground">아바타 설정</h2>
              {isSaving && (
                <div className="flex items-center justify-center w-5 h-5 ml-2">
                  <Ring
                    size="16"
                    speed="2"
                    stroke={2}
                    color="var(--color-foreground)"
                    bgOpacity={0.2}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3">
              {/* Type selection */}
              <div className="flex p-1 bg-popover/50 border rounded-xl w-fit">
                {(["gradient", "image"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onTypeChange(type)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 ${selectedType === type
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                      }`}
                    disabled={isSaving}
                  >
                    {type === "gradient" ? "그라데이션" : "이미지"}
                  </button>
                ))}
              </div>

              {/* Gradient options */}
              {(selectedType === "gradient" || selectedType === "solid") && (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-3 max-w-lg mt-5">
                  {AVATAR_GRADIENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onGradientChange(option.value)}
                      disabled={isSaving}
                      className={`relative aspect-square rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 ring-offset-background disabled:opacity-50 disabled:pointer-events-none ${selectedGradient === option.value
                        ? "ring-[1.5px] ring-muted-foreground/70 ring-offset-3"
                        : ""
                        }`}
                    >
                      <div className={`w-full h-full ${option.preview}`} />
                      {selectedGradient === option.value && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <Check className="w-4 h-4 text-white drop-shadow-sm" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {selectedType === "image" && (
                <div className="p-8 rounded-xl border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                  {user.image ? "현재 프로필 이미지를 사용 중입니다." : "등록된 프로필 이미지가 없습니다."}
                </div>
              )}
            </div>
          </section>

          {/* Memo Stats Section */}
          <section className="space-y-4 opacity-0 slide-up" style={{ animationDelay: "50ms", animationFillMode: 'forwards' }}>
            <h2 className="text-sm font-medium text-muted-foreground">메모 정보</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <History className="w-3.5 h-3.5 mr-1.5" />
                  최근 메모
                </div>
                <p className="text-sm font-medium">{memoCounts?.recent ?? 0}개</p>
              </div>
              <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <FileText className="w-3.5 h-3.5 mr-1.5" />
                  보관함
                </div>
                <p className="text-sm font-medium">{memoCounts?.archived ?? 0}개</p>
              </div>
              <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  휴지통
                </div>
                <p className="text-sm font-medium">{memoCounts?.deleted ?? 0}개</p>
              </div>
              <div className="p-4 rounded-xl border bg-popover/50 flex flex-col justify-center space-y-1">
                <div className="flex items-center text-xs text-muted-foreground mb-2">
                  <CloudDownload className="w-3.5 h-3.5 mr-1.5" />
                  공유된 메모
                </div>
                <p className="text-sm font-medium">{memoCounts?.shared ?? 0}개</p>
              </div>
            </div>
          </section>

          {/* Legal Info Section */}
          <section className="space-y-4 opacity-0 slide-up" style={{ animationDelay: "200ms", animationFillMode: 'forwards' }}>
            <h2 className="text-sm font-medium text-muted-foreground">서비스 정보</h2>
            <div className="rounded-xl border overflow-hidden divide-y divide-border bg-popover/50">
              <Link href="/terms" className="group flex items-center justify-between p-4 hover:bg-muted-foreground/5">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="text-sm font-medium">이용약관</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-50 group-hover:opacity-100" />
              </Link>
              <Link href="/privacy" className="group flex items-center justify-between p-4 hover:bg-muted-foreground/5">
                <div className="flex items-center">
                  <Lock className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="text-sm font-medium">개인정보 처리방침</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-50 group-hover:opacity-100" />
              </Link>
              <div className="flex items-center justify-between p-4 bg-muted/10">
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="text-sm font-medium">현재 버전</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground">BETA</span>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="space-y-4 opacity-0 slide-up" style={{ animationDelay: "250ms", animationFillMode: 'forwards' }}>
            <h2 className="text-sm font-medium text-muted-foreground">문의</h2>
            <div className="rounded-xl border overflow-hidden divide-y divide-border bg-popover/50">
              <Link href="/contact" className="group flex items-center justify-between p-4 hover:bg-muted-foreground/5">
                <div className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-3 text-muted-foreground" />
                  <span className="text-sm font-medium">문의하기</span>
                </div>
                <ChevronLeft className="w-4 h-4 text-muted-foreground rotate-180 opacity-50 group-hover:opacity-100" />
              </Link>
            </div>
          </section>

          {/* Account Actions Section */}
          <section className="flex flex-col space-y-2 opacity-0 slide-up" style={{ animationDelay: "300ms", animationFillMode: 'forwards' }}>
            <button
              onClick={() => signOut()}
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-1 py-2 w-full text-left"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center text-sm font-medium text-destructive/80 hover:text-destructive transition-colors px-1 py-2 w-full text-left"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              계정 삭제
            </button>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}