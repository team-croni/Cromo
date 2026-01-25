import { create } from 'zustand';

export type ErrorDisplayType = 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR' | 'AI_ERROR' | null;

interface ErrorDisplayState {
  isVisible: boolean;
  message: string;
  errorType: ErrorDisplayType;
  showError: (message: string, type: ErrorDisplayType) => void;
  hideError: () => void;
}

export const useErrorDisplayStore = create<ErrorDisplayState>((set) => ({
  isVisible: false,
  message: '',
  errorType: null,
  showError: (message, type) =>
    set(() => ({ isVisible: true, message: message, errorType: type })),
  hideError: () =>
    set(() => ({ isVisible: false })),
}));
