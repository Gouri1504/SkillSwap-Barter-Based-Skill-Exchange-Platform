'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

interface UseApiOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useApi<T = unknown>(options: UseApiOptions = {}) {
  const { showSuccessToast = false, showErrorToast = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const request = useCallback(
    async (
      url: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'GET',
      body?: unknown
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const token = await getToken();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          method,
          headers,
          ...(body ? { body: JSON.stringify(body) } : {}),
        });

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error || 'Something went wrong');
        }

        setData(json.data);


        if (showSuccessToast && json.message) {
          toast.success(json.message);
        }

        return json.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setError(message);
        if (showErrorToast) {
          toast.error(message);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [getToken, showSuccessToast, showErrorToast]
  );

  return { data, loading, error, request, setData };
}
