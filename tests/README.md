# 테스트 가이드

이 디렉토리는 Cromo 프로젝트의 테스트 파일을 포함합니다.

## 테스트 실행 방법

```bash
# E2E 테스트 실행
pnpm test:e2e     # tests/ 디렉토리의 모든 테스트

# 단위 테스트 실행
pnpm test:unit     # 모든 단위 테스트

# 단위 테스트 & E2E 테스트 실행
pnpm test          # 모든 테스트
```

## 테스트 환경 설정

### 환경 변수

UI 로그인 E2E 테스트를 실행하려면 `.env` 파일에 다음 환경 변수를 설정해야 합니다:

```env
TEST_USER_EMAIL="test email"
TEST_USER_PASSWORD="test password"
```

## CI/CD

GitHub Actions에서 테스트가 자동으로 실행됩니다. 설정은 [.github/workflows/ci.yml](../.github/workflows/ci.yml)에서 확인할 수 있습니다.
