'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

/**
 * 세션 상태를 모니터링하는 컴포넌트
 * 세션 만료 시 자동 리다이렉트는 NextAuth 미들웨어에서 처리되므로,
 * 이 컴포넌트는 단순히 상태만 감시합니다.
 */
export default function SessionExpirationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // 세션 상태 변화를 콘솔에 기록 (디버깅용)
    console.log('Session status changed:', status);

    // 세션이 만료되었을 경우의 처리는 NextAuth 미들웨어에서 자동으로 처리되므로
    // 여기서 추가적인 타이머나 리다이렉트 로직은 불필요함
  }, [status, session]);

  return <>{children}</>;
}