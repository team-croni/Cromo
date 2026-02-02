import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import { useSearchParams } from 'next/navigation';
import { debounce } from '@/utils/debounce';
import { Memo, UserInfo } from '@/types';
import { useSession } from 'next-auth/react';
import { useMemo } from '@/hooks/useMemo';
import { useQueryClient } from '@tanstack/react-query';

let socket: Socket | null = null;
// 이벤트 리스너 등록 상태를 추적하기 위한 Set
const registeredListeners = new Set<string>();

// 디바운싱된 메모 내용 변경 이벤트 전송 함수
const debouncedSendMemoContentChange = debounce((data: { memoId: string; content: string; title: string; cursorPosition?: any }) => {
  if (socket) {
    socket.emit('memo-content-change', data);
  }
}, 50);

// 디바운싱된 커서 위치 변경 이벤트 전송 함수
const debouncedSendCursorMove = debounce((data: { memoId: string; position: any; userSocketId: string }) => {
  if (socket) {
    socket.emit('cursor-move', data);
  }
}, 50);

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLiveShareDisabled, setIsLiveShareDisabled] = useState(false);
  const [existingUsers, setExistingUsers] = useState<UserInfo[]>([]);
  const [connectionFailed, setConnectionFailed] = useState(false);
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptsRef = useRef(0);
  const searchParams = useSearchParams();
  const urlMemoId = searchParams.get('id');
  const { data: session } = useSession();
  const { data: memoData } = useMemo();
  const queryClient = useQueryClient();
  const enableSocket = memoData?.isLiveShareEnabled;
  const maxReconnectAttempts = 3;
  // Live Share가 활성화된 경우에만 소켓 연결 상태를 사용
  const effectiveIsConnected = memoData?.isLiveShareEnabled ? isConnected : false;
  // memoData가 있으면 그 ID를 사용 (항상 UUID), 없으면 urlMemoId 사용
  const currentMemoId = memoData?.id || urlMemoId;

  // 소켓 연결 함수
  const connectSocket = () => {
    // 소켓이 이미 연결되어 있거나 소켓 연결이 비활성화된 경우 연결하지 않음
    if (socket || !enableSocket) {
      return socket;
    }

    // 소켓 서버 URL 설정 (환경변수 또는 기본값)
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (process.env.NODE_ENV === 'production'
      ? 'wss://your-socket-server-url' // Railway에서 배포한 소켓 서버 URL
      : 'http://localhost:3001' // 로컬 개발용
    );

    // 소켓 연결 (세션 정보 포함)
    socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      // 세션 정보를 쿼리 파라미터로 전달
      query: {
        userId: session?.user?.id || null
      },
      // 인증 토큰 전달 (필요시)
      auth: {
        token: session?.user?.id || null
      }
    });

    socket.on('connect', () => {
      console.log('소켓 연결 성공:', socket?.id);
      setIsConnected(true);
      setConnectionFailed(false); // 연결 성공 시 실패 상태 초기화
      reconnectAttemptsRef.current = 0;

      // 연결 시 owner-live-share-disabled 이벤트 리스너 등록
      if (socket) {
        socket.on('owner-live-share-disabled', handleOwnerLiveShareDisabled);
        const listenerKey = `${socket.id}-owner-live-share-disabled`;
        registeredListeners.add(listenerKey);

        // 방 입장 로직을 여기로 이동
        const currentMemoId = urlMemoId || memoData?.id;
        if (currentMemoId && enableSocket && !joinedRoomsRef.current.has(currentMemoId)) {
          joinMemoRoom(currentMemoId);
          setExistingUsers([]);
        }
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('소켓 연결 해제:', reason);
      setIsConnected(false);

      // 사용자가 참여한 모든 방에서 나가기 처리
      joinedRoomsRef.current.forEach(roomId => {
        socket?.emit('leave-memo-room', roomId);
      });
      joinedRoomsRef.current.clear();

      // 연결 실패 상태 초기화
      if (reason !== 'io client disconnect') { // 사용자에 의한 연결 해제가 아닐 경우
        setConnectionFailed(false);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('소켓 연결 오류:', error);
      setIsConnected(false);

      reconnectAttemptsRef.current += 1;
      if (reconnectAttemptsRef.current <= maxReconnectAttempts) {
        console.log(`연결 오류 후 재연결 시도 ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
        setTimeout(() => {
          if (socket) {
            socket.connect();
          }
        }, 1000);
      } else {
        console.log('최대 재연결 시도 횟수 초과');
        setConnectionFailed(true);
      }
    });

    // 기존 사용자 정보 수신 이벤트
    socket.on('existing-users-info', (data: { users: UserInfo[], memoId: string }) => {
      // 현재 세션 사용자를 제외한 사용자 목록으로 필터링
      const usersWithoutSelf = data.users.filter(user => user.id !== session?.user?.id);

      // 중복된 ID 제거를 위한 Set 사용
      const uniqueUsersMap = new Map<string, UserInfo>();
      usersWithoutSelf.forEach(user => {
        if (!uniqueUsersMap.has(user.id)) {
          uniqueUsersMap.set(user.id, user);
        }
      });

      // Map을 배열로 변환
      const uniqueUsers = Array.from(uniqueUsersMap.values());
      setExistingUsers(uniqueUsers);
    });

    // 사용자 참여 이벤트
    socket.on('user-joined', (data: { userId: string; memoId: string; userInfo: UserInfo }) => {
      // 현재 방의 기존 사용자 목록에 새로 참여한 사용자 추가
      setExistingUsers(prevUsers => {
        // 현재 세션 사용자인지 확인
        if (data.userInfo.id === session?.user?.id) {
          return prevUsers;
        }

        // 이미 존재하는 사용자인지 확인
        const userExists = prevUsers.some(user => user.id === data.userInfo.id);
        if (!userExists) {
          const newUsers = [...prevUsers, data.userInfo];

          // 중복 제거 (ID 기준)
          const uniqueUsersMap = new Map<string, UserInfo>();
          newUsers.forEach(user => {
            if (!uniqueUsersMap.has(user.id)) {
              uniqueUsersMap.set(user.id, user);
            }
          });

          return Array.from(uniqueUsersMap.values());
        }
        return prevUsers;
      });
    });

    // 사용자 퇴장 이벤트
    socket.on('user-left', (data: { userId: string; memoId: string; userInfo: UserInfo }) => {
      // 현재 방의 기존 사용자 목록에서 퇴장한 사용자 제거
      setExistingUsers(prevUsers =>
        prevUsers.filter(user => user.id !== data.userInfo.id)
      );
    });

    // Live Share 종료 이벤트
    socket.on('live-share-disabled', (data: { message: string }) => {
      console.log('Live Share가 종료되었습니다:', data.message);
      // 소켓 연결 해제
      if (socket) {
        socket.disconnect();
      }
      // 연결 상태 업데이트
      setIsConnected(false);
      // Live Share 종료 상태 업데이트
      setIsLiveShareDisabled(true);
      // 기존 사용자 목록 초기화
      setExistingUsers([]);
      // 메모 데이터 업데이트
      if (memoData?.shareToken) {
        queryClient.setQueryData<Memo>(['memo', memoData?.shareToken], (old: Memo | undefined) => old ? { ...old, isLiveShareEnabled: false } : undefined);
      }
    });

    // 소유자용 Live Share 종료 이벤트
    const handleOwnerLiveShareDisabled = (data: { message: string }) => {
      console.log('소유자로서 Live Share를 종료하셨습니다:', data.message);
      // 소켓 연결 해제
      if (socket) {
        socket.disconnect();
      }
      // 연결 상태 업데이트
      setIsConnected(false);
      // 기존 사용자 목록 초기화
      setExistingUsers([]);
    };

    // 강제 연결 해제 이벤트
    socket.on('force-disconnect', (data: { message: string }) => {
      console.log('강제 연결 해제:', data.message);
      // 소켓 연결 해제
      if (socket) {
        socket.disconnect();
      }
      // 연결 상태 업데이트
      setIsConnected(false);
      // 기존 사용자 목록 초기화
      setExistingUsers([]);
    });

    // 이벤트 리스너 등록
    socket.on('owner-live-share-disabled', handleOwnerLiveShareDisabled);

    return socket;
  };

  // 메모 방 참여 함수
  const joinMemoRoom = async (memoId: string) => {
    if (socket && enableSocket) {
      // 사용자 정보를 API를 통해 가져와서 전달
      let userInfo: UserInfo | null = null;

      if (session?.user) {
        try {
          // API를 통해 최신 사용자 정보 가져오기
          const response = await fetch('/api/user/profile');
          if (response.ok) {
            const userData = await response.json();
            userInfo = {
              id: userData.id,
              name: userData.name || `User ${userData.id.substring(0, 4)}`,
              email: userData.email || '',
              image: userData.image || null,
              avatarColor: userData.avatarColor,
              avatarType: userData.avatarType
            };
          } else {
            // API 호출 실패 시 세션 정보 사용
            userInfo = {
              id: session.user.id,
              name: session.user.name || `User ${session.user.id.substring(0, 4)}`,
              email: session.user.email || '',
              image: session.user.image || null,
              avatarColor: session.user.avatarColor || undefined,
              avatarType: session.user.avatarType || undefined
            };
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error);
          // 오류 발생 시 세션 정보 사용
          userInfo = {
            id: session.user.id,
            name: session.user.name || `User ${session.user.id.substring(0, 4)}`,
            email: session.user.email || '',
            image: session.user.image || null,
            avatarColor: session.user.avatarColor || undefined,
            avatarType: session.user.avatarType || undefined
          };
        }
      }

      try {
        socket.emit('join-memo-room', { memoId, userInfo });
        joinedRoomsRef.current.add(memoId);
      } catch (error) {
        console.error('메모 방 참여 실패:', error);
      }
    }
  };

  // 메모 방 나가기 함수
  const leaveMemoRoom = (memoId: string) => {
    if (socket) {
      socket.emit('leave-memo-room', memoId);
      joinedRoomsRef.current.delete(memoId);
    }
  };

  // 메모 내용 변경 이벤트 전송 함수 (디바운싱 적용)
  const sendMemoContentChange = (data: { memoId: string; content: string; title: string; cursorPosition?: any }) => {
    // 소켓이 연결되어 있고 연결이 활성화된 경우에만 전송
    if (socket && isConnected && enableSocket) {
      debouncedSendMemoContentChange(data);
    } else {
      console.warn('소켓이 연결되지 않아 메모 내용 변경 이벤트를 전송할 수 없습니다.');
    }
  };

  // 커서 위치 변경 이벤트 전송 함수 (디바운싱 적용)
  const sendCursorMove = (data: { memoId: string; position: any; userSocketId: string }) => {
    // 소켓이 연결되어 있고 연결이 활성화된 경우에만 전송
    if (socket && isConnected && enableSocket) {
      debouncedSendCursorMove(data);
    } else {
      console.warn('소켓이 연결되지 않아 커서 위치 변경 이벤트를 전송할 수 없습니다.');
    }
  };

  // 소유자 Live Share 종료 이벤트 전송 함수
  const sendOwnerLiveShareSettings = (data: { memoId: string; settings: any }) => {
    if (socket && isConnected && enableSocket) {
      console.log(socket, 'settings', data)
      // ACK 패턴을 사용하여 이벤트 전송 확인
      socket.emit('live-share-settings-changed', { memoId: data.memoId, settings: data.settings });
    } else {
      console.warn('소켓이 연결되지 않아 소유자 Live Share 종료 이벤트를 전송할 수 없습니다.');
    }
  };

  // 소유자 Live Share 종료 이벤트 전송 함수
  const sendOwnerLiveShareDisabled = (data: { memoId: string }) => {
    if (socket && isConnected && enableSocket) {
      socket.emit('owner-live-share-disabled', { memoId: data.memoId });

      // 소켓 연결 해제
      socket.disconnect();
    } else {
      console.warn('소켓이 연결되지 않아 소유자 Live Share 종료 이벤트를 전송할 수 없습니다.');
    }
  };

  // 소켓 이벤트 리스너 등록 함수
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket && enableSocket) {
      // 이미 등록된 이벤트인지 확인
      const listenerKey = `${socket.id}-${event}`;
      if (!registeredListeners.has(listenerKey)) {
        socket.on(event, callback);
        registeredListeners.add(listenerKey);
      } else {
        // 이미 등록된 경우에도 콜백 함수를 추가로 등록
        socket.on(event, callback);
      }
    }
  };

  // 소켓 이벤트 리스너 제거 함수
  const off = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  // 컴포넌트 마운트 시 소켓 연결
  useEffect(() => {
    if (enableSocket && !socket) {
      connectSocket();
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (socket) {
        // 언마운트 시 모든 방에서 나가기
        joinedRoomsRef.current.forEach(roomId => {
          if (socket) {
            socket.emit('leave-memo-room', roomId);
          }
        });
        joinedRoomsRef.current.clear();

        if (socket) {
          socket.disconnect();
        }
        socket = null;
      }
      reconnectAttemptsRef.current = 0;
      // 컴포넌트 언마운트 시 Live Share 종료 상태 초기화
      setIsLiveShareDisabled(false);
      // 이벤트 리스너 등록 상태 초기화
      registeredListeners.clear();
    };
  }, [enableSocket]);

  // 메모 ID가 변경될 때 방 참여/나가기 처리
  useEffect(() => {
    const currentMemoId = urlMemoId || memoData?.id;
    // memoId가 없거나 소켓이 연결되지 않았는데 방에 참여한 상태라면 나가기
    if ((!currentMemoId || !isConnected || !enableSocket) && joinedRoomsRef.current.size > 0) {
      joinedRoomsRef.current.forEach(roomId => {
        socket?.emit('leave-memo-room', roomId);
      });
      joinedRoomsRef.current.clear();
    }

    // memoId가 있고 소켓이 연결되었지만 이미 다른 방에 참여한 상태라면
    // 현재 참여 중인 방이 memoId와 다르면 방 변경
    if (currentMemoId && isConnected && enableSocket && joinedRoomsRef.current.size > 0) {
      const currentRoomId = Array.from(joinedRoomsRef.current)[0];
      if (currentRoomId !== currentMemoId) {
        // 현재 방에서 나가기
        socket?.emit('leave-memo-room', currentRoomId);
        joinedRoomsRef.current.delete(currentRoomId);

        // 새 방에 참여
        joinMemoRoom(currentMemoId);
        // 방에 참여할 때 기존 사용자 목록 초기화
        setExistingUsers([]);
      }
    }
  }, [urlMemoId, memoData?.id, isConnected, enableSocket]);

  return {
    socket,
    effectiveIsConnected,
    isConnected,
    isLiveShareDisabled,
    connectionFailed,
    existingUsers,
    setConnectionFailed,
    joinMemoRoom,
    leaveMemoRoom,
    sendMemoContentChange,
    sendCursorMove,
    sendOwnerLiveShareDisabled,
    sendOwnerLiveShareSettings,
    on,
    off
  };
};