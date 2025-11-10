/**
 * Tab Service
 * Handles all tab operations using Chrome Tabs API
 */

import { validateUrl } from '../utils/validator.js';
import { getFaviconUrl } from '../utils/helpers.js';

class TabService {
  /**
   * Get all tabs in current window
   * @param {boolean} includeIncognito - Include incognito tabs
   * @returns {Promise<Array>} Array of tab objects
   */
  async getCurrentWindowTabs(includeIncognito = false) {
    try {
      const queryOptions = { currentWindow: true };
      
      const tabs = await chrome.tabs.query(queryOptions);
      
      // Filter out incognito tabs if not included
      const filteredTabs = includeIncognito 
        ? tabs 
        : tabs.filter(tab => !tab.incognito);

      return filteredTabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl || getFaviconUrl(tab.url)
      }));
    } catch (error) {
      console.error('[TabService] Failed to get current window tabs:', error);
      return [];
    }
  }

  /**
   * Get all tabs across all windows
   * @returns {Promise<Array>} Array of tab objects
   */
  async getAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      
      return tabs.map(tab => ({
        url: tab.url,
        title: tab.title,
        favicon: tab.favIconUrl || getFaviconUrl(tab.url),
        windowId: tab.windowId
      }));
    } catch (error) {
      console.error('[TabService] Failed to get all tabs:', error);
      return [];
    }
  }

  /**
   * Open tabs from template
   * @param {Array} tabs - Array of tab objects {url, title}
   * @param {string} openBehavior - 'new_window' | 'current_window' | 'replace_tabs'
   * @param {boolean} closeExisting - Close existing tabs when replacing
   * @returns {Promise<Object>} Result object
   */
  async openTabs(tabs, openBehavior = 'new_window', closeExisting = false) {
    try {
      if (!tabs || tabs.length === 0) {
        throw new Error('No tabs to open');
      }

      // Validate all URLs before opening
      for (const tab of tabs) {
        const validation = validateUrl(tab.url);
        if (!validation.isValid) {
          throw new Error(`Invalid URL: ${tab.url}`);
        }
      }

      let result = { success: true, openedTabs: 0 };

      switch (openBehavior) {
        case 'new_window':
          result = await this.openInNewWindow(tabs);
          break;
        
        case 'current_window':
          result = await this.openInCurrentWindow(tabs);
          break;
        
        case 'replace_tabs':
          result = await this.replaceTabs(tabs, closeExisting);
          break;
        
        default:
          throw new Error('Invalid open behavior');
      }

      return result;
    } catch (error) {
      console.error('[TabService] Failed to open tabs:', error);
      throw error;
    }
  }

  /**
   * Open tabs in a new window
   * @param {Array} tabs - Array of tab objects
   * @returns {Promise<Object>} Result object
   */
  async openInNewWindow(tabs) {
    try {
      // Create new window with first tab
      const newWindow = await chrome.windows.create({
        url: tabs[0].url,
        focused: true
      });

      // Open remaining tabs in the new window
      for (let i = 1; i < tabs.length; i++) {
        await chrome.tabs.create({
          windowId: newWindow.id,
          url: tabs[i].url,
          active: false
        });
      }

      return {
        success: true,
        openedTabs: tabs.length,
        windowId: newWindow.id
      };
    } catch (error) {
      console.error('[TabService] Failed to open in new window:', error);
      throw error;
    }
  }

  /**
   * Open tabs in current window
   * @param {Array} tabs - Array of tab objects
   * @returns {Promise<Object>} Result object
   */
  async openInCurrentWindow(tabs) {
    try {
      const currentWindow = await chrome.windows.getCurrent();

      // Open all tabs in current window
      for (const tab of tabs) {
        await chrome.tabs.create({
          windowId: currentWindow.id,
          url: tab.url,
          active: false
        });
      }

      return {
        success: true,
        openedTabs: tabs.length,
        windowId: currentWindow.id
      };
    } catch (error) {
      console.error('[TabService] Failed to open in current window:', error);
      throw error;
    }
  }

  /**
   * Replace current tabs with template tabs
   * @param {Array} tabs - Array of tab objects
   * @param {boolean} closeExisting - Close existing tabs
   * @returns {Promise<Object>} Result object
   */
  async replaceTabs(tabs, closeExisting = false) {
    try {
      const currentWindow = await chrome.windows.getCurrent();
      
      if (closeExisting) {
        // Get current tabs in window
        const currentTabs = await chrome.tabs.query({ 
          windowId: currentWindow.id 
        });

        // Close all current tabs except pinned ones
        const tabsToClose = currentTabs.filter(tab => !tab.pinned);
        for (const tab of tabsToClose) {
          await chrome.tabs.remove(tab.id);
        }
      }

      // Open new tabs
      for (const tab of tabs) {
        await chrome.tabs.create({
          windowId: currentWindow.id,
          url: tab.url,
          active: false
        });
      }

      return {
        success: true,
        openedTabs: tabs.length,
        windowId: currentWindow.id
      };
    } catch (error) {
      console.error('[TabService] Failed to replace tabs:', error);
      throw error;
    }
  }

  /**
   * Close tabs by IDs
   * @param {Array<number>} tabIds - Array of tab IDs
   * @returns {Promise<boolean>} Success status
   */
  async closeTabs(tabIds) {
    try {
      await chrome.tabs.remove(tabIds);
      return true;
    } catch (error) {
      console.error('[TabService] Failed to close tabs:', error);
      return false;
    }
  }

  /**
   * Get active tab
   * @returns {Promise<Object|null>} Active tab object
   */
  async getActiveTab() {
    try {
      const tabs = await chrome.tabs.query({ 
        active: true, 
        currentWindow: true 
      });
      
      if (tabs.length === 0) return null;

      return {
        url: tabs[0].url,
        title: tabs[0].title,
        favicon: tabs[0].favIconUrl || getFaviconUrl(tabs[0].url)
      };
    } catch (error) {
      console.error('[TabService] Failed to get active tab:', error);
      return null;
    }
  }

  /**
   * Create a new tab
   * @param {string} url - URL to open
   * @param {boolean} active - Make tab active
   * @returns {Promise<Object>} Created tab
   */
  async createTab(url, active = true) {
    try {
      const validation = validateUrl(url);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const tab = await chrome.tabs.create({ url, active });
      return tab;
    } catch (error) {
      console.error('[TabService] Failed to create tab:', error);
      throw error;
    }
  }

  /**
   * Duplicate a tab
   * @param {number} tabId - Tab ID to duplicate
   * @returns {Promise<Object>} Duplicated tab
   */
  async duplicateTab(tabId) {
    try {
      const tab = await chrome.tabs.duplicate(tabId);
      return tab;
    } catch (error) {
      console.error('[TabService] Failed to duplicate tab:', error);
      throw error;
    }
  }

  /**
   * Group tabs (Chrome 88+)
   * @param {Array<number>} tabIds - Tab IDs to group
   * @param {Object} options - Group options {title, color}
   * @returns {Promise<number>} Group ID
   */
  async groupTabs(tabIds, options = {}) {
    try {
      if (!chrome.tabs.group) {
        console.warn('[TabService] Tab grouping not supported');
        return null;
      }

      const groupId = await chrome.tabs.group({ tabIds });
      
      if (options.title || options.color) {
        await chrome.tabGroups.update(groupId, options);
      }

      return groupId;
    } catch (error) {
      console.error('[TabService] Failed to group tabs:', error);
      throw error;
    }
  }

  /**
   * Get tab count in current window
   * @returns {Promise<number>} Tab count
   */
  async getTabCount() {
    try {
      const tabs = await chrome.tabs.query({ currentWindow: true });
      return tabs.length;
    } catch (error) {
      console.error('[TabService] Failed to get tab count:', error);
      return 0;
    }
  }

  /**
   * Check if URL is valid for Chrome extension
   * @param {string} url - URL to check
   * @returns {boolean} True if valid
   */
  isValidUrl(url) {
    // Chrome extensions cannot open certain URLs
    const invalidProtocols = ['chrome:', 'chrome-extension:', 'about:', 'file:'];
    
    try {
      const urlObj = new URL(url);
      return !invalidProtocols.some(protocol => 
        urlObj.protocol.startsWith(protocol)
      );
    } catch {
      return false;
    }
  }

  /**
   * Filter out invalid URLs from tabs array
   * @param {Array} tabs - Array of tab objects
   * @returns {Array} Filtered tabs
   */
  filterValidTabs(tabs) {
    return tabs.filter(tab => this.isValidUrl(tab.url));
  }
}

// Export singleton instance
export const tabService = new TabService();