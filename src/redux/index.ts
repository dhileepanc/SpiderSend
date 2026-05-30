export { store } from './store';
export type { RootState, AppDispatch } from './store';

export {
  useAppDispatch,
  useAppSelector,
} from './hooks';

export {
  setCredentials,
  rehydrateAuth,
  clearCredentials,
  setLoading,
  setError,
  selectCurrentUser,
  selectIsLoggedIn,
  selectAuthLoading,
  selectAuthError,
} from './slices/authSlice';
export type { User, AuthState } from './slices/authSlice';
