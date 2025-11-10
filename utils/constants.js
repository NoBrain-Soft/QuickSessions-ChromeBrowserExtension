/**
 * Application Constants
 * Central location for all app-wide constants and configuration
 */

// Storage keys
export const STORAGE_KEYS = {
  TEMPLATES: 'quicksessions_templates',
  SETTINGS: 'quicksessions_settings',
  VERSION: 'quicksessions_version'
};

// Default settings
export const DEFAULT_SETTINGS = {
  startupBehavior: 'none', // 'none' | 'show_selector' | 'auto_launch'
  defaultTemplateId: null,
  openBehavior: 'new_window', // 'new_window' | 'current_window' | 'replace_tabs'
  closeExistingTabs: false,
  sortBy: 'lastUsed', // 'name' | 'created' | 'lastUsed' | 'usageCount'
  sortOrder: 'desc', // 'asc' | 'desc'
  theme: 'auto', // 'auto' | 'light' | 'dark'
  showFavicons: true,
  confirmDelete: true
};

// Application metadata
export const APP_INFO = {
  NAME: 'QuickSessions',
  VERSION: '1.0.0',
  DATA_VERSION: '1.0.0'
};

// UI Constants
export const UI = {
  POPUP_WIDTH: 400,
  POPUP_HEIGHT: 600,
  MAX_TEMPLATE_NAME_LENGTH: 50,
  MAX_DESCRIPTION_LENGTH: 200,
  MAX_URL_LENGTH: 2048,
  SEARCH_DEBOUNCE_MS: 300
};

// Template defaults
export const TEMPLATE = {
  DEFAULT_COLOR: '#4285F4', // Chrome blue
  DEFAULT_ICON: '📑',
  MAX_TABS: 100 // Reasonable limit for usability
};

// Messages and prompts
export const MESSAGES = {
  SAVE_SUCCESS: 'Template saved successfully',
  DELETE_SUCCESS: 'Template deleted',
  EXPORT_SUCCESS: 'Templates exported',
  IMPORT_SUCCESS: 'Templates imported successfully',
  ERROR_SAVE: 'Failed to save template',
  ERROR_LOAD: 'Failed to load templates',
  ERROR_DELETE: 'Failed to delete template',
  ERROR_EXPORT: 'Failed to export templates',
  ERROR_IMPORT: 'Failed to import templates',
  ERROR_INVALID_URL: 'Invalid URL',
  ERROR_NO_TABS: 'No tabs to save',
  CONFIRM_DELETE: 'Are you sure you want to delete this template?'
};

// Chrome colors palette (Material Design)
export const COLORS = {
  PRIMARY: '#4285F4',
  PRIMARY_HOVER: '#1a73e8',
  SUCCESS: '#34A853',
  ERROR: '#EA4335',
  WARNING: '#FBBC04',
  INFO: '#4285F4',
  
  // Template colors
  TEMPLATE_COLORS: [
    '#4285F4', // Blue
    '#EA4335', // Red
    '#34A853', // Green
    '#FBBC04', // Yellow
    '#9334E6', // Purple
    '#FF6D00', // Orange
    '#00ACC1', // Cyan
    '#7CB342'  // Light Green
  ]
};

// Emoji icons for templates (optional)
export const TEMPLATE_ICONS = [
  '💼', '🎓', '🎮', '🛒', '💻', '📚', '🎵', '🎨',
  '⚙️', '🔧', '🌐', '📱', '📊', '📈', '🗂️', '📑'
];

// Validation patterns
export const VALIDATION = {
  URL_PATTERN: /^https?:\/\/.+/,
  NAME_PATTERN: /^[\w\s\-_]+$/
};

// Storage limits (Chrome sync storage)
export const STORAGE_LIMITS = {
  SYNC_QUOTA_BYTES: 102400, // 100KB
  SYNC_ITEM_MAX_BYTES: 8192, // 8KB
  LOCAL_QUOTA_BYTES: 5242880 // 5MB
};