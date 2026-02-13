import { MemoLayoutClient } from "@components/layout/main-layout-client";
import { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { htmlToPlainText } from '@/utils/htmlToPlainText';
import { getSessionUser } from '@/lib/server-utils';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ id?: string, search?: string }> }): Promise<Metadata> {
  const { id, search } = await searchParams;

  if (!id && !search) return { title: { absolute: 'Cromo' } };

  // 검색어가 있고 메모 선택이 안 된 경우
  if (search && !id) {
    return {
      title: `'${search}'에 대한 검색 결과`,
      description: `'${search}'에 대한 검색 결과입니다.`
    };
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

    const memo = await prisma.memo.findFirst({
      where: isUUID ? { id } : { shareToken: id },
      select: { title: true, content: true, liveShareMode: true, isLiveShareEnabled: true, userId: true }
    });

    if (!memo) return { title: '메모를 찾을 수 없습니다' };

    // 권한 확인: 공개 메모이거나 소유자인 경우에만 제목 노출
    let isOwner = false;
    try {
      const user = await getSessionUser();
      isOwner = memo.userId === user.id;
    } catch (e) {
      // 비인증 사용자
    }

    const isPublic = memo.isLiveShareEnabled && memo.liveShareMode === 'public';

    if (!isPublic && !isOwner) {
      return {
        title: '비공개 메모',
        description: '이 메모에 접근할 권한이 없습니다.'
      };
    }

    const description = memo.content
      ? htmlToPlainText(memo.content).substring(0, 160).replace(/\n/g, ' ')
      : 'Cromo와 함께하는 스마트한 메모 관리';

    return {
      title: memo.title,
      description,
      openGraph: {
        title: `${memo.title} | Cromo`,
        description,
        images: ["/images/hero-screenshot1.png"],
      },
      twitter: {
        card: "summary_large_image",
        title: memo.title,
        description,
        images: ["/images/hero-screenshot1.png"],
      }
    };
  } catch (error) {
    return { title: '메모' };
  }
}

export default async function MemoPage({ searchParams }: { searchParams: Promise<{ id?: string, search?: string }> }) {
  const { id } = await searchParams;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cromo.site";

  const jsonLd: any[] = [];

  // 기본 브레드크럼 추가
  jsonLd.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "메모",
        "item": `${baseUrl}/memo`
      }
    ]
  });

  if (id) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const memo = await prisma.memo.findFirst({
        where: isUUID ? { id } : { shareToken: id },
        select: { title: true, content: true, updatedAt: true, createdAt: true, userId: true, liveShareMode: true, isLiveShareEnabled: true, user: { select: { name: true } } }
      });

      if (memo) {
        let isOwner = false;
        try {
          const user = await getSessionUser();
          isOwner = memo.userId === user.id;
        } catch (e) { }

        const isPublic = memo.isLiveShareEnabled && memo.liveShareMode === 'public';

        if (isPublic || isOwner) {
          // Article 데이터 추가
          jsonLd.push({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": memo.title,
            "description": memo.content ? htmlToPlainText(memo.content).substring(0, 160).replace(/\n/g, ' ') : '',
            "datePublished": memo.createdAt.toISOString(),
            "dateModified": memo.updatedAt.toISOString(),
            "author": {
              "@type": "Person",
              "name": memo.user?.name || 'Cromo User'
            }
          });

          // 브레드크럼에 현재 메모 추가
          (jsonLd[0] as any).itemListElement.push({
            "@type": "ListItem",
            "position": 3,
            "name": memo.title,
            "item": `${baseUrl}/memo?id=${id}`
          });
        }
      }
    } catch (error) {
      // Ignore
    }
  }

  return (
    <>
      {jsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <MemoLayoutClient />
    </>
  );
}
