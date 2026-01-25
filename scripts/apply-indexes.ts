import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function applyIndexes() {
  // 먼저 벡터 확장 기능 활성화
  const extensions = [
    `CREATE EXTENSION IF NOT EXISTS vector;`,
    `CREATE EXTENSION IF NOT EXISTS pg_trgm;`,
  ];

  for (const sql of extensions) {
    await prisma.$executeRawUnsafe(sql);
  }

  // embedding 열에 데이터가 있는지 확인
  const hasEmbeddingData = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "Memo" 
      WHERE "embedding" IS NOT NULL 
      LIMIT 1
    ) AS exists;
  `;

  // tagEmbedding 열에 데이터가 있는지 확인
  const hasTagEmbeddingData = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM "Memo" 
      WHERE "tagEmbedding" IS NOT NULL 
      LIMIT 1
    ) AS exists;
  `;

  // 인덱스 생성
  const sqls = [
    // 기존 인덱스 삭제
    `DROP INDEX IF EXISTS idx_memo_embedding;`,
    `DROP INDEX IF EXISTS idx_memo_tag_embedding;`,
  ];

  // embedding에 대한 HNSW 인덱스 생성 - 데이터가 있는 경우에만
  if (hasEmbeddingData[0].exists) {
    sqls.push(
      `CREATE INDEX IF NOT EXISTS idx_memo_embedding_hnsw ON "Memo" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);`
    );
  }

  // tagEmbedding에 대한 HNSW 인덱스 생성 - 데이터가 있는 경우에만
  if (hasTagEmbeddingData[0].exists) {
    sqls.push(
      `CREATE INDEX IF NOT EXISTS idx_memo_tag_embedding_hnsw ON "Memo" USING hnsw ("tagEmbedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);`
    );
  }

  // 나머지 인덱스는 항상 생성
  sqls.push(
    `CREATE INDEX IF NOT EXISTS idx_memo_title_trgm ON "Memo" USING gist (title gist_trgm_ops);`,
    `CREATE INDEX IF NOT EXISTS idx_tag_name_trgm ON "Tag" USING gist (name gist_trgm_ops);`,
    `CREATE INDEX IF NOT EXISTS idx_user_shared_memo_created_at ON "UserSharedMemo" ("createdAt" DESC);`
  );

  for (const sql of sqls) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ 인덱스 명령 실행 완료: ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`);
    } catch (error) {
      console.warn(`⚠️ 인덱스 명령 실행 실패 (계속 진행): ${sql.substring(0, 100)}${sql.length > 100 ? '...' : ''}`, error);
    }
  }
}

applyIndexes().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });