function validateMemoId(memoId) {
  if (!memoId || typeof memoId !== "string" || memoId.length === 0) {
    throw new Error("Invalid memo ID");
  }
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(memoId)) {
    if (memoId.length !== 36) throw new Error("Invalid memo ID format");
  }
}

function validateUserInfo(userInfo) {
  if (!userInfo || typeof userInfo !== "object")
    throw new Error("Invalid user info");
  if (
    !userInfo.id ||
    typeof userInfo.id !== "string" ||
    userInfo.id.length !== 36
  ) {
    throw new Error("Invalid user ID");
  }
  if (
    !userInfo.name ||
    typeof userInfo.name !== "string" ||
    userInfo.name.length > 100
  ) {
    throw new Error("Invalid user name");
  }
  if (
    !userInfo.email ||
    typeof userInfo.email !== "string" ||
    userInfo.email.length > 255
  ) {
    throw new Error("Invalid user email");
  }

  // avatarColor와 avatarType은 선택적 속성으로 검증
  if (userInfo.avatarColor && typeof userInfo.avatarColor !== "string") {
    throw new Error("Invalid avatar color");
  }

  if (userInfo.avatarType && typeof userInfo.avatarType !== "string") {
    throw new Error("Invalid avatar type");
  }
}

function validateCursorData(data) {
  if (!data || typeof data !== "object") throw new Error("Invalid cursor data");
  validateMemoId(data.memoId);
  if (
    data.position !== null &&
    data.position !== undefined &&
    typeof data.position !== "object"
  ) {
    throw new Error("Invalid cursor position");
  }
}

function validateMemoContentData(data) {
  if (!data || typeof data !== "object")
    throw new Error("Invalid memo content data");
  validateMemoId(data.memoId);
  if (typeof data.content !== "string" || data.content.length > 1000000) {
    throw new Error("Invalid content");
  }
  if (
    !data.title ||
    typeof data.title !== "string" ||
    data.title.length > 200
  ) {
    throw new Error("Invalid title");
  }
}

export {
  validateMemoId,
  validateUserInfo,
  validateCursorData,
  validateMemoContentData,
};
