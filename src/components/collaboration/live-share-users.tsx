import { UserAvatar } from "@components/ui/user-avatar";
import { useSocketContext } from "@contexts/SocketContext";
import { Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { UserInfo } from "@/types";
import { useUser } from "@hooks/useUser";
import { useMemo } from '@hooks/useMemo';
import { Ring } from 'ldrs/react';
import { useErrorDisplayStore } from '@store/errorDisplayStore';
import CustomTooltip from "@components/ui/custom-tooltip";

export function LiveShareUsers() {
  const { data: session } = useSession();
  const { user: currentUser } = useUser(); // useUser 훅을 사용하여 캐시된 사용자 정보 가져오기
  const { existingUsers, effectiveIsConnected, socket, connectionFailed } = useSocketContext();
  const { data: memoData } = useMemo();
  const [otherUsers, setOtherUsers] = useState<UserInfo[]>(existingUsers);
  const { showError, hideError } = useErrorDisplayStore();

  // 다른 사용자 정보 업데이트 이벤트 리스너
  useEffect(() => {
    if (socket) {
      const handleUserAvatarUpdate = (updatedUserInfo: UserInfo) => {
        setOtherUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === updatedUserInfo.id ? updatedUserInfo : user
          )
        );
      };

      socket.on('user-avatar-updated', handleUserAvatarUpdate);

      return () => {
        socket.off('user-avatar-updated', handleUserAvatarUpdate);
      };
    }
  }, [socket]);

  // existingUsers가 변경될 때 otherUsers 상태도 업데이트
  useEffect(() => {
    setOtherUsers(existingUsers);
  }, [existingUsers]);

  // connectionFailed 상태 변화 감지
  useEffect(() => {
    if (connectionFailed) {
      // 연결 실패 시 에러 메시지 표시
      showError('소켓 연결에 실패했습니다. 네트워크 상태를 확인해주세요.', 'NETWORK_ERROR');
    } else {
      // 연결이 성공하거나 시도 중일 때는 에러 숨김
      hideError();
    }
  }, [connectionFailed, showError, hideError]);

  // 소켓 연결 상태 확인
  const isConnecting = memoData?.isLiveShareEnabled && !effectiveIsConnected;

  return (
    <div className="flex items-center gap-2">
      {(isConnecting || effectiveIsConnected) && !connectionFailed ? (
        <span className="px-2.5 py-1 border border-destructive/35 bg-transparent backdrop-blur-sm rounded-xl text-xs flex items-center mr-1.5">
          <span className="w-1.25 h-1.25 bg-destructive mr-2 rounded-full animate-pulse" />
          <span className="text-destructive">LIVE ON</span>
        </span>
      ) : (
        <span className="px-2.5 py-1 border bg-transparent backdrop-blur-sm rounded-xl text-xs flex items-center mr-1.5">
          <span className="w-1.25 h-1.25 bg-muted-foreground/70 rounded-full mr-2" />
          <span className="text-muted-foreground/70">LIVE OFF</span>
        </span>
      )}
      {isConnecting ?
        connectionFailed ?
          <span className="text-destructive text-xs">실시간 연결 실패</span>
          :
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2.5 opacity-50">
              <Ring
                size="16"
                speed="2"
                stroke={1.5}
                color="currentColor"
                bgOpacity={0.2}
              />
            </div>
            <span className="text-muted-foreground/70 text-xs">연결 중...</span>
          </div>
        : effectiveIsConnected && (
          <div className="flex items-center -space-x-2.5">
            {/* 현재 사용자 표시 */}
            <CustomTooltip message={`${currentUser?.name || session?.user?.name || "익명 사용자"} (${currentUser?.email || session?.user?.email || "이메일 없음"})`} hover={true} position="bottom" align="start">
              <UserAvatar
                size="sm"
                userName={currentUser?.name || session?.user?.name || ""}
                userImage={currentUser?.image || session?.user?.image || undefined}
                avatarColor={currentUser?.avatarColor}
                avatarType={currentUser?.avatarType}
              />
            </CustomTooltip>
            {/* 다른 참여자들 표시 */}
            {otherUsers.slice(0, 5).map((user) => (
              <CustomTooltip
                key={user.id}
                message={`${user.name} (${user.email})`}
                hover={true}
                position="bottom"
                align="start"
              >
                <UserAvatar
                  key={user.id}
                  size="sm"
                  userName={user.name}
                  userImage={user.image || undefined}
                  avatarColor={user.avatarColor}
                  avatarType={user.avatarType}
                />
              </CustomTooltip>
            ))}
            {/* 더 많은 참여자가 있는 경우 */}
            {otherUsers.length > 6 && (
              <div className="w-7.5 h-7.5 rounded-full bg-[#343454] flex items-center justify-center text-foreground/80 text-xs font-medium border-2 border-background select-none">
                +{otherUsers.length - 5}
              </div>
            )}
          </div>
        )}
      {effectiveIsConnected && (
        <div className="flex items-center text-muted-foreground/70 mx-1">
          <Users className="w-3.5 h-3.5 mr-2" />
          <span className="text-xs">
            {otherUsers.length + 1}
          </span>
        </div>
      )}
    </div>
  );
}