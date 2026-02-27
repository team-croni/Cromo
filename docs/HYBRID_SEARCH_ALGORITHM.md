# Cromo 하이브리드 검색 알고리즘 및 플로우

## 1. 개요

Cromo의 하이브리드 검색 시스템은 키워드 기반 검색과 의미 기반 검색을 결합하여 사용자가 정확한 키워드를 기억하지 못하더라도 원하는 메모를 찾을 수 있도록 설계되었습니다. 이 시스템은 `pg_trgm`을 이용한 텍스트 유사도 검색과 `pgvector`를 이용한 벡터 유사도 검색을 병렬로 수행하고, 동적 RRF(Reciprocal Rank Fusion) 알고리즘을 통해 결과를 결합합니다.

## 2. 백엔드 검색 알고리즘

### 2.1. API 엔드포인트

- **경로**: `/api/search`
- **메서드**: `POST`
- **요청 형식**: `{ query: string }`
- **응답 형식**: `{ results: SearchResult[], correction: string | null, originalQuery: string, count: number }`

### 2.2. 검색 처리 로직

`performHybridSearch` 함수는 다음 단계를 수행합니다:

1. **임베딩 생성**: OpenAI 또는 다른 임베딩 모델을 사용하여 검색어의 벡터 표현 생성
2. **병렬 검색 수행**:
   - **메모 벡터 검색**: 메모 내용의 임베딩과 검색어 임베딩 간 거리 계산
   - **태그 벡터 검색**: 메모 태그의 임베딩과 검색어 임베딩 간 거리 계산
   - **텍스트 검색**: PostgreSQL의 `pg_trgm`을 사용한 키워드 기반 검색
3. **결과 통합 및 중복 제거**: 거리 기반 중복 제거 및 텍스트 일치 빈도 계산
4. **정렬**: 텍스트 일치 횟수 → 벡터 거리 → 최신순으로 정렬

### 2.3. 오타 보정 로직

- 검색 결과가 2개 미만일 경우 `getSuggestedQuery` 함수를 호출
- PostgreSQL의 `ILIKE` 연산자를 사용하여 유사 단어 추출
- 유사 단어가 존재하면 다시 검색 수행

## 3. 검색 결과 정렬 및 랭킹 알고리즘

### 3.1. 텍스트 일치 빈도 계산

```typescript
const calculateTextMatchCount = (item: any, query: string): number => {
  const lowerQuery = query.toLowerCase();
  const lowerTitle = (item.title || "").toLowerCase();
  const lowerContent = (item.content || "").toLowerCase();

  const titleMatches = (lowerTitle.match(new RegExp(lowerQuery, "g")) || [])
    .length;
  const contentMatches = (lowerContent.match(new RegExp(lowerQuery, "g")) || [])
    .length;

  return titleMatches + contentMatches;
};
```

### 3.2. RRF(Reciprocal Rank Fusion) 알고리즘

```typescript
const calculateWeightedRRFScore = (rank: number, weight: number): number => {
  const RRF_K = 60;
  return weight * (1 / (rank + RRF_K));
};

const calculateHybridScore = (
  distance: number,
  rank: number,
  baseWeight: number
): number => {
  const RRF_K = 60;
  const MAX_DISTANCE = 2.0;
  const rankScore = calculateWeightedRRFScore(rank + 1, baseWeight);
  const distanceScore =
    Math.max(0, (MAX_DISTANCE - distance) / MAX_DISTANCE) * baseWeight;
  return rankScore + distanceScore;
};
```

### 3.3. 결과 분류 알고리즘

통계적으로 유의미한 점수 차이(점수 절벽)를 기준으로 결과를 두 그룹(high, low)으로 분류:

- 결과 점수 간 차이의 평균과 표준편차를 계산
- `mean + stdDev` 이상의 낙차가 있는 지점을 절벽으로 간주
- 절벽 이전의 결과는 high 그룹, 이후는 low 그룹으로 분류

## 4. 검색 최적화 전략

### 4.1. 인덱스 전략

- GIN 인덱스(키워드 검색)
- HNSW 인덱스(벡터 검색) 병행 사용

### 4.2. 거리 및 점수 임계값

- `DISTANCE_THRESHOLD`: 1.2 - 벡터 거리 기반 관련성 필터링
- `MIN_SCORE_THRESHOLD`: 0.02 - 최소 점수 이하의 결과는 필터링

### 4.3. 성능 최적화

- 병렬 처리: 텍스트 및 벡터 검색 병렬 실행
- 페이지네이션: 각 검색 유형당 최대 20개 결과 제한

## 5. 데이터 처리 플로우

```
1. 사용자 검색어 입력
2. 임베딩 생성
3. 병렬 검색 실행 (메모 벡터, 태그 벡터, 텍스트)
4. 결과 통합 및 중복 제거
5. RRF 알고리즘 적용하여 점수 계산
6. 점수 기준 정렬
7. 점수 절벽 기반 결과 분류 (high/low)
8. 최종 결과 반환
```

이 하이브리드 검색 알고리즘은 키워드 검색과 의미 기반 검색의 장점을 결합하여 사용자가 보다 정확하고 관련성 높은 검색 결과를 얻을 수 있도록 합니다.
