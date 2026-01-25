import { userEventCounts } from "../store/index.js";

const RATE_LIMITS = {
  "join-memo-room": { max: 10, window: 60000 },
  "memo-content-change": { max: 100, window: 1000 },
  "cursor-move": { max: 200, window: 1000 },
  "live-share-settings-changed": { max: 20, window: 60000 },
  "leave-memo-room": { max: 30, window: 60000 },
  default: { max: 50, window: 1000 },
};

function isRateLimited(socketId, eventName) {
  const now = Date.now();
  const limits = RATE_LIMITS[eventName] || RATE_LIMITS.default;
  const userKey = `${socketId}-${eventName}`;
  const userEvents = userEventCounts.get(userKey);

  if (!userEvents || now > userEvents.resetTime) {
    userEventCounts.set(userKey, { count: 1, resetTime: now + limits.window });
    return false;
  }

  userEvents.count++;
  userEventCounts.set(userKey, userEvents);
  return userEvents.count > limits.max;
}

export { isRateLimited };
