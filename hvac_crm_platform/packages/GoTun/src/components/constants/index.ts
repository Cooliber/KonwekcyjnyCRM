/**
 * @fileoverview GoTun UI Design System Constants
 * @description Design tokens and constants for enterprise-grade HVAC CRM interface
 * @version 1.0.0
 */

// Color Palette - Deep Blue Navigation, Soft Gray Background, Orange Accents
export const GOTUN_COLORS = {
  // Primary Colors (Deep Blue Navigation)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1A3E7C', // Main navigation color
    950: '#172554'
  },
  
  // Secondary Colors (Soft Gray Background)
  secondary: {
    50: '#F5F7FA', // Main background color
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },
  
  // Accent Colors (Orange Accents)
  accent: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#F2994A', // Main accent color
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
    950: '#431407'
  },
  
  // Success Colors (Green)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  },
  
  // Warning Colors (Amber)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },
  
  // Error Colors (Red)
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
    950: '#450a0a'
  },
  
  // Info Colors (Blue)
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },
  
  // Neutral Colors
  neutral: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a'
  },
  
  // Warsaw District Colors
  warsaw: {
    srodmiescie: '#1A3E7C',
    mokotow: '#2563eb',
    ochota: '#3b82f6',
    wola: '#60a5fa',
    zoliborz: '#93c5fd',
    pragaPolnoc: '#F2994A',
    pragaPoludnie: '#fb923c',
    targowek: '#fdba74',
    rembertow: '#fed7aa',
    wawer: '#ffedd5',
    wilanow: '#22c55e',
    ursynow: '#16a34a',
    wlochy: '#15803d',
    ursus: '#166534',
    bemowo: '#14532d',
    bielany: '#ef4444',
    bialoleka: '#dc2626'
  },
  
  // HVAC Equipment Colors
  hvac: {
    splitAc: '#3b82f6',
    centralAc: '#1d4ed8',
    heatPump: '#F2994A',
    ventilation: '#22c55e',
    airPurifier: '#8b5cf6',
    humidifier: '#06b6d4',
    dehumidifier: '#ef4444'
  }
} as const;

// Breakpoints for Responsive Design
export const GOTUN_BREAKPOINTS = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px'
} as const;

// Spacing Scale
export const GOTUN_SPACING = {
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  11: '44px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px'
} as const;

// Shadow System
export const GOTUN_SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  glow: '0 0 20px rgb(59 130 246 / 0.5)',
  'glow-accent': '0 0 20px rgb(242 153 74 / 0.5)',
  'glow-success': '0 0 20px rgb(34 197 94 / 0.5)',
  'glow-error': '0 0 20px rgb(239 68 68 / 0.5)'
} as const;

// Border Radius
export const GOTUN_BORDER_RADIUS = {
  none: '0px',
  sm: '2px',
  DEFAULT: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  '3xl': '24px',
  full: '9999px'
} as const;

// Typography
export const GOTUN_FONT_SIZES = {
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['14px', { lineHeight: '20px' }],
  base: ['16px', { lineHeight: '24px' }],
  lg: ['18px', { lineHeight: '28px' }],
  xl: ['20px', { lineHeight: '28px' }],
  '2xl': ['24px', { lineHeight: '32px' }],
  '3xl': ['30px', { lineHeight: '36px' }],
  '4xl': ['36px', { lineHeight: '40px' }],
  '5xl': ['48px', { lineHeight: '1' }],
  '6xl': ['60px', { lineHeight: '1' }],
  '7xl': ['72px', { lineHeight: '1' }],
  '8xl': ['96px', { lineHeight: '1' }],
  '9xl': ['128px', { lineHeight: '1' }]
} as const;

export const GOTUN_FONT_WEIGHTS = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900'
} as const;

export const GOTUN_LINE_HEIGHTS = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2'
} as const;

// Z-Index Scale
export const GOTUN_Z_INDEX = {
  auto: 'auto',
  0: '0',
  10: '10',
  20: '20',
  30: '30',
  40: '40',
  50: '50',
  dropdown: '1000',
  sticky: '1020',
  fixed: '1030',
  modal: '1040',
  popover: '1050',
  tooltip: '1060',
  toast: '1070',
  overlay: '1080',
  max: '2147483647'
} as const;

// Animation Durations
export const GOTUN_ANIMATIONS = {
  none: '0ms',
  fast: '150ms',
  normal: '300ms',
  slow: '500ms',
  slower: '750ms',
  slowest: '1000ms'
} as const;

