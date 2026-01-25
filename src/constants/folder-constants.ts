// Folder 관련 상수들을 공통으로 관리하는 파일

// 사용 가능한 아이콘들 (UI에서 지원하는 모든 아이콘)
export const AVAILABLE_ICONS = [
  // 가장 자주 사용되는 기본 아이콘들
  'Folder', 'FolderOpen', 'FileText', 'Tag', 'Hash', 'Bookmark', 'Star', 'Lightbulb', 'Target', 'Archive', 'Book', 'Code',
  // 메모 관련
  'StickyNote', 'BookOpen', 'Library', 'Files', 'HardDrive',
  // 자주 사용되는 폴더 작업
  'Save', 'Edit', 'Notebook',
  // 기타 유용한 아이콘
  'AtSign', 'Phone', 'MapPin', 'Navigation',
  'AlarmClock', 'ExternalLink', 'Download', 'Upload', 'Trash',
  'CircleQuestionMark',
  // 유틸리티
  'Search', 'Filter', 'Share', 'Link', 'Copy',
  // 상태/정보
  'CheckCircle', 'Info', 'AlertCircle', 'HelpCircle',
  // 정렬/구성
  'List', 'Grid3X3', 'Layers',
  // 시간/일정
  'Calendar', 'Clock', 'Timer', 'History', 'Watch',
  // 즐겨찾기/별표
  'Heart', 'BookmarkPlus', 'BookmarkCheck', 'HeartHandshake',
  // 공유/연결
  'Users', 'Send', 'Mail',
  // 데이터/저장
  'Database', 'Inbox', 'ArchiveRestore',
  // 루트 폴더
  'FolderRoot'
];

// 사용 가능한 색상들 (UI에서 지원하는 모든 색상)
export const AVAILABLE_COLORS = [
  { name: 'gray', class: 'bg-gray-500', textClass: 'text-gray-500', label: '그레이' },
  { name: 'red', class: 'bg-red-500', textClass: 'text-red-500', label: '빨강' },
  { name: 'orange', class: 'bg-orange-500', textClass: 'text-orange-500', label: '오렌지' },
  { name: 'yellow', class: 'bg-yellow-500', textClass: 'text-yellow-500', label: '노랑' },
  { name: 'green', class: 'bg-green-500', textClass: 'text-green-500', label: '초록' },
  { name: 'blue', class: 'bg-blue-500', textClass: 'text-blue-500', label: '파랑' },
  { name: 'indigo', class: 'bg-indigo-500', textClass: 'text-indigo-500', label: '인디고' },
  { name: 'purple', class: 'bg-purple-500', textClass: 'text-purple-500', label: '보라' },
  { name: 'pink', class: 'bg-pink-500', textClass: 'text-pink-500', label: '핑크' },
  { name: 'cyan', class: 'bg-cyan-500', textClass: 'text-cyan-500', label: '시안' },
  { name: 'teal', class: 'bg-teal-500', textClass: 'text-teal-500', label: '틸' },
  { name: 'emerald', class: 'bg-emerald-500', textClass: 'text-emerald-500', label: '에메랄드' },
];

// 색상 이름에서 해당하는 Tailwind 색상 클래스 찾기
export const getTextColorClass = (colorName: string): string => {
  const color = AVAILABLE_COLORS.find(c => c.name === colorName);
  return color?.textClass || 'text-gray-500';
};

// AI용 아이콘 리스트 (문자열 배열)
export const AVAILABLE_ICON_NAMES = AVAILABLE_ICONS.map(icon => icon);

// AI용 색상 리스트 (문자열 배열)
export const AVAILABLE_COLOR_NAMES = AVAILABLE_COLORS.map(color => color.name);