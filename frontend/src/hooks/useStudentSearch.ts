import { useState, useEffect, useCallback } from 'react';
import { API_CONFIG } from '@/constants/api';

interface StudentSearchResult {
  id: string;
  rollNumber: string;
  email: string;
  user: {
    fullName: string;
  };
}

interface UseStudentSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  suggestions: StudentSearchResult[];
  loading: boolean;
  error: string | null;
  selectStudent: (student: StudentSearchResult) => void;
  clearSuggestions: () => void;
}

export const useStudentSearch = (
  onSelect?: (student: StudentSearchResult) => void,
  debounceMs: number = 300,
  minQueryLength: number = 2,
  maxResults: number = 10,
): UseStudentSearchReturn => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<StudentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.trim().length < minQueryLength) {
        setSuggestions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_CONFIG.BASE_URL}/api/v1/fees/students/search?q=${encodeURIComponent(searchQuery)}&limit=${maxResults}`,
          {
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status}`);
        }

        const data = await response.json();
        setSuggestions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs),
    [debounceMs, minQueryLength, maxResults],
  );

  // Effect to trigger search when query changes
  useEffect(() => {
    if (query.trim().length < minQueryLength) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debouncedSearch(query);

    // Cleanup function to cancel pending debounced calls
    return () => {
      debouncedSearch.cancel?.();
    };
  }, [query, debouncedSearch, minQueryLength]);

  const selectStudent = useCallback(
    (student: StudentSearchResult) => {
      setQuery('');
      setSuggestions([]);
      if (onSelect) {
        onSelect(student);
      }
    },
    [onSelect],
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
    selectStudent,
    clearSuggestions,
  };
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  }) as T & { cancel: () => void };

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}
