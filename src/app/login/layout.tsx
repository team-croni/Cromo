import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '로그인',
  description: 'Cromo에 로그인하여 AI와 함께 메모를 관리하고 공유하세요.',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
