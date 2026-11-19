/**
 * Platform-neutral color tokens. Web + Mobile map these through their own
 * theme adapters. No business logic lives here.
 */
export const colors = {
  primary: {
    DEFAULT: '#2563eb',
    hover: '#1d4ed8',
    light: '#dbeafe',
    dark: '#1e3a8a',
  },
  success: {
    DEFAULT: '#16a34a',
    light: '#dcfce7',
  },
  warning: {
    DEFAULT: '#d97706',
    light: '#fef3c7',
  },
  danger: {
    DEFAULT: '#dc2626',
    light: '#fee2e2',
  },
  neutral: {
    white: '#ffffff',
    black: '#0f172a',
    gray: '#64748b',
    light: '#f1f5f9',
    border: '#e2e8f0',
  },
} as const;
