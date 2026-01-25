import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from '@lib/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
      return NextResponse.json([]);
    }

    const userId = session.user.id;

    // 접두사 일치 우선순위를 고려하면서 제목과 태그를 결합한 단일 쿼리
    const suggestions = await prisma.$queryRaw<{ text: string; type: string }[]>`
      WITH matched_items AS (
        SELECT DISTINCT 
          title as text, 
          'title' as type,
          CASE 
            WHEN title ILIKE ${`${query}%`} THEN 1
            ELSE 2 
          END as priority
        FROM "Memo"
        WHERE "userId" = ${userId} 
          AND "isDeleted" = false 
          AND title ILIKE ${`%${query}%`}
        
        UNION ALL
        
        SELECT DISTINCT 
          t.name as text, 
          'tag' as type,
          CASE 
            WHEN t.name ILIKE ${`${query}%`} THEN 1
            ELSE 2 
          END as priority
        FROM "Tag" t
        JOIN "_MemoToTag" mt ON t.id = mt."B"
        JOIN "Memo" m ON mt."A" = m.id
        WHERE m."userId" = ${userId} 
          AND m."isDeleted" = false
          AND t.name ILIKE ${`%${query}%`}
      )
      
      SELECT text, type
      FROM matched_items
      ORDER BY priority, text
      LIMIT 10
    `;

    return NextResponse.json(suggestions);
  } catch (error) {
    console.error('Autocomplete error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}