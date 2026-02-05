export type Memo = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  folderId: string | null;
  folder: {
    id: string;
    name: string;
  } | null;
  tags?: Tag[];        // 태그 배열 추가
  isArchived?: boolean; // 보관 여부 추가
  isDeleted?: boolean;  // 삭제 여부 추가
  deletedAt?: string;   // 삭제 시간 추가
  // Live Share 관련 필드 추가
  isLiveShareEnabled?: boolean;
  liveShareMode?: string; // "public" 또는 "private"
  liveSharePermission?: string; // "readOnly" 또는 "readWrite"
  allowedUsers?: string[];
  userId?: string; // 메모 소유자 ID
  user?: UserInfo; // 메모 소유자 정보
  // 공유 토큰 관련 필드 추가
  shareToken?: string;
  shareExpiresAt?: string;
  rrfScore?: number;
};

// 사용자 정보 타입 추가
export type UserInfo = {
  id: string;
  name: string;
  image: string | null;
  email: string;
  avatarColor?: string;
  avatarType?: "gradient" | "solid" | "image";
};

export type Folder = {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  order: number;
  children: Folder[];
  memos: {
    id: string;
    title: string;
  }[];
  createdAt: string;
  updatedAt: string;
  userId: string;
};

// 태그 타입 추가
export type Tag = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

// Type declaration for html-to-text module
export interface HtmlToTextSelector {
  selector: string;
  format?: string;
  options?: {
    ignoreHref?: boolean;
  };
}

export interface HtmlToTextOptions {
  wordwrap?: boolean | number;
  selectors?: HtmlToTextSelector[];
}

export declare function convertHtmlToText(html: string, options?: HtmlToTextOptions): string;

// Memo template type
export type MemoTemplate = {
  id: string;
  name: string;
  title: string;
  content: string;
};

export type FilterOptions = {
  showArchived: boolean;
  sortBy: 'updatedAt' | 'createdAt' | 'title' | 'relevance';
  sortDirection: 'asc' | 'desc';
  showLiveShareTop?: boolean;
  groupBy: 'none' | 'monthly';
  dateFrom?: string | null;
  dateTo?: string | null;
};

// Cursor position type for real-time collaboration
export type CursorPosition = {
  anchor: number; // ProseMirror position of anchor
  head?: number; // ProseMirror position of head (for selections)
} | null;