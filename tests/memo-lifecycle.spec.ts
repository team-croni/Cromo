import { test, expect } from '@playwright/test';

/**
 * 메모 생명주기 E2E 테스트
 * 
 * 테스트 구조 가이드:
 * - 각 테스트는 독립적으로 실행됩니다 (test.beforeEach에서 로그인)
 * - test.afterEach에서 생성된 테스트 메모를 자동 정리합니다
 * - 시나리오 흐름: 생성 → 각 기능 테스트 → 정리 (afterEach)
 */
test.describe('Memo Lifecycle E2E', () => {
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@cromo.site';
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'cromo1234';

  // ========== 헬퍼 함수 ==========

  /** 컨텍스트 메뉴 닫기 */
  const closeContextMenu = async (page: any) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  };

  /** 탭 이동 (컨텍스트 메뉴 닫기 포함) */
  const navigateToTab = async (page: any, tabName: '최근 메모' | '보관함' | '휴지통') => {
    await page.locator(`nav >> text=${tabName}`).click();
    const tabMap: Record<string, RegExp> = {
      '최근 메모': /tab=recent/,
      '보관함': /tab=archived/,
      '휴지통': /tab=trash/,
    };
    await page.waitForURL(tabMap[tabName]).catch(() => { });
    await closeContextMenu(page);
    // 메모 리스트가 로드될 때까지 잠시 대기
    await page.waitForSelector('[data-testid="memo-item"]').catch(() => { });
    await page.waitForTimeout(1000);
  };

  /** 메모 생성 */
  const createMemo = async (page: any, title: string) => {
    const createButton = page.getByText('새로운 메모 추가').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const titleInput = page.locator('input[placeholder="제목 없음"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);

    await expect(page.locator('text=저장 완료')).toBeVisible();
    // API 응답 대기
    await page.waitForTimeout(1000);
  };

  /** 메모 아이템 찾기 */
  const getMemoItem = (page: any, title: string) => {
    return page.getByTestId('memo-item').filter({ hasText: title });
  };

  /** 컨텍스트 메뉴에서 액션 버튼 클릭 */
  const clickContextMenuAction = async (page: any, buttonText: string) => {
    const button = page.locator(`[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("${buttonText}")`).first();
    await expect(button).toBeVisible();
    await button.click({ force: true });
  };

  /** 메모를 휴지통으로 이동 */
  const moveToTrash = async (page: any, title: string) => {
    const memoItem = getMemoItem(page, title);
    await memoItem.click({ button: 'right' });
    await clickContextMenuAction(page, '휴지통으로 이동');
    // API 응답 대기 및 메모가 기존 리스트에서 사라지는 것을 확인
    await expect(memoItem).not.toBeVisible(); // Wait for the memo to disappear
  };

  /** 메모를 영구 삭제 */
  const permanentlyDelete = async (page: any, title: string) => {
    const memoItem = getMemoItem(page, title);
    await memoItem.click({ button: 'right' });

    // 대화상자 리스너 설정
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await clickContextMenuAction(page, '영구 삭제');
    await page.waitForTimeout(300);
  };

  // ========== 테스트 전후 처리 ==========

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');

    // Wait for the login form to be visible
    await expect(page.locator('input[type="email"]')).toBeVisible();

    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    // 로그인 후 메인 페이지(/memo)로 이동할 때까지 대기
    await page.waitForURL(/\/memo/);

    // 컨텍스트 메뉴가 열려있을 수 있으므로 닫기
    await closeContextMenu(page);
  });

  // 테스트 종료 후 정리: 생성된 테스트 메모들 삭제
  test.afterEach(async ({ page }) => {
    const testPatterns = [
      /^Archive_E2E_/,
      /^Trash_E2E_/,
      /^Selection_E2E_/,
    ];

    try {
      // 페이지 상태가 불안정할 수 있으니 직접 URL로 이동
      await page.goto('/memo?tab=recent', { timeout: 5000 }).catch(() => { });
      await closeContextMenu(page);

      // 메모 아이템이 로드될 때까지 잠시 대기
      await page.waitForSelector('[data-testid="memo-item"]', { timeout: 5000 }).catch(() => { });

      const allMemos = await page.getByTestId('memo-item').all();

      for (const memo of allMemos) {
        await closeContextMenu(page);

        const text = await memo.textContent().catch(() => '');
        if (text && testPatterns.some(pattern => pattern.test(text))) {
          try {
            await memo.click({ button: 'right' }).catch(() => { });
            await clickContextMenuAction(page, '휴지통으로 이동');

            await page.goto('/memo?tab=trash', { timeout: 5000 }).catch(() => { });
            await closeContextMenu(page);

            const trashItem = page.getByTestId('memo-item').filter({ hasText: text });
            if (await trashItem.count() > 0) {
              await trashItem.click({ button: 'right' }).catch(() => { });

              page.on('dialog', async dialog => {
                await dialog.accept();
              });

              await clickContextMenuAction(page, '영구 삭제');
              await page.waitForTimeout(300);

              await page.goto('/memo?tab=recent', { timeout: 5000 }).catch(() => { });
            }
          } catch (e) {
            continue;
          }
        }
      }
    } catch (e) {
      // 정리 중 오류가 발생해도 테스트 실패로 간주하지 않음
    }
  });

  // ========== 테스트 시나리오 ==========

  test('should create a memo and archive it', async ({ page }) => {
    const UNIQUE_TITLE = `Archive_E2E_${Date.now()}`;

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
    });

    await test.step('보관함으로 이동', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();

      // 우클릭으로 보관
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관하기');

      // 보관함에서 확인
      await navigateToTab(page, '보관함');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });

    await test.step('보관 해제', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관 해제');

      // 최근 메모에서 확인
      await navigateToTab(page, '최근 메모');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });
  });

  test('should create a memo and move to trash then restore', async ({ page }) => {
    const UNIQUE_TITLE = `Trash_E2E_${Date.now()}`;

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
    });

    await test.step('휴지통으로 이동', async () => {
      await navigateToTab(page, '휴지통');
      const initialTrashMemoCount = await page.getByTestId('memo-item').count();

      await navigateToTab(page, '최근 메모');
      await moveToTrash(page, UNIQUE_TITLE);

      await navigateToTab(page, '휴지통');
      await page.waitForFunction(
        ({ expectedCount }) => document.querySelectorAll('[data-testid="memo-item"]').length === expectedCount,
        { expectedCount: initialTrashMemoCount + 1 }
      );
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });

    await test.step('휴지통에서 복원', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '복원하기');

      await navigateToTab(page, '최근 메모');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });
  });

  test('should permanently delete a memo', async ({ page }) => {
    const UNIQUE_TITLE = `Delete_E2E_${Date.now()}`;

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
    });

    await test.step('휴지통으로 이동', async () => {
      await navigateToTab(page, '최근 메모');
      await moveToTrash(page, UNIQUE_TITLE);

      await navigateToTab(page, '휴지통');
      // 메모 로딩 대기
      await page.waitForTimeout(1000);
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });

    await test.step('영구 삭제', async () => {
      await navigateToTab(page, '휴지통');
      const initialTrashMemoCount = await page.getByTestId('memo-item').count();

      await permanentlyDelete(page, UNIQUE_TITLE);

      await page.waitForFunction(
        ({ expectedCount }) => document.querySelectorAll('[data-testid="memo-item"]').length === expectedCount,
        { expectedCount: initialTrashMemoCount - 1 }
      );
      await expect(getMemoItem(page, UNIQUE_TITLE).first()).not.toBeVisible();
    });
  });

  test('should use selection mode', async ({ page }) => {
    const UNIQUE_TITLE = `Selection_E2E_${Date.now()}`;

    await test.step('메모 생성', async () => {
      await createMemo(page, UNIQUE_TITLE);
    });

    await test.step('선택 모드 활성화', async () => {
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();

      // Shift+Click으로 선택 모드 활성화
      await memoItem.click({ modifiers: ['Shift'] });

      // 선택 모드 활성화 확인 (ellipsis 버튼이 숨겨지고 체크박스가 나타남)
      await expect(page.locator('button:has(.ellipsis-icon)').first()).toBeHidden();
    });

    await test.step('다중 선택', async () => {
      const otherMemos = page.getByTestId('memo-item').filter({ hasNotText: UNIQUE_TITLE });
      const otherMemo = otherMemos.first();

      if (await otherMemo.count() > 0) {
        await otherMemo.click({ modifiers: ['Control'] });
      }

      // 선택된 메모 수 확인
      const selectedMemos = await page.getByTestId('memo-item').all();
      let selectedCount = 0;
      for (const memo of selectedMemos) {
        const classes = await memo.getAttribute('class') || '';
        if (classes.includes('bg-popover') || classes.includes('bg-sidebar')) {
          selectedCount++;
        }
      }
      expect(selectedCount).toBeGreaterThanOrEqual(1);
    });

    await test.step('선택 해제', async () => {
      // Esc 키로 선택 모드 종료
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    });
  });
});
