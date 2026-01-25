"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { UserInfo } from '@/types';
import { useSocket } from '@/hooks/useSocket';

type SocketContextType = {
  socket: Socket | null;
  effectiveIsConnected: boolean;
  isConnected: boolean;
  isLiveShareDisabled: boolean;
  connectionFailed: boolean;
  existingUsers: UserInfo[];
  joinMemoRoom: (memoId: string) => void;
  leaveMemoRoom: (memoId: string) => void;
  sendMemoContentChange: (data: { memoId: string; content: string; title: string; cursorPosition?: any }) => void;
  sendCursorMove: (data: { memoId: string; position: any; userSocketId: string }) => void;
  sendOwnerLiveShareSettings: (data: { memoId: string; settings: any }) => void;
  sendOwnerLiveShareDisabled: (data: { memoId: string }) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback: (...args: any[]) => void) => void;
};

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);

  const {
    socket,
    effectiveIsConnected,
    isConnected,
    isLiveShareDisabled,
    connectionFailed,
    existingUsers,
    joinMemoRoom,
    leaveMemoRoom,
    sendMemoContentChange,
    sendCursorMove,
    sendOwnerLiveShareDisabled,
    sendOwnerLiveShareSettings,
    on,
    off
  } = useSocket();

  // 소켓 인스턴스가 변경될 때 상태 업데이트
  useEffect(() => {
    setSocketInstance(socket);
  }, [socket]);

  // 컨텍스트 값 구성
  const contextValue: SocketContextType = {
    socket: socketInstance,
    effectiveIsConnected,
    isConnected,
    isLiveShareDisabled,
    connectionFailed,
    existingUsers,
    joinMemoRoom,
    leaveMemoRoom,
    sendMemoContentChange,
    sendCursorMove,
    sendOwnerLiveShareDisabled,
    sendOwnerLiveShareSettings,
    on,
    off
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}