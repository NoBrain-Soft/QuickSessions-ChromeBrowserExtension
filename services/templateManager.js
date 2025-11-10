/**
 * Template Manager
 * Business logic for template operations
 */

import { storageService } from './storageService.js';
import { tabService } from './tabService.js';
import { generateUUID } from '../utils/helpers.js';
import { TEMPLATE, MESSAGES } from '../utils/constants.js';
import { 
  validateTemplateName, 
  validateTab,
  sanitizeTemplateName 
} from '../utils/validator.js';

class TemplateManager {
  /**
   * Create a new template from current tabs
   * @param {string} name - Template name
   * @param {string} description - Template description (optional)
   * @returns {Promise<Object>} Created template
   */
  async createFromCurrentTabs(name, description = '') {
    try {
      // Validate name
      const nameValidation = validateTemplateName(name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      // Get current tabs
      const tabs = await tabService.getCurrentWindowTabs();
      
      if (tabs.length === 0) {
        throw new Error(MESSAGES.ERROR_NO_TABS);
      }

      // Filter out invalid tabs
      const validTabs = tabService.filterValidTabs(tabs);
      
      if (validTabs.length === 0) {
        throw new Error('No valid tabs to save');
      }

      // Create template object
      const template = {
        id: generateUUID(),
        name: sanitizeTemplateName(name),
        description: description,
        color: TEMPLATE.DEFAULT_COLOR,
        icon: TEMPLATE.DEFAULT_ICON,
        tabs: validTabs,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0
      };

      // Save to storage
      await storageService.saveTemplate(template);

      return template;
    } catch (error) {
      console.error('[TemplateManager] Failed to create from current tabs:', error);
      throw error;
    }
  }

  /**
   * Create a new empty template
   * @param {string} name - Template name
   * @param {string} description - Template description (optional)
   * @returns {Promise<Object>} Created template
   */
  async createEmpty(name, description = '') {
    try {
      // Validate name
      const nameValidation = validateTemplateName(name);
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.error);
      }

      // Create template object
      const template = {
        id: generateUUID(),
        name: sanitizeTemplateName(name),
        description: description,
        color: TEMPLATE.DEFAULT_COLOR,
        icon: TEMPLATE.DEFAULT_ICON,
        tabs: [],
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0
      };

      // Save to storage
      await storageService.saveTemplate(template);

      return template;
    } catch (error) {
      console.error('[TemplateManager] Failed to create empty template:', error);
      throw error;
    }
  }

  /**
   * Get all templates
   * @param {Object} options - Query options {sortBy, sortOrder, search}
   * @returns {Promise<Array>} Array of templates
   */
  async getTemplates(options = {}) {
    try {
      let templates = await storageService.getTemplates();

      // Apply search filter
      if (options.search) {
        const searchTerm = options.search.toLowerCase();
        templates = templates.filter(t => 
          t.name.toLowerCase().includes(searchTerm) ||
          (t.description && t.description.toLowerCase().includes(searchTerm))
        );
      }

      // Apply sorting
      if (options.sortBy) {
        templates = this.sortTemplates(templates, options.sortBy, options.sortOrder);
      }

      return templates;
    } catch (error) {
      console.error('[TemplateManager] Failed to get templates:', error);
      return [];
    }
  }

  /**
   * Get single template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object|null>} Template object
   */
  async getTemplate(templateId) {
    try {
      return await storageService.getTemplate(templateId);
    } catch (error) {
      console.error('[TemplateManager] Failed to get template:', error);
      return null;
    }
  }

  /**
   * Update template
   * @param {string} templateId - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<boolean>} Success status
   */
  async updateTemplate(templateId, updates) {
    try {
      // Validate name if provided
      if (updates.name) {
        const nameValidation = validateTemplateName(updates.name);
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.error);
        }
        updates.name = sanitizeTemplateName(updates.name);
      }

      // Validate tabs if provided
      if (updates.tabs) {
        for (const tab of updates.tabs) {
          const tabValidation = validateTab(tab);
          if (!tabValidation.isValid) {
            throw new Error(tabValidation.error);
          }
        }
      }

      await storageService.updateTemplate(templateId, updates);
      return true;
    } catch (error) {
      console.error('[TemplateManager] Failed to update template:', error);
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
      await storageService.deleteTemplate(templateId);
      return true;
    } catch (error) {
      console.error('[TemplateManager] Failed to delete template:', error);
      throw error;
    }
  }

  /**
   * Add tab to template
   * @param {string} templateId - Template ID
   * @param {Object} tab - Tab object {url, title, favicon}
   * @returns {Promise<boolean>} Success status
   */
  async addTab(templateId, tab) {
    try {
      // Validate tab
      const tabValidation = validateTab(tab);
      if (!tabValidation.isValid) {
        throw new Error(tabValidation.error);
      }

      const template = await storageService.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Check tab limit
      if (template.tabs.length >= TEMPLATE.MAX_TABS) {
        throw new Error(`Maximum ${TEMPLATE.MAX_TABS} tabs per template`);
      }

      template.tabs.push(tab);
      await storageService.updateTemplate(templateId, { tabs: template.tabs });
      
      return true;
    } catch (error) {
      console.error('[TemplateManager] Failed to add tab:', error);
      throw error;
    }
  }

  /**
   * Remove tab from template
   * @param {string} templateId - Template ID
   * @param {number} tabIndex - Index of tab to remove
   * @returns {Promise<boolean>} Success status
   */
  async removeTab(templateId, tabIndex) {
    try {
      const template = await storageService.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (tabIndex < 0 || tabIndex >= template.tabs.length) {
        throw new Error('Invalid tab index');
      }

      template.tabs.splice(tabIndex, 1);
      await storageService.updateTemplate(templateId, { tabs: template.tabs });
      
      return true;
    } catch (error) {
      console.error('[TemplateManager] Failed to remove tab:', error);
      throw error;
    }
  }

  /**
   * Launch template (open all tabs)
   * @param {string} templateId - Template ID
   * @param {Object} options - Open options from settings
   * @returns {Promise<Object>} Result object
   */
  async launchTemplate(templateId, options = {}) {
    try {
      const template = await storageService.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      if (template.tabs.length === 0) {
        throw new Error('Template has no tabs');
      }

      // Get default options from settings if not provided
      if (!options.openBehavior) {
        const settings = await storageService.getSettings();
        options = {
          openBehavior: settings.openBehavior,
          closeExisting: settings.closeExistingTabs
        };
      }

      // Open tabs
      const result = await tabService.openTabs(
        template.tabs,
        options.openBehavior,
        options.closeExisting
      );

      // Update usage statistics
      await storageService.updateTemplateUsage(templateId);

      return result;
    } catch (error) {
      console.error('[TemplateManager] Failed to launch template:', error);
      throw error;
    }
  }

  /**
   * Duplicate template
   * @param {string} templateId - Template ID
   * @returns {Promise<Object>} Duplicated template
   */
  async duplicateTemplate(templateId) {
    try {
      const template = await storageService.getTemplate(templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      const duplicate = {
        ...template,
        id: generateUUID(),
        name: `${template.name} (Copy)`,
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
        usageCount: 0
      };

      await storageService.saveTemplate(duplicate);
      return duplicate;
    } catch (error) {
      console.error('[TemplateManager] Failed to duplicate template:', error);
      throw error;
    }
  }

  /**
   * Sort templates
   * @param {Array} templates - Templates array
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - 'asc' or 'desc'
   * @returns {Array} Sorted templates
   */
  sortTemplates(templates, sortBy = 'lastUsed', sortOrder = 'desc') {
    const sorted = [...templates].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        
        case 'created':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        
        case 'lastUsed':
          aValue = a.lastUsedAt ? new Date(a.lastUsedAt) : new Date(0);
          bValue = b.lastUsedAt ? new Date(b.lastUsedAt) : new Date(0);
          break;
        
        case 'usageCount':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  /**
   * Get template statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const templates = await storageService.getTemplates();
      
      const totalTabs = templates.reduce((sum, t) => sum + t.tabs.length, 0);
      const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);
      const mostUsed = templates.length > 0 
        ? templates.reduce((max, t) => t.usageCount > max.usageCount ? t : max)
        : null;

      return {
        totalTemplates: templates.length,
        totalTabs,
        totalUsage,
        averageTabsPerTemplate: templates.length > 0 
          ? (totalTabs / templates.length).toFixed(1)
          : 0,
        mostUsedTemplate: mostUsed
      };
    } catch (error) {
      console.error('[TemplateManager] Failed to get statistics:', error);
      return null;
    }
  }

  /**
   * Export templates
   * @returns {Promise<Object>} Export data
   */
  async exportTemplates() {
    try {
      return await storageService.exportData();
    } catch (error) {
      console.error('[TemplateManager] Failed to export templates:', error);
      throw error;
    }
  }

  /**
   * Import templates
   * @param {Object} importData - Import data
   * @param {boolean} merge - Merge with existing
   * @returns {Promise<number>} Number of templates imported
   */
  async importTemplates(importData, merge = true) {
    try {
      return await storageService.importData(importData, merge);
    } catch (error) {
      console.error('[TemplateManager] Failed to import templates:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const templateManager = new TemplateManager();