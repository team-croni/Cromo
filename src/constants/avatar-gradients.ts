// 아바타 그라데이션 상수 및 설정
export const DEFAULT_AVATAR_GRADIENT = "from-purple-600 via-pink-600 to-rose-600";

// 8가지 몽환적인 3색 그라데이션 옵션들
export const AVATAR_GRADIENT_OPTIONS = [
  {
    value: "from-purple-600 via-pink-600 to-rose-600",
    label: "Mystical Bloom",
    preview: "bg-gradient-to-br from-purple-600 via-pink-600 to-rose-600"
  },
  {
    value: "from-indigo-600 via-cyan-600 to-blue-600",
    label: "Ocean Dream",
    preview: "bg-gradient-to-br from-indigo-600 via-cyan-600 to-blue-600"
  },
  {
    value: "from-violet-600 via-purple-600 to-indigo-600",
    label: "Cosmic Flow",
    preview: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600"
  },
  {
    value: "from-emerald-600 via-teal-600 to-cyan-600",
    label: "Forest Mist",
    preview: "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
  },
  {
    value: "from-amber-600 via-orange-600 to-red-600",
    label: "Sunset Ember",
    preview: "bg-gradient-to-br from-amber-600 via-orange-600 to-red-600"
  },
  {
    value: "from-fuchsia-600 via-pink-600 to-rose-600",
    label: "Magical Garden",
    preview: "bg-gradient-to-br from-fuchsia-600 via-pink-600 to-rose-600"
  },
  {
    value: "from-sky-600 via-blue-600 to-indigo-600",
    label: "Sky Painter",
    preview: "bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-600"
  },
  {
    value: "from-lime-600 via-green-600 to-emerald-600",
    label: "Nature's Glow",
    preview: "bg-gradient-to-br from-lime-600 via-green-600 to-emerald-600"
  }
];

// 그라데이션 타입
export type AvatarGradient = {
  value: string;
  label: string;
  preview: string;
};

// 그라데이션 관련 유틸리티 함수들
export const getGradientPreview = (gradientValue: string): string => {
  const option = AVATAR_GRADIENT_OPTIONS.find(opt => opt.value === gradientValue);
  return option ? option.preview : `bg-gradient-to-br ${gradientValue}`;
};

export const getGradientLabel = (gradientValue: string): string => {
  const option = AVATAR_GRADIENT_OPTIONS.find(opt => opt.value === gradientValue);
  return option ? option.label : "Custom Gradient";
};

export const isValidGradient = (gradientValue: string): boolean => {
  return AVATAR_GRADIENT_OPTIONS.some(opt => opt.value === gradientValue);
};