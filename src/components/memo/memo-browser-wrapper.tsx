"use client";

import { MemoBrowser } from "@components/memo/memo-browser";

export function MemoBrowserWrapper() {

  return (
    <div className="relative h-full flex flex-col z-35">
      <MemoBrowser />
    </div>
  );
}