// Transition Easings
export const GOTUN_TRANSITIONS = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  'ease-in-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'ease-out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  'ease-in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  'ease-in-circ': 'cubic-bezier(0.55, 0, 1, 0.45)',
  'ease-out-circ': 'cubic-bezier(0, 0.55, 0.45, 1)',
  'ease-in-out-circ': 'cubic-bezier(0.85, 0, 0.15, 1)',
  'ease-in-expo': 'cubic-bezier(0.7, 0, 0.84, 0)',
  'ease-out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
  'ease-in-out-expo': 'cubic-bezier(0.87, 0, 0.13, 1)',
  'ease-in-quad': 'cubic-bezier(0.11, 0, 0.5, 0)',
  'ease-out-quad': 'cubic-bezier(0.5, 1, 0.89, 1)',
  'ease-in-out-quad': 'cubic-bezier(0.45, 0, 0.55, 1)',
  'ease-in-quart': 'cubic-bezier(0.5, 0, 0.75, 0)',
  'ease-out-quart': 'cubic-bezier(0.25, 1, 0.5, 1)',
  'ease-in-out-quart': 'cubic-bezier(0.76, 0, 0.24, 1)',
  'ease-in-quint': 'cubic-bezier(0.64, 0, 0.78, 0)',
  'ease-out-quint': 'cubic-bezier(0.22, 1, 0.36, 1)',
  'ease-in-out-quint': 'cubic-bezier(0.83, 0, 0.17, 1)',
  'ease-in-sine': 'cubic-bezier(0.12, 0, 0.39, 0)',
  'ease-out-sine': 'cubic-bezier(0.61, 1, 0.88, 1)',
  'ease-in-out-sine': 'cubic-bezier(0.37, 0, 0.63, 1)'
} as const;

// Component Sizes
export const GOTUN_SIZES = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl'
} as const;

// Component Variants
export const GOTUN_VARIANTS = {
  primary: 'primary',
  secondary: 'secondary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  neutral: 'neutral',
  ghost: 'ghost',
  outline: 'outline',
  solid: 'solid',
  soft: 'soft',
  gradient: 'gradient'
} as const;

// Layout Constants
export const GOTUN_LAYOUT = {
  sidebar: {
    width: '280px',
    collapsedWidth: '64px'
  },
  header: {
    height: '64px'
  },
  footer: {
    height: '48px'
  },
  content: {
    maxWidth: '1440px',
    padding: '24px'
  }
} as const;

// Performance Targets
export const GOTUN_PERFORMANCE = {
  animationDuration: 300,
  debounceDelay: 300,
  throttleDelay: 100,
  lazyLoadThreshold: 0.1,
  virtualScrollBuffer: 5,
  cacheSize: 100,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  imageOptimization: {
    quality: 85,
    format: 'webp',
    fallback: 'jpg'
  }
} as const;

// Accessibility Constants
export const GOTUN_A11Y = {
  focusRing: {
    width: '2px',
    style: 'solid',
    color: GOTUN_COLORS.primary[500],
    offset: '2px'
  },
  minTouchTarget: '44px',
  minContrastRatio: 4.5,
  reducedMotion: {
    duration: '0.01ms',
    easing: 'linear'
  }
} as const;

// Enterprise Feature Constants
export const GOTUN_ENTERPRISE = {
  pipeline: {
    maxStages: 10,
    maxDealsPerStage: 1000,
    autoSaveInterval: 30000 // 30 seconds
  },
  dashboard: {
    maxWidgets: 20,
    refreshInterval: 300000, // 5 minutes
    maxDataPoints: 1000
  },
  integrations: {
    maxConnections: 50,
    timeoutDuration: 30000,
    retryAttempts: 3
  },
  collaboration: {
    maxWorkspaces: 100,
    maxMembersPerWorkspace: 1000,
    messageHistoryLimit: 10000
  }
} as const;

// Warsaw District Constants
export const GOTUN_WARSAW = {
  districts: [
    'Śródmieście',
    'Mokotów',
    'Ochota',
    'Wola',
    'Żoliborz',
    'Praga-Północ',
    'Praga-Południe',
    'Targówek',
    'Rembertów',
    'Wawer',
    'Wilanów',
    'Ursynów',
    'Włochy',
    'Ursus',
    'Bemowo',
    'Bielany',
    'Białołęka'
  ],
  center: {
    lat: 52.2297,
    lng: 21.0122
  },
  bounds: {
    north: 52.3676,
    south: 52.0977,
    east: 21.2711,
    west: 20.8519
  }
} as const;

// HVAC Equipment Constants
export const GOTUN_HVAC = {
  equipmentTypes: [
    'split_ac',
    'central_ac',
    'heat_pump',
    'ventilation',
    'air_purifier',
    'humidifier',
    'dehumidifier'
  ],
  seasons: ['spring', 'summer', 'autumn', 'winter'],
  serviceTypes: [
    'installation',
    'maintenance',
    'repair',
    'inspection',
    'cleaning',
    'replacement'
  ]
} as const;
