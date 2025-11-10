/**
 * Command Handler
 * Handles keyboard shortcuts and commands
 */

import { templateManager } from '../services/templateManager.js';

class CommandHandler {
  /**
   * Handle keyboard command
   * @param {string} command - Command name
   */
  async handleCommand(command) {
    try {
      console.log('[CommandHandler] Executing command:', command);
      
      switch (command) {
        case 'save-current-tabs':
          await this.saveCurrentTabs();
          break;
        
        case 'open-popup':
          await this.openPopup();
          break;
        
        default:
          console.warn('[CommandHandler] Unknown command:', command);
      }
    } catch (error) {
      console.error('[CommandHandler] Error handling command:', error);
    }
  }

  /**
   * Save current tabs with quick dialog
   */
  async saveCurrentTabs() {
    try {
      // Open popup and trigger save action
      // The popup will handle the actual save with user input
      await chrome.action.openPopup();
      
      // Send message to popup to trigger save dialog
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: 'TRIGGER_SAVE_CURRENT'
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log('[CommandHandler] Popup not ready yet');
          }
        });
      }, 100);
    } catch (error) {
      console.error('[CommandHandler] Failed to save current tabs:', error);
    }
  }

  /**
   * Open extension popup
   */
  async openPopup() {
    try {
      await chrome.action.openPopup();
    } catch (error) {
      console.error('[CommandHandler] Failed to open popup:', error);
      
      // Fallback: open in new tab if popup fails
      const url = chrome.runtime.getURL('popup/popup.html');
      await chrome.tabs.create({ url });
    }
  }

  /**
   * Quick launch a template by index or ID
   * @param {string|number} templateRef - Template ID or index
   */
  async quickLaunch(templateRef) {
    try {
      let templateId = templateRef;
      
      // If number, get template by index
      if (typeof templateRef === 'number') {
        const templates = await templateManager.getTemplates({ 
          sortBy: 'lastUsed',
          sortOrder: 'desc' 
        });
        
        if (templateRef < templates.length) {
          templateId = templates[templateRef].id;
        } else {
          throw new Error('Template index out of range');
        }
      }
      
      await templateManager.launchTemplate(templateId);
      console.log('[CommandHandler] Template launched:', templateId);
    } catch (error) {
      console.error('[CommandHandler] Failed to quick launch:', error);
    }
  }
}

// Export singleton instance
export const commandHandler = new CommandHandler();