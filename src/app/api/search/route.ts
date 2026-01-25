import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/embeddingUtils';
import { Memo } from '@/types';

// 1. 타입 정의
interface SearchResult extends Memo {
  distance: number;
  searchType: string;
  textMatchCount?: number;
}

// 2. 텍스트 일치 빈도 계산 (정렬 우선순위용)
const calculateTextMatchCount = (item: any, query: string): number => {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = (item.title || "").toLowerCase();
  const lowerContent = (item.content || "").toLowerCase();

  const titleMatches = (lowerTitle.match(new RegExp(lowerQuery, 'g')) || []).length;
  const contentMatches = (lowerContent.match(new RegExp(lowerQuery, 'g')) || []).length;

  return titleMatches + contentMatches;
};

// 3. 오타 보정을 위한 유사 단어 추출 (pg_trgm 활용)
async function getSuggestedQuery(userId: string, query: string): Promise<string | null> {
  try {
    // 단어 유사도를 계산하기 위해 입력된 쿼리와 가장 유사한 단어를 찾습니다.
    // similarity 함수 대신 부분 일치를 사용합니다.
    const suggestions = await prisma.$queryRaw<{ word: string; similarity_score: number }[]>`
      SELECT 
        word,
        CASE 
          WHEN word ILIKE ${`%${query}%`} THEN 1
          WHEN word ILIKE ${`%${query.substring(0, query.length - 1)}%`} THEN 0.8
          WHEN word ILIKE ${`%${query.substring(0, query.length - 2)}%`} THEN 0.6
          WHEN word ILIKE ${`%${query.substring(0, query.length - 3)}%`} THEN 0.4
          ELSE 0.2
        END as similarity_score
      FROM (
        SELECT title as word FROM "Memo" WHERE "userId" = ${userId} AND "isDeleted" = false
        UNION
        SELECT t.name as word FROM "Tag" t
        JOIN "_MemoToTag" mt ON t.id = mt."B"
        JOIN "Memo" m ON mt."A" = m.id
        WHERE m."userId" = ${userId} AND m."isDeleted" = false
      ) AS words
      WHERE 
        word ILIKE ${`%${query}%`} OR 
        word ILIKE ${`%${query.substring(0, query.length - 1)}%`} OR 
        word ILIKE ${`%${query.substring(0, query.length - 2)}%`} OR 
        word ILIKE ${`%${query.substring(0, query.length - 3)}%`}
      ORDER BY similarity_score DESC, LENGTH(word)
      LIMIT 1
    `;

    if (suggestions.length > 0 && suggestions[0].word.toLowerCase() !== query.toLowerCase()) {
      return suggestions[0].word;
    }
    return null;
  } catch (e) {
    console.error("Suggestion error:", e);
    return null;
  }
}

