/**
 * Input Validation Functions
 * Validates user input and data integrity
 */

import { UI, VALIDATION } from './constants.js';

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateUrl(url) {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  if (url.length > UI.MAX_URL_LENGTH) {
    return { isValid: false, error: 'URL is too long' };
  }

  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use http or https protocol' };
    }
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
}

/**
 * Validate template name
 * @param {string} name - Template name to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateTemplateName(name) {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Template name is required' };
  }

  const trimmedName = name.trim();
  
  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Template name cannot be empty' };
  }

  if (trimmedName.length > UI.MAX_TEMPLATE_NAME_LENGTH) {
    return { isValid: false, error: `Template name must be ${UI.MAX_TEMPLATE_NAME_LENGTH} characters or less` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate template description
 * @param {string} description - Description to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateDescription(description) {
  if (!description) {
    return { isValid: true, error: null }; // Description is optional
  }

  if (typeof description !== 'string') {
    return { isValid: false, error: 'Description must be a string' };
  }

  if (description.length > UI.MAX_DESCRIPTION_LENGTH) {
    return { isValid: false, error: `Description must be ${UI.MAX_DESCRIPTION_LENGTH} characters or less` };
  }

  return { isValid: true, error: null };
}

/**
 * Validate tab object
 * @param {Object} tab - Tab object to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateTab(tab) {
  if (!tab || typeof tab !== 'object') {
    return { isValid: false, error: 'Tab must be an object' };
  }

  const urlValidation = validateUrl(tab.url);
  if (!urlValidation.isValid) {
    return urlValidation;
  }

  if (!tab.title || typeof tab.title !== 'string') {
    return { isValid: false, error: 'Tab title is required' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate template object
 * @param {Object} template - Template object to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateTemplate(template) {
  if (!template || typeof template !== 'object') {
    return { isValid: false, error: 'Template must be an object' };
  }

  // Validate ID
  if (!template.id || typeof template.id !== 'string') {
    return { isValid: false, error: 'Template ID is required' };
  }

  // Validate name
  const nameValidation = validateTemplateName(template.name);
  if (!nameValidation.isValid) {
    return nameValidation;
  }

  // Validate tabs array
  if (!Array.isArray(template.tabs)) {
    return { isValid: false, error: 'Template tabs must be an array' };
  }

  // Validate each tab
  for (let i = 0; i < template.tabs.length; i++) {
    const tabValidation = validateTab(template.tabs[i]);
    if (!tabValidation.isValid) {
      return { 
        isValid: false, 
        error: `Tab ${i + 1}: ${tabValidation.error}` 
      };
    }
  }

  // Validate timestamps
  if (!template.createdAt || !isValidDate(template.createdAt)) {
    return { isValid: false, error: 'Invalid createdAt timestamp' };
  }

  if (template.lastUsedAt !== null && !isValidDate(template.lastUsedAt)) {
    return { isValid: false, error: 'Invalid lastUsedAt timestamp' };
  }

  // Validate usage count
  if (typeof template.usageCount !== 'number' || template.usageCount < 0) {
    return { isValid: false, error: 'Invalid usage count' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate settings object
 * @param {Object} settings - Settings object to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return { isValid: false, error: 'Settings must be an object' };
  }

  // Validate startupBehavior
  const validStartupBehaviors = ['none', 'show_selector', 'auto_launch'];
  if (!validStartupBehaviors.includes(settings.startupBehavior)) {
    return { isValid: false, error: 'Invalid startup behavior' };
  }

  // Validate openBehavior
  const validOpenBehaviors = ['new_window', 'current_window', 'replace_tabs'];
  if (!validOpenBehaviors.includes(settings.openBehavior)) {
    return { isValid: false, error: 'Invalid open behavior' };
  }

  // Validate sortBy
  const validSortBy = ['name', 'created', 'lastUsed', 'usageCount'];
  if (!validSortBy.includes(settings.sortBy)) {
    return { isValid: false, error: 'Invalid sort by value' };
  }

  // Validate sortOrder
  const validSortOrder = ['asc', 'desc'];
  if (!validSortOrder.includes(settings.sortOrder)) {
    return { isValid: false, error: 'Invalid sort order' };
  }

  // Validate theme
  const validThemes = ['auto', 'light', 'dark'];
  if (!validThemes.includes(settings.theme)) {
    return { isValid: false, error: 'Invalid theme' };
  }

  // Validate boolean fields
  if (typeof settings.closeExistingTabs !== 'boolean') {
    return { isValid: false, error: 'closeExistingTabs must be boolean' };
  }
  if (typeof settings.showFavicons !== 'boolean') {
    return { isValid: false, error: 'showFavicons must be boolean' };
  }
  if (typeof settings.confirmDelete !== 'boolean') {
    return { isValid: false, error: 'confirmDelete must be boolean' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate import data
 * @param {Object} data - Import data to validate
 * @returns {Object} { isValid: boolean, error: string }
 */
export function validateImportData(data) {
  if (!data || typeof data !== 'object') {
    return { isValid: false, error: 'Import data must be an object' };
  }

  if (!data.version || typeof data.version !== 'string') {
    return { isValid: false, error: 'Import data must have version' };
  }

  if (!Array.isArray(data.templates)) {
    return { isValid: false, error: 'Import data must have templates array' };
  }

  // Validate each template
  for (let i = 0; i < data.templates.length; i++) {
    const templateValidation = validateTemplate(data.templates[i]);
    if (!templateValidation.isValid) {
      return { 
        isValid: false, 
        error: `Template ${i + 1}: ${templateValidation.error}` 
      };
    }
  }

  return { isValid: true, error: null };
}

/**
 * Check if string is a valid date
 * @param {string} dateString - Date string to check
 * @returns {boolean} True if valid date
 */
function isValidDate(dateString) {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Sanitize template name
 * @param {string} name - Name to sanitize
 * @returns {string} Sanitized name
 */
export function sanitizeTemplateName(name) {
  return name
    .trim()
    .substring(0, UI.MAX_TEMPLATE_NAME_LENGTH)
    .replace(/[<>]/g, ''); // Remove potential XSS characters
}

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @returns {string} Sanitized URL
 */
export function sanitizeUrl(url) {
  return url.trim().substring(0, UI.MAX_URL_LENGTH);
}

/**
 * Check if templates array is valid
 * @param {Array} templates - Templates array
 * @returns {boolean} True if valid
 */
export function isValidTemplatesArray(templates) {
  if (!Array.isArray(templates)) return false;
  
  return templates.every(template => {
    const validation = validateTemplate(template);
    return validation.isValid;
  });
}