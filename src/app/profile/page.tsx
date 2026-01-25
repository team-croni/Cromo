"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useEffect } from "react";
import { UserAvatar } from "@components/ui/user-avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { DEFAULT_AVATAR_GRADIENT, AVATAR_GRADIENT_OPTIONS } from "@/constants/avatar-gradients";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { user, updateUser } = useUser();
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [selectedGradient, setSelectedGradient] = useState(user?.avatarColor || DEFAULT_AVATAR_GRADIENT);
  const [selectedType, setSelectedType] = useState<"gradient" | "solid" | "image">(user?.avatarType || "gradient");

  useEffect(() => {
    if (user) {
      setSelectedGradient(user.avatarColor || DEFAULT_AVATAR_GRADIENT);
      setSelectedType(user.avatarType || "gradient");
    }
  }, [user]);

  // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // 로딩 중이거나 인증 중인 경우 로딩 표시
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSaveAvatar = async () => {
    try {
      await updateUser({
        avatarColor: selectedGradient,
        avatarType: selectedType
      });
      setIsEditingAvatar(false);
    } catch (error) {
      console.error("Failed to update avatar:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      {/* 사용자 정보 섹션 */}
      <div className="bg-card p-6 rounded-lg border mb-6">
        <h2 className="text-xl font-semibold mb-4">User Profile</h2>
        {session?.user && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              <p className="mt-1">{session.user.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{session.user.email}</p>
            </div>
          </div>
        )}
      </div>

      {/* 아바타 설정 섹션 */}
      <div className="bg-card p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Avatar Settings</h2>
          {!isEditingAvatar ? (
            <Button onClick={() => setIsEditingAvatar(true)} variant="outline">
              Edit Avatar
            </Button>
          ) : (
            <div className="space-x-2">
              <Button onClick={handleSaveAvatar} variant="default">
                Save
              </Button>
              <Button onClick={() => setIsEditingAvatar(false)} variant="outline">
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* 아바타 미리보기 */}
        <div className="flex items-center space-x-4 mb-6">
          <UserAvatar
            userName={user?.name || session?.user?.name || undefined}
            userImage={user?.image || session?.user?.image || undefined}
            avatarColor={user?.avatarColor}
            avatarType={user?.avatarType}
            size="lg"
          />
          <div>
            <h3 className="font-medium">Current Avatar</h3>
            <p className="text-sm text-muted-foreground">
              {user?.avatarType === "gradient" ? "Gradient" :
                user?.avatarType === "solid" ? "Solid Color" : "Image"}
            </p>
          </div>
        </div>

        {isEditingAvatar && (
          <div className="space-y-6">
            {/* 아바타 타입 선택 */}
            <div>
              <label className="text-sm font-medium mb-3 block">Avatar Type</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedType("gradient")}
                  className={`p-3 rounded-lg border text-center transition-colors ${selectedType === "gradient"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                    }`}
                >
                  <div className={`w-8 h-8 ${AVATAR_GRADIENT_OPTIONS[0].preview} rounded-full mx-auto mb-2`}></div>
                  <span className="text-sm">Gradient</span>
                </button>
                <button
                  onClick={() => setSelectedType("solid")}
                  className={`p-3 rounded-lg border text-center transition-colors ${selectedType === "solid"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                    }`}
                >
                  <div className="w-8 h-8 bg-blue-500 rounded-full mx-auto mb-2"></div>
                  <span className="text-sm">Solid</span>
                </button>
                <button
                  onClick={() => setSelectedType("image")}
                  className={`p-3 rounded-lg border text-center transition-colors ${selectedType === "image"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-accent"
                    }`}
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <span className="text-xs">IMG</span>
                  </div>
                  <span className="text-sm">Image</span>
                </button>
              </div>
            </div>

            {/* 그라데이션 색상 선택 */}
            {selectedType === "gradient" && (
              <div>
                <label className="text-sm font-medium mb-3 block">Choose Gradient</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_GRADIENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedGradient(option.value)}
                      className={`p-2 rounded-lg border transition-colors ${selectedGradient === option.value
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className={`w-full h-8 rounded ${option.preview} mb-1`}></div>
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 미리보기 */}
            <div>
              <label className="text-sm font-medium mb-3 block">Preview</label>
              <div className="flex items-center space-x-4 p-4 bg-accent/50 rounded-lg">
                <UserAvatar
                  userName={user?.name || session?.user?.name || undefined}
                  userImage={user?.image || session?.user?.image || undefined}
                  avatarColor={selectedGradient}
                  avatarType={selectedType}
                  size="lg"
                />
                <div>
                  <p className="font-medium">How it will look</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedType === "gradient" ? "Gradient style" :
                      selectedType === "solid" ? "Solid color style" : "Profile image"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}