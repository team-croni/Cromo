import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '쿠키 정책',
  description: 'Cromo의 쿠키 정책을 확인하세요.',
};

export default function CookiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
