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
  CLICK2CONNECT: {
    SCAN: '/click-to-connect-scan',
    RE_SCAN: '/click-to-connect-re-scan',
    STORE: '/click-to-connect-scan-store',
    SEND_MAIL: '/click-to-connect-send-mail',
    PREVIEW: '/click-to-connect-preview',
  },
  CLICK2CONNECTVERIFY: {
    VERIFY: '/click-to-connect-verify',
  },
  DIRECT_SEND: {
    POST: '/direct-send-post',
  },
  MAIL_TEMPLATE: {
    LIST: '/mail-template-list',
    GENERATE: '/mail-template-generate',
    STORE: '/mail-template-store',
    EDIT: '/mail-template-edit',
    UPDATE: '/mail-template-update',
    DELETE: '/mail-template-delete',
  },
  CONTACT_GROUP: {
    LIST: '/contact-group-list',
    STORE: '/contact-group-store',
    EDIT: '/contact-group-edit',
    UPDATE: '/contact-group-update',
    CONTACTS: '/contact-list',
    CONTACT_ADD_VIEW: '/contact-add-view',
    CONTACT_STORE: '/contact-store',
    CONTACT_EDIT: '/contact-edit',
    CONTACT_UPDATE: '/contact-update',
    CONTACT_DELETE: '/contact-delete',
  }
} as const;

export type EndpointsType = typeof ENDPOINTS;
export default ENDPOINTS;
