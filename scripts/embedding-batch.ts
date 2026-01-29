#!/usr/bin/env tsx

// 환경변수 로드 (선택적)
try {
  const { config } = require('dotenv');
  const { resolve } = require('path');

  // .env.local 파일 우선, 없으면 .env 파일 로드
  const envPath = resolve(process.cwd(), '.env.local');
  const envFallback = resolve(process.cwd(), '.env');
  config({ path: envPath });
  config({ path: envFallback, override: false });
} catch (e) {
  // dotenv가 없어도 계속 진행 (환경변수가 이미 설정되어 있을 수 있음)
}

import embeddingService from '../src/services/embeddingService';
import tagService from '../src/services/tagService';

const command = process.argv[2] || 'all';
const forceFlag = process.argv.includes('--force') || process.argv.includes('-f');

async function runMemoEmbedding(force: boolean = false) {
  if (force) {
    console.log('🔄 메모 임베딩 강제 재생성 시작...\n');
  } else {
    console.log('📝 메모 임베딩 일괄 처리 시작...\n');
  }

  try {
    const result = force
      ? await embeddingService.forceRegenerateEmbeddings()
      : await embeddingService.processBatchEmbeddings(2);

    console.log('✅ 메모 임베딩 처리 완료!');
    console.log(`   - 전체 메모: ${result.totalCount}개`);
    console.log(`   - 성공: ${result.successCount}개`);
    console.log(`   - 업데이트: ${result.updatedCount}개\n`);

    // 카테고리(태그) 자동 생성 처리
    let tagResult = 0;
    try {
      console.log('🏷️  메모 임베딩 처리 후 카테고리(태그) 자동 생성 시작...\n');
      const tagService = (await import('../src/services/tagService')).default;

      // 태그가 업데이트되지 않은 메모들을 가져와 카테고리 할당
      const prisma = (await import('../src/lib/db/prisma')).prisma;
      const memosToProcess = await prisma.memo.findMany({
        where: {
          isDeleted: false,
          isTagsUpToDate: false,
        },
        take: 5, // 한 번에 처리할 메모 수 제한
      });

      if (memosToProcess.length > 0) {
        await tagService.assignTaggingToMemosAsync(memosToProcess);
        tagResult = memosToProcess.length;
        console.log(`✅ ${memosToProcess.length}개 메모에 대한 카테고리(태그) 자동 생성 처리 완료!\n`);
      } else {
        console.log('처리할 메모가 없습니다.\n');
      }
    } catch (error) {
      console.error('카테고리(태그) 자동 생성 처리 중 오류 발생:', error);
    }

    // 메모 임베딩 처리 후 태그 임베딩도 함께 처리
    // 카테고리 자동 생성 이후에 태그 임베딩을 처리하여 최신 태그 정보 반영
    let tagEmbeddingResult = null;
    if (force) {
      console.log('🏷️  카테고리 생성 후 태그 임베딩 강제 재생성 시작...\n');
      tagEmbeddingResult = await runTagEmbedding(force);
    } else {
      console.log('🏷️  카테고리 생성 후 태그 임베딩 일괄 처리 시작...\n');
      tagEmbeddingResult = await runTagEmbedding(force);
    }

    return { memoResult: result, tagResult, tagEmbeddingResult };
  } catch (error) {
    console.error('❌ 메모 임베딩 처리 실패:', error);
    throw error;
  }
}

async function runTagEmbedding(force: boolean = false) {
  if (force) {
    console.log('🔄 태그 임베딩 강제 재생성 시작...\n');
  } else {
    console.log('🏷️  태그 임베딩 일괄 처리 시작...\n');
  }

  try {
    const result = force
      ? await tagService.forceRegenerateTagEmbeddings()
      : await tagService.processBatchTagEmbeddings();

    console.log('✅ 태그 임베딩 처리 완료!');
    console.log(`   - 전체 메모: ${result.totalCount}개`);
    console.log(`   - 성공: ${result.successCount}개\n`);

    return result;
  } catch (error) {
    console.error('❌ 태그 임베딩 처리 실패:', error);
    throw error;
  }
}

async function runAllEmbeddings(force: boolean = false) {
  if (force) {
    console.log('🔄 모든 임베딩 강제 재생성 시작...\n');
  } else {
    console.log('🚀 모든 임베딩 일괄 처리 시작...\n');
  }

  const startTime = Date.now();
  let memoResult = null;
  let tagResult = null;

  // 메모 임베딩 처리 (내부적으로 카테고리 생성 및 태그 임베딩도 수행)
  try {
    const results = await runMemoEmbedding(force);
    memoResult = results.memoResult;
    tagResult = results.tagResult;
  } catch (error) {
    console.error('메모 임베딩 처리 중 오류 발생:', error);
  }

  const duration = Date.now() - startTime;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 처리 결과 요약');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`총 처리 시간: ${duration}ms`);
  console.log(`전체 처리된 메모: ${(memoResult?.totalCount || 0) + (tagResult?.totalCount || 0)}개`);
  console.log(`성공한 임베딩: ${(memoResult?.successCount || 0) + (tagResult?.successCount || 0)}개`);
  console.log(`업데이트된 메모: ${memoResult?.updatedCount || 0}개`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('   임베딩 일괄 처리 도구');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    switch (command) {
      case 'memo':
      case 'content':
        await runMemoEmbedding(forceFlag);
        break;
      case 'tag':
      case 'tags':
        await runTagEmbedding(forceFlag);
        break;
      case 'all':
        await runAllEmbeddings(forceFlag);
        break;
      default:
        console.log('사용법:');
        console.log('  npm run embedding:memo          - 메모 내용 기반 임베딩 처리 + 태그 임베딩 생성 + 카테고리(태그) 자동 생성');
        console.log('  npm run embedding:tag           - 태그 기반 임베딩만 처리');
        console.log('  npm run embedding:all           - 메모 및 태그 임베딩 + 카테고리(태그) 자동 생성');
        console.log('  npm run embedding:force:memo    - 메모 내용 기반 임베딩 강제 재생성 + 태그 임베딩 생성 + 카테고리(태그) 자동 생성');
        console.log('  npm run embedding:force:tag     - 태그 기반 임베딩 강제 재생성');
        console.log('  npm run embedding:force:all     - 메모 및 태그 임베딩 + 카테고리(태그) 자동 생성 강제 처리\n');
        process.exit(1);
    }

    console.log('✨ 모든 작업이 완료되었습니다!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  }
}

main();
