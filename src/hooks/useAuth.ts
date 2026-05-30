import { useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import {
  setCredentials,
  clearCredentials,
  setLoading,
  setError,
  selectCurrentUser,
  selectIsLoggedIn,
  selectAuthLoading,
  selectAuthError,
  User,
} from '../redux/slices/authSlice';
import { requestLoginOtp, verifyLoginOtp } from '../services/authService';
import { parseError } from '../utils/helpers';

/** AsyncStorage key for persisting the logged-in user */
const USER_STORAGE_KEY = '@spidersend_user';

/**
 * Custom Hook: useAuth
 * Provides authentication state and the two-step login flow:
 *   1. requestOtp(email)  — calls POST /login, triggers OTP email
 *   2. verifyOtp(email, otp) — calls POST /otp-Verify, stores session
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();

  // State Selections
  const user = useAppSelector(selectCurrentUser);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  const loading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  const isAuthenticated = isLoggedIn;

  /**
   * Step 1 — Request OTP
   * Calls POST /login with the email, which triggers the server to send an OTP.
   * Returns true on success so the screen can advance to the verify step.
   */
  const requestOtp = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const data = await requestLoginOtp({ email: email.toLowerCase().trim() });

        if (!data.status) {
          dispatch(setError(data.message ?? 'Failed to send OTP. Please try again.'));
          dispatch(setLoading(false));
          return false;
        }

        dispatch(setLoading(false));
        return true;
      } catch (err) {
        dispatch(setLoading(false));
        dispatch(setError(parseError(err)));
        return false;
      }
    },
    [dispatch],
  );

  /**
   * Step 2 — Verify OTP
   * Calls POST /otp-Verify with the email + OTP.
   * On success, maps client data to User, persists to AsyncStorage, and sets Redux state.
   * RootNavigator will automatically switch to AppNavigator when isLoggedIn becomes true.
   */
  const verifyOtp = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      try {
        dispatch(setLoading(true));
        dispatch(setError(null));

        const response = await verifyLoginOtp({
          email: email.toLowerCase().trim(),
          otp,
        });

        if (response.status && response.data?.client) {
          const client = response.data.client;

          // Map the API client shape to our User interface
          const userData: User = {
            id: client.id,
            email: client.email,
            name: client.name,
            mobile: client.mobile,
            company_name: client.company_name,
            address: client.address,
            country_id: client.country_id,
            country_name: client.country_name,
            google_id: client.google_id,
            trial_access_active: client.trial_access_active,
            service_timezone: client.service_timezone,
            notes: client.notes,
          };

          // Persist user to AsyncStorage so login survives app restarts
          await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

          // Store in Redux — this flips isLoggedIn = true and triggers navigation
          dispatch(setCredentials({ user: userData }));
        } else {
          // Server responded 2xx but status is false — treat as failure
          dispatch(setError(response.message ?? 'Verification failed. Please try again.'));
          dispatch(setLoading(false));
          return false;
        }

        dispatch(setLoading(false));
        return true;
      } catch (err) {
        dispatch(setLoading(false));
        dispatch(setError(parseError(err)));
        return false;
      }
    },
    [dispatch],
  );

  /**
   * Logout — clears session from Redux and AsyncStorage
   */
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
    dispatch(clearCredentials());
  }, [dispatch]);

  /**
   * Clear any stale auth error (e.g. when the user starts typing again)
   */
  const clearAuthError = useCallback(() => {
    dispatch(setError(null));
  }, [dispatch]);

  return {
    user,
    isLoggedIn,
    loading,
    error,
    isAuthenticated,
    requestOtp,
    verifyOtp,
    logout,
    clearAuthError,
  };
};

export { USER_STORAGE_KEY };
export default useAuth;
