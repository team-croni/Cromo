import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보 처리방침',
  description: 'Cromo의 개인정보 처리방침을 확인하세요.',
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
