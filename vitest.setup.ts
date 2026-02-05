/**
 * Vitest Setup File
 * 
 * 이 파일은 Vitest 테스트 환경의 전역 설정을 담당합니다.
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// jest-domMatchers를 global.expect에 추가 (Vitest 호환)
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

expect.extend(matchers);

// window.matchMedia 모킹
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ResizeObserver 모킹 - 실제 생성자처럼 동작
class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserver;

// scrollTo 모킹
Element.prototype.scrollTo = vi.fn();
