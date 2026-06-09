import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Client user shape matching the /otp-Verify API response.
 */
export interface User {
  id: number;
  email: string;
  name: string;
  mobile: string;
  company_name: string;
  address: string;
  country_id: number;
  country_name: string | null;
  google_id: string | null;
  trial_access_active: boolean;
  service_timezone: string;
  notes: string | null;
  session_token: string | null;
}

/**
 * Redux Auth State Interface
 */
export interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  loading: false,
  error: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Store user data upon successful OTP verification.
     */
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>
    ) => {
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.error = null;
    },
    /**
     * Rehydrate auth state from AsyncStorage on app launch.
     */
    rehydrateAuth: (
      state,
      action: PayloadAction<{ user: User } | null>
    ) => {
      if (action.payload) {
        state.isLoggedIn = true;
        state.user = action.payload.user;
      } else {
        state.isLoggedIn = false;
        state.user = null;
      }
    },
    /**
     * Clear auth details (Logout)
     */
    clearCredentials: (state) => {
      state.isLoggedIn = false;
      state.user = null;
      state.error = null;
    },
    /**
     * Set asynchronous network pending/loading state
     */
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    /**
     * Set standard API exceptions error messages
     */
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCredentials,
  rehydrateAuth,
  clearCredentials,
  setLoading,
  setError,
} = authSlice.actions;

// High-performance state selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsLoggedIn = (state: { auth: AuthState }) => state.auth.isLoggedIn;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

export default authSlice.reducer;
