/**
 * Storage Service
 * Handles all data persistence using Chrome Storage API
 */

import { STORAGE_KEYS, DEFAULT_SETTINGS, APP_INFO } from '../utils/constants.js';
import { validateTemplate, validateSettings } from '../utils/validator.js';
import { deepClone } from '../utils/helpers.js';

class StorageService {
  constructor() {
    this.cache = {
      templates: null,
      settings: null,
      lastFetch: null
    };
  }

  /**
   * Initialize storage with default values if empty
   */
  async initialize() {
    try {
      const data = await chrome.storage.sync.get([
        STORAGE_KEYS.TEMPLATES,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.VERSION
      ]);

      // Initialize templates if empty
      if (!data[STORAGE_KEYS.TEMPLATES]) {
        await chrome.storage.sync.set({
          [STORAGE_KEYS.TEMPLATES]: []
        });
      }

      // Initialize settings if empty
      if (!data[STORAGE_KEYS.SETTINGS]) {
        await chrome.storage.sync.set({
          [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
        });
      }

      // Set version
      if (!data[STORAGE_KEYS.VERSION]) {
        await chrome.storage.sync.set({
          [STORAGE_KEYS.VERSION]: APP_INFO.DATA_VERSION
        });
      }

      return true;
    } catch (error) {
      console.error('[StorageService] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Get all templates
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplates() {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.TEMPLATES);
      const templates = result[STORAGE_KEYS.TEMPLATES] || [];
      this.cache.templates = templates;
      this.cache.lastFetch = Date.now();
      return deepClone(templates);
    } catch (error) {
      console.error('[StorageService] Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Get single template by ID
   * @param {string} templateId - Template ID
   * @returns {Promise<Object|null>} Template object or null
   */
  async getTemplate(templateId) {
    try {
      const templates = await this.getTemplates();
      return templates.find(t => t.id === templateId) || null;
    } catch (error) {
      console.error('[StorageService] Failed to get template:', error);
      return null;
    }
  }

  /**
   * Save new template
   * @param {Object} template - Template object
   * @returns {Promise<boolean>} Success status
   */
  async saveTemplate(template) {
    try {
      // Validate template
      const validation = validateTemplate(template);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const templates = await this.getTemplates();
      templates.push(template);
      
      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: templates
      });

      this.cache.templates = templates;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to save template:', error);
      throw error;
    }
  }

  /**
   * Update existing template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<boolean>} Success status
   */
  async updateTemplate(templateId, updates) {
    try {
      const templates = await this.getTemplates();
      const index = templates.findIndex(t => t.id === templateId);
      
      if (index === -1) {
        throw new Error('Template not found');
      }

      // Merge updates with existing template
      templates[index] = { ...templates[index], ...updates };

      // Validate updated template
      const validation = validateTemplate(templates[index]);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: templates
      });

      this.cache.templates = templates;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to update template:', error);
      throw error;
    }
  }

  /**
   * Delete template
   * @param {string} templateId - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteTemplate(templateId) {
    try {
      const templates = await this.getTemplates();
      const filtered = templates.filter(t => t.id !== templateId);
      
      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: filtered
      });

      this.cache.templates = filtered;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Update template usage statistics
   * @param {string} templateId - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async updateTemplateUsage(templateId) {
    try {
      const templates = await this.getTemplates();
      const index = templates.findIndex(t => t.id === templateId);
      
      if (index === -1) {
        throw new Error('Template not found');
      }

      templates[index].lastUsedAt = new Date().toISOString();
      templates[index].usageCount = (templates[index].usageCount || 0) + 1;

      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: templates
      });

      this.cache.templates = templates;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to update template usage:', error);
      throw error;
    }
  }

  /**
   * Get settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
      const settings = result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
      this.cache.settings = settings;
      return deepClone(settings);
    } catch (error) {
      console.error('[StorageService] Failed to get settings:', error);
      return deepClone(DEFAULT_SETTINGS);
    }
  }

  /**
   * Update settings
   * @param {Object} updates - Settings updates
   * @returns {Promise<boolean>} Success status
   */
  async updateSettings(updates) {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...updates };

      // Validate settings
      const validation = validateSettings(newSettings);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: newSettings
      });

      this.cache.settings = newSettings;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to update settings:', error);
      throw error;
    }
  }

  /**
   * Reset settings to defaults
   * @returns {Promise<boolean>} Success status
   */
  async resetSettings() {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
      });

      this.cache.settings = DEFAULT_SETTINGS;
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to reset settings:', error);
      throw error;
    }
  }

  /**
   * Export all data
   * @returns {Promise<Object>} Export data object
   */
  async exportData() {
    try {
      const templates = await this.getTemplates();
      
      return {
        version: APP_INFO.DATA_VERSION,
        exportedAt: new Date().toISOString(),
        templates: templates
      };
    } catch (error) {
      console.error('[StorageService] Failed to export data:', error);
      throw error;
    }
  }

  /**
   * Import templates from export data
   * @param {Object} importData - Import data object
   * @param {boolean} merge - Merge with existing or replace
   * @returns {Promise<number>} Number of templates imported
   */
  async importData(importData, merge = true) {
    try {
      if (!importData.templates || !Array.isArray(importData.templates)) {
        throw new Error('Invalid import data format');
      }

      let templates = [];
      
      if (merge) {
        // Merge with existing templates
        templates = await this.getTemplates();
        
        // Add new templates (avoid duplicates by ID)
        const existingIds = new Set(templates.map(t => t.id));
        const newTemplates = importData.templates.filter(
          t => !existingIds.has(t.id)
        );
        
        templates = [...templates, ...newTemplates];
      } else {
        // Replace all templates
        templates = importData.templates;
      }

      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: templates
      });

      this.cache.templates = templates;
      return merge ? importData.templates.length : templates.length;
    } catch (error) {
      console.error('[StorageService] Failed to import data:', error);
      throw error;
    }
  }

  /**
   * Clear all templates
   * @returns {Promise<boolean>} Success status
   */
  async clearTemplates() {
    try {
      await chrome.storage.sync.set({
        [STORAGE_KEYS.TEMPLATES]: []
      });

      this.cache.templates = [];
      return true;
    } catch (error) {
      console.error('[StorageService] Failed to clear templates:', error);
      throw error;
    }
  }

  /**
   * Get storage usage info
   * @returns {Promise<Object>} Storage info
   */
  async getStorageInfo() {
    try {
      const bytesInUse = await chrome.storage.sync.getBytesInUse();
      const quota = chrome.storage.sync.QUOTA_BYTES;
      
      return {
        bytesInUse,
        quota,
        percentUsed: (bytesInUse / quota) * 100,
        available: quota - bytesInUse
      };
    } catch (error) {
      console.error('[StorageService] Failed to get storage info:', error);
      return null;
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = {
      templates: null,
      settings: null,
      lastFetch: null
    };
  }
}

// Export singleton instance
export const storageService = new StorageService();