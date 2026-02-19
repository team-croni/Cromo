import { DEFAULT_AVATAR_GRADIENT } from "@constants/avatar-gradients";
import Image from "next/image";

interface UserAvatarProps {
  userId?: string;
  userName?: string;
  userImage?: string;
  avatarColor?: string;
  avatarType?: "gradient" | "solid" | "image";
  size?: "xs" | "sm" | "md" | "lg";
  showBorder?: boolean;
}

export function UserAvatar({
  userId,
  userName,
  userImage,
  avatarColor,
  avatarType,
  size = "md",
  showBorder = true
}: UserAvatarProps) {
  const finalAvatarColor = avatarColor || DEFAULT_AVATAR_GRADIENT;
  const finalAvatarType = avatarType || "gradient";

  const sizeClasses = {
    xs: "w-6.5 h-6.5",
    sm: "w-7 h-7",
    md: "w-8.5 h-8.5",
    lg: "w-12 h-12"
  };

  // 사용자 이미지가 있고 명시적으로 image 타입을 설정한 경우 이미지로 표시
  if (userImage && finalAvatarType === "image") {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative ${showBorder ? 'border-2 border-background' : ''}`}>
        <Image
          src={userImage}
          alt={userName || "User"}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  // 아바타 타입에 따른 스타일 결정
  const getAvatarStyle = () => {
    if (finalAvatarType === "gradient") {
      return `bg-gradient-to-br ${finalAvatarColor}`;
    } else if (finalAvatarType === "solid") {
      return `bg-${finalAvatarColor || "secondary"}`;
    } else {
      // Fallback for unknown types
      return `bg-gradient-to-br ${DEFAULT_AVATAR_GRADIENT}`;
    }
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full ${getAvatarStyle()} flex items-center justify-center ${showBorder ? 'border-2 border-background' : ''}`} />
  );
}