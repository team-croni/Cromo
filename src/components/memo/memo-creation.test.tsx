import { describe, it, expect, vi, beforeEach } from 'vitest';
import { memoService } from '@/services/memoService';
import * as fetchWrapper from '@/utils/fetchWrapper';
import { Memo } from '@/types';

// Mock fetchWrapper
vi.mock('@/utils/fetchWrapper', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  del: vi.fn(),
}));

describe('memoService - createMemo', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('should successfully create a memo', async () => {
    const newMemo: Memo = {
      id: 'memo-123',
      title: 'Test Memo',
      content: 'This is a test memo content.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderId: null,
      folder: null, // Added missing 'folder' property
      isArchived: false,
      isDeleted: false,
      isLiveShareEnabled: false,
      userId: 'user-id-1',
    };

    // Mock the API post call to return the new memo
    vi.mocked(fetchWrapper.post).mockResolvedValue(newMemo);

    const createdMemo = await memoService.createMemo({
      title: 'Test Memo',
      content: 'This is a test memo content.',
      folderId: null,
      isArchived: false,
    });

    // Assertions
    expect(createdMemo).toEqual(newMemo);
    expect(fetchWrapper.post).toHaveBeenCalledTimes(1);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/memos', {
      title: 'Test Memo',
      content: 'This is a test memo content.',
      folderId: null,
      isArchived: false,
    });
  });

  it('should handle API error during memo creation', async () => {
    const errorMessage = 'Failed to create memo on server';
    vi.mocked(fetchWrapper.post).mockRejectedValue(new Error(errorMessage));

    await expect(
      memoService.createMemo({
        title: 'Error Memo',
        content: 'Content',
        folderId: null,
        isArchived: false,
      })
    ).rejects.toThrow(errorMessage);

    expect(fetchWrapper.post).toHaveBeenCalledTimes(1);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/memos', {
      title: 'Error Memo',
      content: 'Content',
      folderId: null,
      isArchived: false,
    });
  });

  it('should create a memo with a specific folderId', async () => {
    const newMemoInFolder: Memo = {
      id: 'memo-456',
      title: 'Memo in Folder',
      content: 'Content for folder memo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderId: 'folder-abc',
      folder: { id: 'folder-abc', name: 'Test Folder' }, // Added missing 'folder' property
      isArchived: false,
      isDeleted: false,
      isLiveShareEnabled: false,
      userId: 'user-id-1',
    };

    vi.mocked(fetchWrapper.post).mockResolvedValue(newMemoInFolder);

    const createdMemo = await memoService.createMemo({
      title: 'Memo in Folder',
      content: 'Content for folder memo',
      folderId: 'folder-abc',
    });

    expect(createdMemo).toEqual(newMemoInFolder);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/memos', {
      title: 'Memo in Folder',
      content: 'Content for folder memo',
      folderId: 'folder-abc',
    });
  });

  it('should create an archived memo', async () => {
    const archivedMemo: Memo = {
      id: 'memo-789',
      title: 'Archived Memo',
      content: 'Archived content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folderId: null,
      folder: null, // Added missing 'folder' property
      isArchived: true,
      isDeleted: false,
      isLiveShareEnabled: false,
      userId: 'user-id-1',
    };

    vi.mocked(fetchWrapper.post).mockResolvedValue(archivedMemo);

    const createdMemo = await memoService.createMemo({
      title: 'Archived Memo',
      content: 'Archived content',
      isArchived: true,
    });

    expect(createdMemo).toEqual(archivedMemo);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/memos', {
      title: 'Archived Memo',
      content: 'Archived content',
      isArchived: true,
    });
  });
});
