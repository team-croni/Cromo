import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFolders } from '@/hooks/useFolders';
import * as fetchWrapper from '@/utils/fetchWrapper';
import { Folder } from '@/types';

// Mock fetchWrapper
vi.mock('@/utils/fetchWrapper', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('useFolders Hook - createFolder', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    // Create a new QueryClient for each test to ensure isolation
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for tests
        },
      },
    });
  });

  const setupHook = () => {
    // Render the hook within a QueryClientProvider
    return renderHook(() => useFolders(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });
  };

  it('should successfully create a folder and update the cache', async () => {
    const newFolder: Folder = {
      id: 'folder-123',
      name: 'New Folder',
      icon: 'folder',
      color: '#000000',
      parentId: null,
      order: 0,
      children: [],
      memos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-id',
    };

    // Mock the API post call to return the new folder
    vi.mocked(fetchWrapper.post).mockResolvedValue(newFolder);
    // Mock the initial fetchFolders to return an empty array
    vi.mocked(fetchWrapper.get).mockResolvedValue([]);


    const { result } = setupHook();

    // Ensure initial folders are empty
    await waitFor(() => expect(result.current.folders).toEqual([]));

    // Call createFolder
    const createdFolder = await result.current.createFolder('New Folder', null);

    // Assertions
    expect(createdFolder).toEqual(newFolder);
    expect(fetchWrapper.post).toHaveBeenCalledTimes(1);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/folders', {
      name: 'New Folder',
      parentId: null,
    });

    // Check if the cache was updated (folders should now contain the newFolder)
    await waitFor(() => expect(result.current.folders).toEqual([newFolder]));
  });

  it('should handle API error during folder creation gracefully', async () => {
    const errorMessage = 'Failed to create folder on server';
    vi.mocked(fetchWrapper.post).mockRejectedValue(new Error(errorMessage));
    vi.mocked(fetchWrapper.get).mockResolvedValue([]); // Mock initial fetch

    const { result } = setupHook();

    await waitFor(() => expect(result.current.folders).toEqual([]));

    // Spy on console.error to check if error is logged
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const createdFolder = await result.current.createFolder('Error Folder', null);

    // Assertions
    expect(createdFolder).toBeNull();
    expect(fetchWrapper.post).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating folder:', expect.any(Error));
    // Ensure cache is not updated on error
    await waitFor(() => expect(result.current.folders).toEqual([]));

    consoleErrorSpy.mockRestore(); // Restore console.error
  });

  it('should create a subfolder with a parentId', async () => {
    const parentFolder: Folder = {
      id: 'parent-folder',
      name: 'Parent',
      icon: 'folder',
      color: '#000000',
      parentId: null,
      order: 0,
      children: [],
      memos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-id',
    };

    const subFolder: Folder = {
      id: 'sub-folder-1',
      name: 'Sub Folder',
      icon: 'folder',
      color: '#FFFFFF',
      parentId: 'parent-folder',
      order: 0,
      children: [],
      memos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'user-id',
    };

    vi.mocked(fetchWrapper.post).mockResolvedValue(subFolder);
    vi.mocked(fetchWrapper.get).mockResolvedValue([parentFolder]); // Initial data for cache

    const { result } = setupHook();

    await waitFor(() => expect(result.current.folders).toEqual([parentFolder]));

    const createdSubFolder = await result.current.createFolder('Sub Folder', 'parent-folder');

    expect(createdSubFolder).toEqual(subFolder);
    expect(fetchWrapper.post).toHaveBeenCalledWith('/api/folders', {
      name: 'Sub Folder',
      parentId: 'parent-folder',
    });
    // Cache should now contain both parent and sub-folder in a hierarchical structure
    await waitFor(() => {
      const expectedParentFolder: Folder = { ...parentFolder, children: [subFolder] };
      expect(result.current.folders).toEqual([expectedParentFolder]);
    });
  });
});