// 4. 핵심 하이브리드 검색 함수
async function performHybridSearch(userId: string, searchQuery: string) {
  // 4-1. 임베딩 생성
  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(searchQuery);
  } catch (e) {
    queryEmbedding = null;
  }

  const embeddingArrayString = queryEmbedding ? `[${queryEmbedding.join(',')}]` : null;
  const DISTANCE_THRESHOLD = 1.2;

  // 4-2. 벡터(메모/태그) 및 텍스트 검색 병렬 실행
  // 사용자에게 공유된 메모 ID들을 조회
  const sharedMemoIds = await prisma.userSharedMemo.findMany({
    where: {
      userId: {
        not: userId
      },
      memo: {
        isDeleted: false,
        shareToken: {
          not: null
        }
      }
    },
    select: {
      memoId: true
    }
  });

  const sharedMemoIdList = sharedMemoIds.map(item => item.memoId);

  const [memoSimilar, tagSimilar, textSearch] = await Promise.all([
    embeddingArrayString
      ? prisma.$queryRaw<SearchResult[]>`
        SELECT 
          m.id, m.title, m.content, m."createdAt", m."updatedAt", 
          m."folderId", m."userId", m."isArchived", m."isDeleted",
          m.embedding <-> ${embeddingArrayString}::vector AS distance, 
          'memo' AS "searchType",
          COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) FROM "Tag" t JOIN "_MemoToTag" mt ON t.id = mt."B" WHERE mt."A" = m.id), '[]') AS "tags"
        FROM "Memo" m 
        WHERE (m."userId" = ${userId} OR m.id = ANY(${sharedMemoIdList}::text[])) AND m."isDeleted" = false AND m.embedding IS NOT NULL
          AND (m.embedding <-> ${embeddingArrayString}::vector) <= ${DISTANCE_THRESHOLD}
        ORDER BY distance ASC LIMIT 20`
      : Promise.resolve([]),

    embeddingArrayString
      ? prisma.$queryRaw<SearchResult[]>`
        SELECT 
          m.id, m.title, m.content, m."createdAt", m."updatedAt", 
          m."folderId", m."userId", m."isArchived", m."isDeleted",
          m."tagEmbedding" <-> ${embeddingArrayString}::vector AS distance, 
          'tag' AS "searchType",
          COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) FROM "Tag" t JOIN "_MemoToTag" mt ON t.id = mt."B" WHERE mt."A" = m.id), '[]') AS "tags"
        FROM "Memo" m 
        WHERE (m."userId" = ${userId} OR m.id = ANY(${sharedMemoIdList}::text[])) AND m."isDeleted" = false AND m."tagEmbedding" IS NOT NULL
          AND (m."tagEmbedding" <-> ${embeddingArrayString}::vector) <= ${DISTANCE_THRESHOLD}
        ORDER BY distance ASC LIMIT 20`
      : Promise.resolve([]),

    prisma.$queryRaw<SearchResult[]>`
    SELECT 
      m.id, m.title, m.content, m."createdAt", m."updatedAt", 
      m."folderId", m."userId", m."isArchived", m."isDeleted",
      0.0 AS distance, 'text' AS "searchType",
      COALESCE((SELECT json_agg(json_build_object('id', t.id, 'name', t.name)) FROM "Tag" t JOIN "_MemoToTag" mt ON t.id = mt."B" WHERE mt."A" = m.id), '[]') AS "tags"
    FROM "Memo" m 
    WHERE (m."userId" = ${userId} OR m.id = ANY(${sharedMemoIdList}::text[])) AND m."isDeleted" = false
      AND (m.title ILIKE ${`%${searchQuery}%`} OR m.content ILIKE ${`%${searchQuery}%`})
    ORDER BY m."updatedAt" DESC LIMIT 20`
  ]);

  // 4-3. 결과 중복 제거 및 가중치 정렬
  const uniqueResultsMap = new Map<string, SearchResult>();

  [...memoSimilar, ...tagSimilar, ...textSearch].forEach(result => {
    const existing = uniqueResultsMap.get(result.id);
    // 더 짧은 거리(높은 유사도)를 가진 결과로 유지
    if (!existing || result.distance < existing.distance) {
      uniqueResultsMap.set(result.id, {
        ...result,
        textMatchCount: calculateTextMatchCount(result, searchQuery)
      });
    }
  });

  return Array.from(uniqueResultsMap.values()).sort((a, b) => {
    // 1순위: 텍스트 일치 횟수 (정확도)
    if (a.textMatchCount !== b.textMatchCount) return (b.textMatchCount || 0) - (a.textMatchCount || 0);
    // 2순위: 벡터 거리 (유사도)
    if (a.distance !== b.distance) return a.distance - b.distance;
    // 3순위: 최신순
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

// 5. 메인 API 핸들러
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const userId = session.user.id;

    // 단계 1: 원본 검색어로 검색 수행
    let finalResults = await performHybridSearch(userId, query);
    let correction = null;

    // 단계 2: 검색 결과가 매우 적거나(2개 미만) 없을 때 오타 보정 로직 가동
    if (finalResults.length < 2) {
      correction = await getSuggestedQuery(userId, query);

      // 만약 결과가 0개인데 보정 제안어가 있다면, 제안어로 자동 검색 수행
      if (correction && finalResults.length === 0) {
        finalResults = await performHybridSearch(userId, correction);
      }
    }

    // 단계 3. 결과 반환
    return NextResponse.json({
      results: finalResults,
      correction: correction, // 클라이언트에서 "혹시 ~를 찾으셨나요?" 표시용
      originalQuery: query,
      count: finalResults.length
    }, { status: 200 });

  } catch (error) {
    console.error('Hybrid search error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}