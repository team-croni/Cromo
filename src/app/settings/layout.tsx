import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '설정',
  description: '계정 설정 및 아바타 커스터마이징',
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
