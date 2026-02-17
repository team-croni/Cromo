// 메모 생성 입력 검증
export function validateCreateMemoInput(data: any) {
  const { title, content, folderId, tags, isArchived } = data;

  if (!title || typeof title !== 'string' || title.length === 0 || title.length > 200) {
    throw new Error('Title is required and must be 1-200 characters');
  }

  if (content !== undefined && (typeof content !== 'string' || content.length > 1000000)) {
    throw new Error('Content must be a string with max 1MB');
  }

  if (folderId !== undefined && folderId !== null) {
    if (typeof folderId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(folderId)) {
      throw new Error('Invalid folder ID format');
    }
  }

  if (tags !== undefined && (!Array.isArray(tags) || tags.length > 50)) {
    throw new Error('Tags must be an array with max 50 items');
  }

  if (tags) {
    for (const tag of tags) {
      if (typeof tag !== 'string' || tag.length > 50) {
        throw new Error('Each tag must be a string with max 50 characters');
      }
    }
  }

  if (isArchived !== undefined && typeof isArchived !== 'boolean') {
    throw new Error('isArchived must be a boolean');
  }
}

// 메모 일괄 작업 입력 검증
export function validateBatchOperationInput(data: any) {
  const { ids, action } = data;

  if (!ids || !Array.isArray(ids) || ids.length === 0 || ids.length > 5000) {
    throw new Error('IDs must be an array with 1-5000 items');
  }

  for (const id of ids) {
    if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error('Invalid ID format in array');
    }
  }

  const validActions = ['archive', 'unarchive', 'trash', 'restore', 'permanent-delete', 'move'];
  if (!action || !validActions.includes(action)) {
    throw new Error('Invalid action');
  }

  if (action === 'move') {
    // folderId는 null일 수도 있고(root), string일 수도 있음
    if (data.folderId !== null && typeof data.folderId !== 'string') {
      throw new Error('Invalid folderId for move action');
    }
  }
}

// 메모 업데이트 입력 검증 (Partial update)
export function validateUpdateMemoInput(data: any) {
  const { title, content, folderId, isArchived, tags, action, liveShareMode, allowedUsers } = data;

  if (title !== undefined && (typeof title !== 'string' || title.trim().length === 0)) {
    throw new Error('Title must be a non-empty string');
  }

  if (content !== undefined && typeof content !== 'string') {
    throw new Error('Content must be a string');
  }

  if (folderId !== undefined && folderId !== null && typeof folderId !== 'string') {
    throw new Error('Folder ID must be a string or null');
  }

  if (action && !['addTag', 'removeTag', 'restore'].includes(action)) {
    throw new Error('Invalid action parameter');
  }

  if (tags && !Array.isArray(tags)) {
    throw new Error('Tags must be an array');
  }

  if (liveShareMode && !['public', 'private'].includes(liveShareMode)) {
    throw new Error('Invalid live share mode');
  }

  if (allowedUsers && !Array.isArray(allowedUsers)) {
    throw new Error('Allowed users must be an array');
  }
}
