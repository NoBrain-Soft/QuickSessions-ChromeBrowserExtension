/**
 * Background Service Worker
 * Main entry point for extension background logic
 */

import { storageService } from '../services/storageService.js';
import { startupHandler } from './startupHandler.js';
import { commandHandler } from './commandHandler.js';

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('[Background] Extension installed:', details.reason);
  
  // Initialize storage first
  await storageService.initialize();
  console.log('[Background] Storage initialized');
  
  if (details.reason === 'install') {
    // First time installation - could open welcome page
    // await chrome.tabs.create({ url: 'options/options.html' });
  } else if (details.reason === 'update') {
    // Extension updated
    console.log('[Background] Extension updated to version:', chrome.runtime.getManifest().version);
  }
  
  // For development: trigger startup behavior after extension reload
  // In production, this only happens once per extension reload
  // Real browser startups are handled by onStartup below
  if (details.reason === 'install' || details.reason === 'update') {
    // Small delay to ensure storage is ready
    setTimeout(async () => {
      console.log('[Background] Triggering initial startup check');
      await startupHandler.handleStartup();
    }, 1000);
  }
});

// Handle browser startup (real browser start, not extension reload)
chrome.runtime.onStartup.addListener(async () => {
  console.log('[Background] Browser started');
  // Ensure storage is initialized
  await storageService.initialize();
  await startupHandler.handleStartup();
});

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command) => {
  console.log('[Background] Command received:', command);
  await commandHandler.handleCommand(command);
});

// Handle messages from popup/content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', request.type);
  
  // Handle async messages
  handleMessage(request, sender)
    .then(sendResponse)
    .catch(error => {
      console.error('[Background] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // Return true to indicate async response
  return true;
});

/**
 * Handle messages from other parts of the extension
 * @param {Object} request - Message request
 * @param {Object} sender - Message sender
 * @returns {Promise<Object>} Response
 */
async function handleMessage(request, sender) {
  switch (request.type) {
    case 'LAUNCH_TEMPLATE':
      return await handleLaunchTemplate(request.templateId);
    
    case 'SAVE_CURRENT_TABS':
      return await handleSaveCurrentTabs(request.name);
    
    case 'GET_STARTUP_BEHAVIOR':
      return await handleGetStartupBehavior();
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * Handle launch template message
 * @param {string} templateId - Template ID
 * @returns {Promise<Object>} Result
 */
async function handleLaunchTemplate(templateId) {
  try {
    const { templateManager } = await import('../services/templateManager.js');
    const result = await templateManager.launchTemplate(templateId);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle save current tabs message
 * @param {string} name - Template name
 * @returns {Promise<Object>} Result
 */
async function handleSaveCurrentTabs(name) {
  try {
    const { templateManager } = await import('../services/templateManager.js');
    const template = await templateManager.createFromCurrentTabs(name);
    return { success: true, template };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle get startup behavior message
 * @returns {Promise<Object>} Settings
 */
async function handleGetStartupBehavior() {
  try {
    const settings = await storageService.getSettings();
    return { success: true, settings };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Keep service worker alive (if needed)
// Chrome may put service worker to sleep after 30 seconds of inactivity
let keepAliveInterval;

function startKeepAlive() {
  if (!keepAliveInterval) {
    keepAliveInterval = setInterval(() => {
      // Ping to keep alive if needed
      chrome.runtime.getPlatformInfo(() => {
        // No-op, just to keep worker active
      });
    }, 20000); // Every 20 seconds
  }
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Don't keep alive by default - only when needed
// startKeepAlive();

console.log('[Background] Service worker initialized');