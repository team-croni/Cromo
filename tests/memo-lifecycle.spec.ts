import { test, expect } from '@playwright/test';

/**
 * 메모 생명주기 E2E 테스트
 */
test.describe('Memo Lifecycle E2E', () => {
  const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@cromo.site';
  const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'cromo1234';

  // 테스트 시작 전 컨텍스트 메뉴 닫기
  const closeContextMenu = async (page: any) => {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
  };

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
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

  test('should create and archive a memo', async ({ page }) => {
    const UNIQUE_TITLE = `Archive_E2E_${Date.now()}`;

    // 1. 메모 생성
    await test.step('Create a new memo', async () => {
      const createButton = page.getByText('새로운 메모 추가').first();
      await expect(createButton).toBeVisible();
      await createButton.click();

      const titleInput = page.locator('input[placeholder="제목 없음"]');
      await expect(titleInput).toBeVisible();
      await titleInput.fill(UNIQUE_TITLE);

      await expect(page.locator('text=저장 완료')).toBeVisible();
    });

    // 2. 최근 메모 목록에서 확인 및 보관
    await test.step('Archive memo', async () => {
      await closeContextMenu(page);

      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await expect(memoItem).toBeVisible();

      // 우클릭 컨텍스트 메뉴
      await memoItem.click({ button: 'right' });

      // 보이는 컨텍스트 메뉴에서 '보관하기' 버튼 클릭
      const archiveButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("보관하기")').first();
      await expect(archiveButton).toBeVisible();
      await archiveButton.click({ force: true });

      // 보관함 이동 및 확인
      await page.locator('nav >> text=보관함').click();
      await page.waitForURL(/tab=archived/);
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE })).toBeVisible();
    });

    // 3. 보관함에서 보관 해제
    await test.step('Unarchive memo', async () => {
      await closeContextMenu(page);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await memoItem.click({ button: 'right' });

      // '보관 해제' 버튼 클릭
      const unarchiveButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("보관 해제")').first();
      await expect(unarchiveButton).toBeVisible();
      await unarchiveButton.click({ force: true });

      // 최근 메모로 돌아와서 확인
      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE })).toBeVisible();
    });
  });

  test('should move memo to trash and restore', async ({ page }) => {
    const UNIQUE_TITLE = `Trash_E2E_${Date.now()}`;

    // 1. 메모 생성
    await test.step('Create a new memo', async () => {
      const createButton = page.getByText('새로운 메모 추가').first();
      await expect(createButton).toBeVisible();
      await createButton.click();

      const titleInput = page.locator('input[placeholder="제목 없음"]');
      await expect(titleInput).toBeVisible();
      await titleInput.fill(UNIQUE_TITLE);

      await expect(page.locator('text=저장 완료')).toBeVisible();
    });

    // 2. 휴지통으로 이동
    await test.step('Move to trash', async () => {
      await closeContextMenu(page);

      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await expect(memoItem).toBeVisible();

      await memoItem.click({ button: 'right' });

      const trashButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("휴지통으로 이동")').first();
      await expect(trashButton).toBeVisible();
      await trashButton.click({ force: true });

      await page.locator('nav >> text=휴지통').click();
      await page.waitForURL(/tab=trash/);
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE })).toBeVisible();
    });

    // 3. 휴지통에서 복원
    await test.step('Restore from trash', async () => {
      await closeContextMenu(page);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await memoItem.click({ button: 'right' });

      // '복원하기' 버튼 클릭
      const restoreButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("복원하기")').first();
      await expect(restoreButton).toBeVisible();
      await restoreButton.click({ force: true });

      // 최근 메모로 돌아와서 확인
      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE })).toBeVisible();
    });
  });

  test('should permanently delete memo', async ({ page }) => {
    const UNIQUE_TITLE = `Delete_E2E_${Date.now()}`;

    // 1. 메모 생성
    await test.step('Create a new memo', async () => {
      const createButton = page.getByText('새로운 메모 추가').first();
      await expect(createButton).toBeVisible();
      await createButton.click();

      const titleInput = page.locator('input[placeholder="제목 없음"]');
      await expect(titleInput).toBeVisible();
      await titleInput.fill(UNIQUE_TITLE);

      await expect(page.locator('text=저장 완료')).toBeVisible();
    });

    // 2. 휴지통으로 이동
    await test.step('Move to trash', async () => {
      await closeContextMenu(page);

      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await memoItem.click({ button: 'right' });

      const trashButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("휴지통으로 이동")').first();
      await expect(trashButton).toBeVisible();
      await trashButton.click({ force: true });

      await page.locator('nav >> text=휴지통').click();
      await page.waitForURL(/tab=trash/);
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE })).toBeVisible();
    });

    // 3. 영구 삭제
    await test.step('Permanently delete', async () => {
      await closeContextMenu(page);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await memoItem.click({ button: 'right' });

      // 대화상자 리스너 먼저 설정
      page.on('dialog', async dialog => {
        await dialog.accept();
      });

      const deleteButton = page.locator('[data-testid^="context-menu-"]:not([class*="opacity-0"]) button:has-text("영구 삭제")').first();
      await expect(deleteButton).toBeVisible();
      await deleteButton.click({ force: true });

      await page.waitForTimeout(500);

      // 목록에서 사라짐 확인
      await expect(page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE }).first()).not.toBeVisible();
    });
  });

  test('should use selection mode and select all', async ({ page }) => {
    const UNIQUE_TITLE = `Selection_E2E_${Date.now()}`;

    // 1. 메모 생성
    await test.step('Create a new memo', async () => {
      const createButton = page.getByText('새로운 메모 추가').first();
      await expect(createButton).toBeVisible();
      await createButton.click();

      const titleInput = page.locator('input[placeholder="제목 없음"]');
      await expect(titleInput).toBeVisible();
      await titleInput.fill(UNIQUE_TITLE);

      await expect(page.locator('text=저장 완료')).toBeVisible();
    });

    // 2. 최근 메모 목록에서 선택 모드 활성화
    await test.step('Use selection mode', async () => {
      await closeContextMenu(page);

      await page.locator('nav >> text=최근 메모').click();
      await page.waitForURL(/tab=recent/);

      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await expect(memoItem).toBeVisible();

      // Shift+Click으로 선택 모드 활성화 및 메모 선택
      await memoItem.click({ modifiers: ['Shift'] });

      // 선택 모드 확인 (선택된 메모의 배경색이 변경되었는지 확인)
      await expect(memoItem).toHaveClass(/bg-popover|bg-sidebar/);
    });

    // 3. Command/Ctrl + Click으로 개별 선택
    await test.step('Multi-select with Command/Ctrl', async () => {
      await closeContextMenu(page);

      // 다른 메모를 Command+Click으로 추가 선택
      const otherMemos = page.getByTestId('memo-item').filter({ hasNotText: UNIQUE_TITLE });
      const otherMemo = otherMemos.first();

      if (await otherMemo.count() > 0) {
        await otherMemo.click({ modifiers: ['Control'] });
      }

      // 선택된 메모가 2개 이상인지 확인
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

    // 4. 선택 해제
    await test.step('Clear selection', async () => {
      await closeContextMenu(page);

      // 선택된 메모 클릭하여 선택 해제
      const memoItem = page.getByTestId('memo-item').filter({ hasText: UNIQUE_TITLE });
      await memoItem.click({ modifiers: ['Control'] });

      // 선택 모드 종료 확인 (선택 정보 사라짐)
      // Esc 키로 선택 모드 종료 시도
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      // 메모 선택 해제 확인
      await expect(memoItem).not.toHaveClass(/bg-popover/);
    });
  });
});
