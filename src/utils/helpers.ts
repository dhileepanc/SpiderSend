import { Dimensions, PixelRatio } from 'react-native';

/**
 * General App Helpers
 * Collection of responsive style calculators, type checkers, formatting extensions,
 * and robust network exception parse mechanisms.
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Converts width percentage to dynamic density-independent pixels.
 * @param percent percentage value (e.g. 50 representing 50% of the screen width)
 */
export const wp = (percent: number | string): number => {
  const elemWidth = typeof percent === 'number' ? percent : parseFloat(percent);
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * elemWidth) / 100);
};

/**
 * Converts height percentage to dynamic density-independent pixels.
 * @param percent percentage value (e.g. 20 representing 20% of the screen height)
 */
export const hp = (percent: number | string): number => {
  const elemHeight = typeof percent === 'number' ? percent : parseFloat(percent);
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * elemHeight) / 100);
};

/**
 * Formats a raw number to currency string.
 */
export const formatCurrency = (
  amount: number,
  currencyCode = 'USD',
  locale = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch (e) {
    // Fallback in case Intl is not available on older JS engines
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};

/**
 * Simple dates formatter (returns YYYY-MM-DD or DD/MM/YYYY)
 */
export const formatDate = (
  date: Date | string | number,
  option: 'short' | 'long' | 'input' = 'short'
): string => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (option === 'input') {
    return `${year}-${month}-${day}`; // YYYY-MM-DD
  }

  if (option === 'long') {
    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  return `${day}/${month}/${year}`; // DD/MM/YYYY
};

/**
 * Safe parser for Axios and general error structures.
 * Extracts standard message from server JSON response if existing.
 */
export const parseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';

  // Axios response error
  if (error.response) {
    const data = error.response.data;
    if (data) {
      if (typeof data === 'string') return data;
      if (data.message) return data.message;
      if (data.error) return typeof data.error === 'string' ? data.error : data.error.message;
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors[0];
      }
    }
  }

  // Request set up but no response
  if (error.request) {
    return 'Server is currently unreachable. Please check your internet connection.';
  }

  // Local exception
  if (error.message) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'An error occurred during transaction';
};
