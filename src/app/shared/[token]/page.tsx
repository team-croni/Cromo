import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { htmlToPlainText } from '@/utils/htmlToPlainText';

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;

  try {
    const memo = await prisma.memo.findUnique({
      where: { shareToken: token },
      select: { title: true, content: true, isLiveShareEnabled: true, liveShareMode: true }
    });

    if (!memo || !memo.isLiveShareEnabled || memo.liveShareMode !== 'public') {
      return {
        title: '접근 제한된 메모',
        description: '존재하지 않거나 비공개로 설정된 메모입니다.'
      };
    }

    const description = memo.content
      ? htmlToPlainText(memo.content).substring(0, 160).replace(/\n/g, ' ')
      : 'Cromo에서 공유된 스마트 메모입니다.';

    return {
      title: memo.title,
      description,
      openGraph: {
        title: `${memo.title} | Cromo`,
        description,
        type: 'article',
        images: [
          {
            url: "/images/logo-card.png",
            width: 1200,
            height: 630,
            alt: memo.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: memo.title,
        description,
        images: ["/images/logo-card.png"],
      }
    };
  } catch (error) {
    return {
      title: '공유 메모',
      description: 'Cromo에서 공유된 메모를 확인하세요.'
    };
  }
}

export default async function SharedMemoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  redirect(`/memo?id=${token}`);
}