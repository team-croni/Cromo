import { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cromo.site'

  // 정적 페이지 정의
  const staticPages = [
    '',
    '/login',
    '/contact',
    '/privacy',
    '/terms',
    '/cookies',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // 공개적으로 공유된 메모들 조회 (shareToken이 있고 liveShareMode가 public인 경우)
  try {
    const sharedMemos = await prisma.memo.findMany({
      where: {
        shareToken: { not: null },
        liveShareMode: 'public',
        isDeleted: false,
      },
      select: {
        shareToken: true,
        updatedAt: true,
      },
      take: 1000, // 대규모 서비스의 경우 페이지네이션이 필요할 수 있으나 현재는 1000개로 제한
    })

    const sharedMemoRoutes = sharedMemos.map((memo) => ({
      url: `${baseUrl}/shared/${memo.shareToken}`,
      lastModified: memo.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    return [...staticPages, ...sharedMemoRoutes]
  } catch (error) {
    // 에러 발생 시 정적 페이지라도 반환
    console.error('사이트맵 생성 중 오류 발생:', error)
    return staticPages
  }
}
