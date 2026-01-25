import { Archive, CloudDownload, Trash2, LayoutGrid, History } from "lucide-react";

export const NAV_ITEMS = [
  {
    name: "탐색",
    href: "/memo",
    icon: LayoutGrid,
    requiresAuth: false,
  },
  {
    name: "최근 메모",
    href: "/memo?tab=recent",
    icon: History,
    requiresAuth: false,
  },
  {
    name: "보관함",
    href: "/memo?tab=archived",
    icon: Archive,
    requiresAuth: false,
  },
  {
    name: "공유된 메모",
    href: "/memo?tab=shared",
    icon: CloudDownload,
    requiresAuth: false,
  },
  {
    name: "휴지통",
    href: "/memo?tab=trash",
    icon: Trash2,
    requiresAuth: false,
  },

];