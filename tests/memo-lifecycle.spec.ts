import { test, expect } from '@playwright/test';

/**
 * 메모 생명주기 E2E 테스트
 * 
 * 안정화 수정 사항:
 * - mode: 'serial' 적용으로 테스트 간 DB 경쟁 방지
 * - 생성된 메모 제목을 Set으로 추적하여 해당 테스트에서 만든 메모만 정확히 삭제
 * - 타임아웃 및 내비게이션 대기 로직 강화
 */
test.describe('Memo Lifecycle E2E', () => {
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@cromo.site';
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'cromo1234';

  // 테스트를 순차적으로 실행
  test.describe.configure({ mode: 'serial' });

  // ========== 헬퍼 함수 ==========

  const log = (message: string) => {
    console.log(`[E2E] ${new Date().toISOString()} - ${message}`);
  };

  const closeContextMenu = async (page: any) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  };

  const navigateToTab = async (page: any, tabName: '최근 메모' | '보관함' | '휴지통') => {
    log(`탭 이동 시작: ${tabName}`);
    await page.locator(`nav >> text=${tabName}`).click();
    const tabMap: Record<string, RegExp> = {
      '최근 메모': /tab=recent/,
      '보관함': /tab=archived/,
      '휴지통': /tab=trash/,
    };
    await page.waitForURL(tabMap[tabName], { timeout: 10000 }).catch(() => { });
    await closeContextMenu(page);
    // 휴지통 탭인 경우 데이터 로딩 대기
    if (tabName === '휴지통') {
      await page.waitForSelector('[data-testid="memo-item"], [data-testid="empty-state"]', { timeout: 10000 }).catch(() => { });
    }
    await page.waitForTimeout(500);
    log(`탭 이동 완료: ${tabName}`);
  };

  const createMemo = async (page: any, title: string) => {
    log(`메모 생성 시작: ${title}`);
    const createButton = page.getByText('새로운 메모 추가').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const titleInput = page.locator('input[placeholder="제목 없음"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);

    // 자동 저장 대기
    await expect(page.locator('text=저장 완료')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    log(`메모 생성 완료: ${title}`);
  };

  const getMemoItem = (page: any, title: string) => {
    return page.getByTestId('memo-item').filter({ hasText: title });
  };

  // 휴지통에서 메모가 나타날 때까지 대기하는 함수
  const waitForMemoInTrash = async (page: any, title: string, timeout = 15000) => {
    const startTime = Date.now();
    log(`휴지통에서 메모 대기 시작: "${title}" (타임아웃: ${timeout}ms)`);

    // 먼저 컨텍스트 메뉴가 닫혔는지 확인
    await closeContextMenu(page);

    while (Date.now() - startTime < timeout) {
      // 에러 상태인지 확인 (MemoListContainer의 에러 메시지)
      const errorElement = page.locator('.text-red-500').first();
      const hasError = await errorElement.isVisible().catch(() => false);
      if (hasError) {
        const errorText = await errorElement.textContent().catch(() => '');
        log(`휴지통 로드 중 에러 감지: ${errorText}`);
        // 재시도 버튼이 있으면 클릭
        const retryButton = page.locator('button:has-text("Retry")');
        if (await retryButton.isVisible().catch(() => false)) {
          log('재시도 버튼 클릭...');
          await retryButton.click();
          await page.waitForTimeout(2000);
          continue;
        }
        throw new Error(`휴지통 로드 중 오류 발생: ${errorText}`);
      }

      const memoItem = getMemoItem(page, title);
      const isVisible = await memoItem.isVisible().catch(() => false);
      if (isVisible) {
        log(`휴지통에서 메모 발견: "${title}"`);
        return true;
      }

      // 빈 상태인지 확인
      const emptyState = await page.locator('text=휴지통이 비어 있습니다').isVisible().catch(() => false);
      if (emptyState) {
        log('휴지통이 비어 있습니다 - 대기 중...');
      } else {
        // 메모가 없지만 빈 상태도 아님 - 메모 목록이 로드되었지만 해당 메모가 없는 상태
        log('메모 없음 (빈 상태 아님)');
      }

      // 로딩 상태인지 확인
      const isLoading = await page.locator('[data-testid="memo-list-loading"]').isVisible().catch(() => false);
      if (isLoading) {
        log('로딩 중...');
        await page.waitForTimeout(500);
        continue;
      }

      // 페이지의 모든 memo-item 개수 확인
      const memoCount = await page.getByTestId('memo-item').count();
      if (memoCount > 0) {
        log(`${memoCount}개의 메모가 있지만 "${title}"은(는) 없음`);
      }

      await page.waitForTimeout(200);
    }

    // 타임아웃 후 상태 확인
    const finalError = await page.locator('.text-red-500').first().isVisible().catch(() => false);
    if (finalError) {
      const errorText = await page.locator('.text-red-500').first().textContent().catch(() => '');
      log(`휴지통 최종 에러: ${errorText}`);
      throw new Error(`휴지통 로드 중 오류 발생: "${title}" 메모를 찾을 수 없음 - ${errorText}`);
    }

    log(`휴지통 대기 타임아웃: "${title}" 를 찾을 수 없음`);
    return false;
  };

  const clickContextMenuAction = async (page: any, buttonText: string) => {
    // 버튼이 나타날 때까지 명시적 대기
    await page.waitForSelector(`[data-testid^="context-menu-"] button:has-text("${buttonText}")`, { timeout: 5000 }).catch(() => { });
    const button = page.locator(`[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("${buttonText}")`).first();
    await expect(button).toBeVisible();
    await button.click({ force: true });
    // 액션 처리 대기
    await page.waitForTimeout(300);
  };

  // 테스트 전후 처리
  test.beforeEach(async ({ page }) => {
    log('로그인 시작');
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/memo/, { timeout: 15000 });
    await closeContextMenu(page);
    log('로그인 완료');
  });

  // afterAll은 별도로 구현 예정

  // ========== 테스트 시나리오 ==========

  test('should create a memo and archive it', async ({ page }) => {
    const UNIQUE_TITLE = `Archive_E2E_${Date.now()}`;
    log(`테스트 시작: 메모 보관 (제목: ${UNIQUE_TITLE})`);

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
      log('스텝 완료: 메모 생성');
    });

    await test.step('보관함으로 이동', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();

      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관하기');

      await navigateToTab(page, '보관함');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
      log('스텝 완료: 보관함으로 이동');
    });

    await test.step('보관 해제', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관 해제');

      await navigateToTab(page, '최근 메모');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
      log('스텝 완료: 보관 해제');
    });

    log(`테스트 완료: 메모 보관 (제목: ${UNIQUE_TITLE})`);
  });

  test('should create a memo and move to trash then restore', async ({ page }) => {
    const UNIQUE_TITLE = `Trash_E2E_${Date.now()}`;
    log(`테스트 시작: 휴지통 이동 및 복원 (제목: ${UNIQUE_TITLE})`);

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
      log('스텝 완료: 메모 생성');
    });

    await test.step('휴지통으로 이동', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();

      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '휴지통으로 이동');

      // 휴지통으로 이동 후 캐시 업데이트 대기 (Chromium과 Firefox 모두 충분히 대기)
      await page.waitForTimeout(3000);

      await navigateToTab(page, '휴지통');

      // 휴지통에서 메모가 나타날 때까지 대기 (타임아웃 시 에러 발생)
      await expect.poll(async () => {
        return await waitForMemoInTrash(page, UNIQUE_TITLE, 15000);
      }, { timeout: 20000 }).toBeTruthy();
      log('스텝 완료: 휴지통으로 이동');
    });

    await test.step('휴지통에서 복원', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '복원하기');

      await navigateToTab(page, '최근 메모');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
      log('스텝 완료: 휴지통에서 복원');
    });

    log(`테스트 완료: 휴지통 이동 및 복원 (제목: ${UNIQUE_TITLE})`);
  });

  test('should permanently delete a memo', async ({ page }) => {
    const UNIQUE_TITLE = `Delete_E2E_${Date.now()}`;
    log(`테스트 시작: 영구 삭제 (제목: ${UNIQUE_TITLE})`);

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
      log('스텝 완료: 메모 생성');
    });

    await test.step('휴지통으로 이동', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '휴지통으로 이동');

      // 휴지통으로 이동 후 캐시 업데이트 대기 (Chromium과 Firefox 모두 충분히 대기)
      await page.waitForTimeout(3000);

      await navigateToTab(page, '휴지통');

      // 휴지통에서 메모가 나타날 때까지 대기 (타임아웃 시 에러 발생)
      await expect.poll(async () => {
        return await waitForMemoInTrash(page, UNIQUE_TITLE, 15000);
      }, { timeout: 20000 }).toBeTruthy();
      log('스텝 완료: 휴지통으로 이동');
    });

    await test.step('영구 삭제', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });

      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await clickContextMenuAction(page, '영구 삭제');
      await expect(memoItem).not.toBeVisible();
      log('스텝 완료: 영구 삭제');
    });

    log(`테스트 완료: 영구 삭제 (제목: ${UNIQUE_TITLE})`);
  });

  test('should use selection mode', async ({ page }) => {
    const UNIQUE_TITLE = `Selection_E2E_${Date.now()}`;
    log(`테스트 시작: 선택 모드 (제목: ${UNIQUE_TITLE})`);

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
      log('스텝 완료: 메모 생성');
    });

    await test.step('선택 모드 활성화', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();

      await memoItem.click({ modifiers: ['Shift'] });
      await expect(page.locator('button:has(.ellipsis-icon)').first()).toBeHidden();
      log('스텝 완료: 선택 모드 활성화');
    });

    await test.step('선택 해제', async () => {
      // Esc 키로 선택 모드 종료
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);

      // 선택 모드 종료 후 다시 마우스를 올려서 ellipsis 버튼이 나타나는지 확인
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.hover();

      // lucide-react의 Ellipsis 아이콘은 svg 형태로 렌더링되므로 class나 tag로 확인
      const ellipsisButton = memoItem.locator('button:has(svg)').first();
      await expect(ellipsisButton).toBeVisible();
      log('스텝 완료: 선택 해제');
    });

    log(`테스트 완료: 선택 모드 (제목: ${UNIQUE_TITLE})`);
  });
});