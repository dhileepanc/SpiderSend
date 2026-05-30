import { useState, useEffect } from 'react';

/**
 * Custom Hook: useDebounce
 * Throttles rapid state changes by delaying updates until a specific time has elapsed.
 * Ideal for search field autocomplete calls to prevent overloading APIs.
 * 
 * @param value State value to debounce
 * @param delay Milliseconds to delay updating
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 1. Create a timeout to update state
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 2. Clear timeout if value changes before the delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
