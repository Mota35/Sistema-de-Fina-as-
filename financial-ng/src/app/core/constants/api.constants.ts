export const API_BASE = 'http://localhost/finance-api/public/api';
export const STORAGE_BASE = 'http://localhost/finance-api/public';

export const API = {
  AUTH: {
    LOGIN:           `${API_BASE}/auth/login`,
    REGISTER:        `${API_BASE}/auth/register`,
    LOGOUT:          `${API_BASE}/auth/logout`,
    REFRESH:         `${API_BASE}/auth/refresh`,
    ME:              `${API_BASE}/auth/me`,
    FORGOT_PASSWORD: `${API_BASE}/auth/forgot-password`,
    RESET_PASSWORD:  `${API_BASE}/auth/reset-password`,
  },
  USERS: {
    BASE:   `${API_BASE}/users`,
    AVATAR: `${API_BASE}/profile/avatar`,  // ← era /users/avatar
    BY_ID:  (id: number) => `${API_BASE}/users/${id}`,
  },
  ACCOUNTS: {
    BASE:  `${API_BASE}/accounts`,
    BY_ID: (id: number) => `${API_BASE}/accounts/${id}`,
  },
  CATEGORIES: {
    BASE:  `${API_BASE}/categories`,
    BY_ID: (id: number) => `${API_BASE}/categories/${id}`,
  },
  TRANSACTIONS: {
    BASE:     `${API_BASE}/transactions`,
    BY_ID:    (id: number) => `${API_BASE}/transactions/${id}`,
    SUMMARY:  `${API_BASE}/transactions/summary`,
    EXPORT:   `${API_BASE}/transactions/export`,
  },
  BUDGETS: {
    BASE:  `${API_BASE}/budgets`,
    BY_ID: (id: number) => `${API_BASE}/budgets/${id}`,
  },
  GOALS: {
    BASE:  `${API_BASE}/goals`,
    BY_ID: (id: number) => `${API_BASE}/goals/${id}`,
    CONTRIBUTE: (id: number) => `${API_BASE}/goals/${id}/contribute`,
  },
  DASHBOARD: {
    SUMMARY:   `${API_BASE}/dashboard/summary`,
    EVOLUTION: `${API_BASE}/dashboard/evolution`,
    CATEGORY:  `${API_BASE}/dashboard/by-category`,
  },
  REPORTS: {
    MONTHLY: `${API_BASE}/reports/monthly`,
    ANNUAL:  `${API_BASE}/reports/annual`,
    EXPORT:  `${API_BASE}/reports/export`,
  },
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'fp_access_token',
  REFRESH_TOKEN: 'fp_refresh_token',
  USER:          'fp_user',
  THEME:         'fp_theme',
  LANGUAGE:      'fp_language',
  SIDEBAR:       'fp_sidebar_collapsed',
};
