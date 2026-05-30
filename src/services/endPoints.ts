/**
 * API Endpoints registry — SpiderCRM Staging4
 * Base URL: https://spidercrm.in/staging4
 * Auth: Basic (admin / 123456)
 */

export const ENDPOINTS = {
  AUTH: {
    /** POST /login  →  { email }  →  sends OTP to email */
    LOGIN: '/login',
    /** POST /otp-verify  →  { email, otp }  →  returns session token */
    OTP_VERIFY: '/otp-Verify',
    /** POST /logout */
    LOGOUT: '/logout',
    /** POST /refresh-token */
    REFRESH_TOKEN: '/refresh-token',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile/update',
    DELETE_ACCOUNT: '/user/account/delete',
  },
  DASHBOARD: {
    DATA: '/dashboard',
  },
  TRANSACTION: {
    HISTORY: '/transactions',
    DETAILS: (id: string | number) => `/transactions/${id}`,
    CREATE: '/transactions/create',
    CALCULATE_FEE: '/transactions/calculate-fee',
  },
  NOTIFICATION: {
    LIST: '/notifications',
    MARK_READ: (id: string | number) => `/notifications/${id}/read`,
  },
} as const;

export type EndpointsType = typeof ENDPOINTS;
export default ENDPOINTS;
