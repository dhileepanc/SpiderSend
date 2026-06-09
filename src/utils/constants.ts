/**
 * Global Constants configuration
 * Central registry for static values, keys, validation limits, and static endpoints.
 */

export const CONSTANTS = {
  // API Configurations
  API: {
    BASE_URL: 'https://spidercrm.biz/api/emailcampaign/app',
    // BASE_URL: 'https://spidercrm.in/staging4/api/emailcampaign/app',
    TIMEOUT: 50000, // 15 seconds
    HEADERS: {
      JSON: 'application/json',
      MULTIPART: 'multipart/form-data',
    },
    // Basic Auth credentials for staging environment
    BASIC_AUTH: {
      USERNAME: 'admin',
      PASSWORD: 'SpiderServiceCRM2025!@#',
    },
  },

  IMAGE_URL:{
GROUP_LOGO:'https://spidercrm.biz/public/'
// GROUP_LOGO:'https://spidercrm.in/staging4/public/'
  },
  // AsyncStorage Keys (or SecureStore Keys)
  STORAGE_KEYS: {
    AUTH_TOKEN: '@spidersend_user_token',
    REFRESH_TOKEN: '@spidersend_refresh_token',
    USER_DATA: '@spidersend_user_data',
    APP_THEME: '@spidersend_theme',
    FIRST_LAUNCH: '@spidersend_first_launch',
  },

  // Input Field validation boundaries
  LIMITS: {
    MIN_PASSWORD_LENGTH: 8,
    MAX_PASSWORD_LENGTH: 32,
    MIN_PHONE_LENGTH: 10,
    MAX_PHONE_LENGTH: 15,
  },

  // Layout boundaries
  LAYOUT: {
    ACTIVE_OPACITY: 0.7,
    RIPPLE_COLOR: 'rgba(0, 0, 0, 0.1)',
  },
} as const;

export type ConstantsType = typeof CONSTANTS;
