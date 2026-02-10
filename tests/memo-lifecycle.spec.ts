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
  
  // 이 테스트 파일에서 생성된 메모 제목들을 추적
  const createdTitles = new Set<string>();

  // 테스트를 순차적으로 실행
  test.describe.configure({ mode: 'serial' });

  // ========== 헬퍼 함수 ==========

  const closeContextMenu = async (page: any) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  };

  const navigateToTab = async (page: any, tabName: '최근 메모' | '보관함' | '휴지통') => {
    await page.locator(`nav >> text=${tabName}`).click();
    const tabMap: Record<string, RegExp> = {
      '최근 메모': /tab=recent/,
      '보관함': /tab=archived/,
      '휴지통': /tab=trash/,
    };
    await page.waitForURL(tabMap[tabName], { timeout: 10000 }).catch(() => { });
    await closeContextMenu(page);
    await page.waitForTimeout(500);
  };

  const createMemo = async (page: any, title: string) => {
    createdTitles.add(title);
    const createButton = page.getByText('새로운 메모 추가').first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    const titleInput = page.locator('input[placeholder="제목 없음"]');
    await expect(titleInput).toBeVisible();
    await titleInput.fill(title);

    // 자동 저장 대기
    await expect(page.locator('text=저장 완료')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
  };

  const getMemoItem = (page: any, title: string) => {
    return page.getByTestId('memo-item').filter({ hasText: title });
  };

  const clickContextMenuAction = async (page: any, buttonText: string) => {
    const button = page.locator(`[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("${buttonText}")`).first();
    await expect(button).toBeVisible();
    await button.click({ force: true });
  };

  // ========== 테스트 전후 처리 ==========

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await page.fill('input[type="email"]', TEST_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_USER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/memo/, { timeout: 15000 });
    await closeContextMenu(page);
  });

  // 모든 테스트 종료 후 생성된 메모들 일괄 정리
  test.afterAll(async ({ browser }) => {
    if (createdTitles.size === 0) return;

    const page = await browser.newPage();
    try {
      await page.goto('/login');
      await page.fill('input[type="email"]', TEST_USER_EMAIL);
      await page.fill('input[type="password"]', TEST_USER_PASSWORD);
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(/\/memo/);

      for (const title of createdTitles) {
        try {
          // 1. 최근 메모에서 휴지통으로 이동
          await page.goto('/memo?tab=recent');
          const memoItem = page.getByTestId('memo-item').filter({ hasText: title }).first();
          if (await memoItem.isVisible()) {
            await memoItem.click({ button: 'right' });
            await page.locator('button:has-text("휴지통으로 이동")').click();
            await page.waitForTimeout(500);
          }

          // 2. 휴지통에서 영구 삭제
          await page.goto('/memo?tab=trash');
          const trashItem = page.getByTestId('memo-item').filter({ hasText: title }).first();
          if (await trashItem.isVisible()) {
            await trashItem.click({ button: 'right' });
            page.once('dialog', d => d.accept());
            await page.locator('button:has-text("영구 삭제")').click();
            await page.waitForTimeout(500);
          }
        } catch (e) {
          // 개별 정리 실패는 무시
        }
      }
    } finally {
      await page.close();
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

      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관하기');

      await navigateToTab(page, '보관함');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });

    await test.step('보관 해제', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '보관 해제');

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
      await navigateToTab(page, '최근 메모');
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await expect(memoItem).toBeVisible();
      
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '휴지통으로 이동');

      await navigateToTab(page, '휴지통');
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
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });
      await clickContextMenuAction(page, '휴지통으로 이동');

      await navigateToTab(page, '휴지통');
      await expect(getMemoItem(page, UNIQUE_TITLE)).toBeVisible();
    });

    await test.step('영구 삭제', async () => {
      const memoItem = getMemoItem(page, UNIQUE_TITLE);
      await memoItem.click({ button: 'right' });

      page.once('dialog', async dialog => {
        await dialog.accept();
      });

      await clickContextMenuAction(page, '영구 삭제');
      await expect(memoItem).not.toBeVisible();
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

      await memoItem.click({ modifiers: ['Shift'] });
      await expect(page.locator('button:has(.ellipsis-icon)').first()).toBeHidden();
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
    });
  });
});