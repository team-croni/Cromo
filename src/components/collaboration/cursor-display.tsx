import { RemoteCursors } from "@components/collaboration/remote-cursors";
import { CurrentCursor } from "@components/collaboration/current-cursor";

export function CursorDisplay() {
  return (
    <>
      <RemoteCursors />
      <CurrentCursor />
    </>
  );
}