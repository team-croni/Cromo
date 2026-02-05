import { getErrorMessage } from './getErrorMessage';
import { describe, it, expect } from 'vitest';
import { AutoSaveErrorType } from '@/store/autoSaveFailureStore';

describe('getErrorMessage', () => {
  it('should return UNKNOWN_ERROR and a default message for unknown error types', () => {
    const { errorType, errorMessage } = getErrorMessage('just a string');
    expect(errorType).toBe('UNKNOWN_ERROR');
    expect(errorMessage).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('should return the error message for a generic Error instance', () => {
    const testError = new Error('Something went wrong');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('UNKNOWN_ERROR'); // Default for generic errors
    expect(errorMessage).toBe('Something went wrong');
  });

  it('should identify NETWORK_ERROR for "Failed to fetch" message', () => {
    const testError = new Error('Failed to fetch');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('NETWORK_ERROR');
    expect(errorMessage).toBe('Failed to fetch');
  });

  it('should identify NETWORK_ERROR for "ERR_INTERNET_DISCONNECTED" message', () => {
    const testError = new Error('ERR_INTERNET_DISCONNECTED');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('NETWORK_ERROR');
    expect(errorMessage).toBe('ERR_INTERNET_DISCONNECTED');
  });

  it('should identify NETWORK_ERROR for "NetworkError" message', () => {
    const testError = new Error('NetworkError');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('NETWORK_ERROR');
    expect(errorMessage).toBe('NetworkError');
  });

  it('should identify SERVER_ERROR for 500 status code in message', () => {
    const testError = new Error('Request failed with status code 500');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('SERVER_ERROR');
    expect(errorMessage).toBe('Request failed with status code 500');
  });

  it('should identify SERVER_ERROR for 503 status code in message', () => {
    const testError = new Error('Service Unavailable (503)');
    const { errorType, errorMessage } = getErrorMessage(testError);
    expect(errorType).toBe('SERVER_ERROR');
    expect(errorMessage).toBe('Service Unavailable (503)');
  });

  it('should handle an empty error object gracefully', () => {
    const { errorType, errorMessage } = getErrorMessage({});
    expect(errorType).toBe('UNKNOWN_ERROR');
    expect(errorMessage).toBe('알 수 없는 오류가 발생했습니다.');
  });

  it('should handle null error gracefully', () => {
    const { errorType, errorMessage } = getErrorMessage(null);
    expect(errorType).toBe('UNKNOWN_ERROR');
    expect(errorMessage).toBe('알 수 없는 오류가 발생했습니다.');
  });
});
