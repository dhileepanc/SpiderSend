import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

/**
 * Type-safe custom wrapper for useDispatch
 * Automatically maps to the application's AppDispatch type definition.
 */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/**
 * Type-safe custom wrapper for useSelector
 * Automatically maps selections to the RootState layout.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
