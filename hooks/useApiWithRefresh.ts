'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiService, ApiResponse } from '@/services/apiServiceWithRefresh';

interface UseApiOptions {
  immediate?: boolean; // Call API immediately on mount
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  requiresLogin?: (requiresLogin: boolean) => void;
}

interface UseApiReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  sessionRefreshed: boolean;
  requiresLogin: boolean;
  execute: (...args: any[]) => Promise<ApiResponse<T>>;
  refetch: () => Promise<void>;
  reset: () => void;
}

// Generic hook for API calls with automatic token refresh
export function useApi<T = any>(
  apiCall: () => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionRefreshed, setSessionRefreshed] = useState(false);
  const [requiresLogin, setRequiresLogin] = useState(false);

  const execute = useCallback(async (...args: any[]): Promise<ApiResponse<T>> => {
    try {
      setLoading(true);
      setError(null);
      setRequiresLogin(false);
      setSessionRefreshed(false);

      const response = await apiCall();

      if (response.error) {
        setError(response.error);
        setRequiresLogin(!!response.requiresLogin);
        options.onError?.(response.error);
      } else if (response.data) {
        setData(response.data);
        setSessionRefreshed(!!response.sessionRefreshed);
        options.onSuccess?.(response.data);
      }

      if (response.requiresLogin) {
        setRequiresLogin(true);
        options.requiresLogin?.(true);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [apiCall, options]);

  const refetch = useCallback(async () => {
    await execute();
  }, [execute]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    setSessionRefreshed(false);
    setRequiresLogin(false);
  }, []);

  // Call API immediately if immediate option is true
  useEffect(() => {
    if (options.immediate) {
      execute();
    }
  }, [options.immediate, execute]);

  return {
    data,
    loading,
    error,
    sessionRefreshed,
    requiresLogin,
    execute,
    refetch,
    reset,
  };
}

// Specific hooks for common API operations
export function useGet<T>(url: string, options: UseApiOptions = {}) {
  return useApi<T>(
    () => apiService.get<T>(url),
    options
  );
}

export function usePost<T>(url: string, data?: any, options: UseApiOptions = {}) {
  return useApi<T>(
    () => apiService.post<T>(url, data),
    options
  );
}

export function usePut<T>(url: string, data?: any, options: UseApiOptions = {}) {
  return useApi<T>(
    () => apiService.put<T>(url, data),
    options
  );
}

export function useDelete<T>(url: string, options: UseApiOptions = {}) {
  return useApi<T>(
    () => apiService.delete<T>(url),
    options
  );
}

// Export the apiService instance for direct use
export { apiService };

// Hook for protected routes that handles authentication
export function useProtectedApi<T>(url: string, options: UseApiOptions = {}) {
  const router = useRouter();
  
  const result = useGet<T>(url, {
    ...options,
    requiresLogin: (requiresLogin) => {
      if (requiresLogin) {
        router.push('/login');
      }
      options.requiresLogin?.(requiresLogin);
    },
  });

  return result;
}
