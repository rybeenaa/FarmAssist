import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseAsyncActionOptions {
  onSuccess?: (data?: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAsyncAction<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: UseAsyncActionOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn(...args);
        
        if (options.successMessage) {
          toast.success(options.successMessage);
        }
        
        if (options.onSuccess) {
          options.onSuccess(result);
        }
        
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unknown error occurred');
        setError(error);
        
        const errorMessage = options.errorMessage || error.message;
        toast.error(errorMessage);
        
        if (options.onError) {
          options.onError(error);
        }
        
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn, options]
  );

  return {
    execute,
    isLoading,
    error,
    reset: () => {
      setError(null);
      setIsLoading(false);
    }
  };
}
