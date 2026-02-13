import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용 약관',
  description: 'Cromo의 서비스 이용 약관을 확인하세요.',
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
