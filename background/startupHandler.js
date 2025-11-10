/**
 * Startup Handler
 * Handles browser startup behavior
 */

import { storageService } from '../services/storageService.js';
import { templateManager } from '../services/templateManager.js';

class StartupHandler {
  /**
   * Handle browser startup
   */
  async handleStartup() {
    try {
      console.log('[StartupHandler] Handling browser startup');
      
      // Get user settings
      const settings = await storageService.getSettings();
      
      switch (settings.startupBehavior) {
        case 'show_selector':
          await this.showSelector();
          break;
        
        case 'auto_launch':
          await this.autoLaunchDefault(settings.defaultTemplateId);
          break;
        
        case 'none':
        default:
          console.log('[StartupHandler] Startup behavior: none');
          break;
      }
    } catch (error) {
      console.error('[StartupHandler] Error handling startup:', error);
    }
  }

  /**
   * Show template selector page
   */
  async showSelector() {
    try {
      console.log('[StartupHandler] Showing template selector');
      
      const url = chrome.runtime.getURL('startup/startup.html');
      await chrome.tabs.create({ url, active: true });
    } catch (error) {
      console.error('[StartupHandler] Failed to show selector:', error);
    }
  }

  /**
   * Auto-launch default template
   * @param {string} templateId - Default template ID
   */
  async autoLaunchDefault(templateId) {
    try {
      if (!templateId) {
        console.warn('[StartupHandler] No default template set');
        return;
      }

      console.log('[StartupHandler] Auto-launching default template:', templateId);
      
      // Check if template exists
      const template = await storageService.getTemplate(templateId);
      if (!template) {
        console.error('[StartupHandler] Default template not found:', templateId);
        return;
      }

      // Launch template with a slight delay to ensure browser is ready
      setTimeout(async () => {
        try {
          await templateManager.launchTemplate(templateId);
          console.log('[StartupHandler] Default template launched successfully');
        } catch (error) {
          console.error('[StartupHandler] Failed to launch default template:', error);
        }
      }, 500);
    } catch (error) {
      console.error('[StartupHandler] Error in auto-launch:', error);
    }
  }

  /**
   * Check if should show startup page
   * @returns {Promise<boolean>} True if should show
   */
  async shouldShowStartup() {
    try {
      const settings = await storageService.getSettings();
      return settings.startupBehavior === 'show_selector';
    } catch (error) {
      console.error('[StartupHandler] Error checking startup behavior:', error);
      return false;
    }
  }
}

// Export singleton instance
export const startupHandler = new StartupHandler();