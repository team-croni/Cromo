import { ChevronRight } from "lucide-react";
import { UserAvatar } from "@components/ui/user-avatar";
import { useRemoteCursors } from "@hooks/useRemoteCursors";
import { useCursorPosition } from "@hooks/useCursorPosition";
import { useEditorStore } from "@/store/editorStore";
import { useEffect, useState } from "react";

export function RemoteCursors() {
  const {
    groupedRemoteCursors,
    getUserInfo
  } = useRemoteCursors();

  const { getCursorCoords, getSelectionRects } = useCursorPosition();
  const { currentEditor } = useEditorStore();

  // Add state to track when editor content is updating
  const [isEditorUpdating, setIsEditorUpdating] = useState(false);

  // Track editor transaction updates to delay cursor rendering
  useEffect(() => {
    if (currentEditor) {
      const handleTransaction = () => {
        setIsEditorUpdating(true);
        // Reset the flag after a brief moment to allow for editor to settle
        setTimeout(() => setIsEditorUpdating(false), 30);
      };

      currentEditor.on('transaction', handleTransaction);

      return () => {
        currentEditor.off('transaction', handleTransaction);
      };
    }
  }, [currentEditor]);

  const cursorGroups = Object.values(groupedRemoteCursors);

  return (
    <>
      {cursorGroups.map((cursorGroup, groupIndex) => {
        // Only display if cursor group is not empty
        if (cursorGroup.length === 0) return null;

        const firstCursor = cursorGroup[0];

        // For null positions, we don't render anything
        if (!firstCursor.position) {
          return null;
        }

        // Calculate cursor coordinates
        const coords = getCursorCoords(firstCursor.position.anchor);

        if (!coords) {
          return null;
        }

        const { left: caretLeft, top: caretTop, height: caretHeight } = coords;

        // Calculate selection rects
        let selectionRects: { left: number; top: number; width: number; height: number }[] = [];
        if (firstCursor.position.head !== undefined && firstCursor.position.head !== firstCursor.position.anchor) {
          selectionRects = getSelectionRects(firstCursor.position.anchor, firstCursor.position.head);
        }

        return (
          <div key={groupIndex}>
            {/* Selection highlight for remote users */}
            {selectionRects.length > 0 && (
              <>
                {selectionRects.map((rect, index) => (
                  <div
                    key={index}
                    className="absolute bg-white/10 rounded-sm select-none z-1"
                    style={{
                      left: `${rect.left}px`,
                      top: `${rect.top}px`,
                      width: `${rect.width}px`,
                      height: `${rect.height}px`,
                    }}
                  />
                ))}
              </>
            )}
            <div
              className="absolute w-0.5 bg-primary rounded-full transition-all ease-out duration-50 select-none scale-y-115 z-10 pointer-events-none"
              style={{
                left: `${caretLeft}px`,
                top: `${caretTop}px`,
                height: `${caretHeight}px`,
              }}
            />
            <div
              className="absolute flex items-center left-3 top-0 text-right -translate-x-full transition-all ease-out duration-50 text-xs select-none z-10"
              style={{
                top: `${caretTop}px`,
                height: `${caretHeight}px`,
              }}
            >
              <div className="flex -space-x-2 mr-1">
                {cursorGroup.map((cursor, index) => {
                  const userInfo = getUserInfo(cursor.userId);
                  return userInfo?.name && (
                    <UserAvatar
                      key={`${cursor.userSocketId}-${index}`}
                      size="xs"
                      userName={userInfo?.name || "U"}
                      userImage={userInfo?.image || undefined}
                      avatarColor={userInfo?.avatarColor}
                      avatarType={userInfo?.avatarType}
                    />
                  );
                })}
              </div>
              <ChevronRight className="w-5 h-5 stroke-1.5 text-primary/80" />
            </div>
          </div>
        );
      })}
    </>
  );
}