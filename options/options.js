/**
 * QuickSessions Options/Settings Page
 * Settings management and data operations
 */

import { storageService } from '../services/storageService.js';
import { templateManager } from '../services/templateManager.js';
import { downloadFile, readFile, calculateStorageSize } from '../utils/helpers.js';
import { MESSAGES, APP_INFO } from '../utils/constants.js';

// State
let currentSettings = null;
let confirmCallback = null;

// DOM Elements
const elements = {};

/**
 * Initialize options page
 */
async function init() {
  console.log('[Options] Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Load settings and populate form
  await loadSettings();
  
  // Load template info
  await loadTemplateInfo();
  
  // Attach event listeners
  attachEventListeners();
  
  console.log('[Options] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  // Startup behavior
  elements.startupBehaviorRadios = document.querySelectorAll('input[name="startupBehavior"]');
  elements.defaultTemplateGroup = document.getElementById('default-template-group');
  elements.defaultTemplateSelect = document.getElementById('default-template');
  
  // Opening behavior
  elements.openBehaviorRadios = document.querySelectorAll('input[name="openBehavior"]');
  elements.closeExistingTabs = document.getElementById('close-existing-tabs');
  
  // Display options
  elements.sortBy = document.getElementById('sort-by');
  elements.sortOrder = document.getElementById('sort-order');
  elements.showFavicons = document.getElementById('show-favicons');
  elements.confirmDelete = document.getElementById('confirm-delete');
  
  // Appearance
  elements.themeRadios = document.querySelectorAll('input[name="theme"]');
  
  // Data management
  elements.exportBtn = document.getElementById('export-btn');
  elements.importBtn = document.getElementById('import-btn');
  elements.importFile = document.getElementById('import-file');
  elements.templateCount = document.getElementById('template-count');
  elements.storageUsed = document.getElementById('storage-used');
  
  // Danger zone
  elements.resetSettingsBtn = document.getElementById('reset-settings-btn');
  elements.clearTemplatesBtn = document.getElementById('clear-templates-btn');
  
  // Toast
  elements.toast = document.getElementById('toast');
  elements.toastMessage = document.getElementById('toast-message');
  
  // Modal
  elements.confirmModal = document.getElementById('confirm-modal');
  elements.confirmTitle = document.getElementById('confirm-title');
  elements.confirmMessage = document.getElementById('confirm-message');
  elements.confirmOk = document.getElementById('confirm-ok');
  elements.confirmCancel = document.getElementById('confirm-cancel');
  
  // Help link
  elements.helpLink = document.getElementById('help-link');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Startup behavior
  elements.startupBehaviorRadios.forEach(radio => {
    radio.addEventListener('change', handleStartupBehaviorChange);
  });
  
  elements.defaultTemplateSelect.addEventListener('change', handleDefaultTemplateChange);
  
  // Opening behavior
  elements.openBehaviorRadios.forEach(radio => {
    radio.addEventListener('change', handleOpenBehaviorChange);
  });
  
  elements.closeExistingTabs.addEventListener('change', handleCloseExistingTabsChange);
  
  // Display options
  elements.sortBy.addEventListener('change', handleSortByChange);
  elements.sortOrder.addEventListener('change', handleSortOrderChange);
  elements.showFavicons.addEventListener('change', handleShowFaviconsChange);
  elements.confirmDelete.addEventListener('change', handleConfirmDeleteChange);
  
  // Appearance
  elements.themeRadios.forEach(radio => {
    radio.addEventListener('change', handleThemeChange);
  });
  
  // Data management
  elements.exportBtn.addEventListener('click', handleExport);
  elements.importBtn.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', handleImport);
  
  // Danger zone
  elements.resetSettingsBtn.addEventListener('click', handleResetSettings);
  elements.clearTemplatesBtn.addEventListener('click', handleClearTemplates);
  
  // Modal
  elements.confirmOk.addEventListener('click', handleConfirmOk);
  elements.confirmCancel.addEventListener('click', closeConfirmModal);
  elements.confirmModal.querySelector('.modal-backdrop').addEventListener('click', closeConfirmModal);
  
  // Help link
  elements.helpLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('README.md') });
  });
}

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    currentSettings = await storageService.getSettings();
    populateForm(currentSettings);
    
    // Load templates for default template select
    await loadDefaultTemplateOptions();
    
  } catch (error) {
    console.error('[Options] Failed to load settings:', error);
    showToast(MESSAGES.ERROR_LOAD, 'error');
  }
}

/**
 * Populate form with settings
 */
function populateForm(settings) {
  // Startup behavior
  const startupRadio = document.querySelector(`input[name="startupBehavior"][value="${settings.startupBehavior}"]`);
  if (startupRadio) startupRadio.checked = true;
  
  // Show/hide default template select
  toggleDefaultTemplateGroup(settings.startupBehavior === 'auto_launch');
  
  // Opening behavior
  const openRadio = document.querySelector(`input[name="openBehavior"][value="${settings.openBehavior}"]`);
  if (openRadio) openRadio.checked = true;
  
  elements.closeExistingTabs.checked = settings.closeExistingTabs;
  
  // Display options
  elements.sortBy.value = settings.sortBy;
  elements.sortOrder.value = settings.sortOrder;
  elements.showFavicons.checked = settings.showFavicons;
  elements.confirmDelete.checked = settings.confirmDelete;
  
  // Theme
  const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
  if (themeRadio) themeRadio.checked = true;
}

/**
 * Load template options for default template select
 */
async function loadDefaultTemplateOptions() {
  try {
    const templates = await templateManager.getTemplates({
      sortBy: 'name',
      sortOrder: 'asc'
    });
    
    elements.defaultTemplateSelect.innerHTML = '<option value="">Select a template...</option>';
    
    templates.forEach(template => {
      const option = document.createElement('option');
      option.value = template.id;
      option.textContent = template.name;
      
      if (template.id === currentSettings.defaultTemplateId) {
        option.selected = true;
      }
      
      elements.defaultTemplateSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('[Options] Failed to load templates:', error);
  }
}

/**
 * Load template info (count and storage)
 */
async function loadTemplateInfo() {
  try {
    const templates = await templateManager.getTemplates();
    elements.templateCount.textContent = templates.length;
    
    const storageInfo = await storageService.getStorageInfo();
    if (storageInfo) {
      const sizeKB = (storageInfo.bytesInUse / 1024).toFixed(2);
      elements.storageUsed.textContent = `${sizeKB} KB of ${(storageInfo.quota / 1024).toFixed(0)} KB`;
    }
    
  } catch (error) {
    console.error('[Options] Failed to load template info:', error);
  }
}

/**
 * Toggle default template group visibility
 */
function toggleDefaultTemplateGroup(show) {
  if (show) {
    elements.defaultTemplateGroup.classList.remove('hidden');
  } else {
    elements.defaultTemplateGroup.classList.add('hidden');
  }
}

/**
 * Handle startup behavior change
 */
async function handleStartupBehaviorChange(e) {
  const value = e.target.value;
  
  try {
    await storageService.updateSettings({ startupBehavior: value });
    toggleDefaultTemplateGroup(value === 'auto_launch');
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save startup behavior:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle default template change
 */
async function handleDefaultTemplateChange(e) {
  const templateId = e.target.value || null;
  
  try {
    await storageService.updateSettings({ defaultTemplateId: templateId });
    showToast('Default template updated', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save default template:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle open behavior change
 */
async function handleOpenBehaviorChange(e) {
  try {
    await storageService.updateSettings({ openBehavior: e.target.value });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save open behavior:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle close existing tabs change
 */
async function handleCloseExistingTabsChange(e) {
  try {
    await storageService.updateSettings({ closeExistingTabs: e.target.checked });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save setting:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle sort by change
 */
async function handleSortByChange(e) {
  try {
    await storageService.updateSettings({ sortBy: e.target.value });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save sort setting:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle sort order change
 */
async function handleSortOrderChange(e) {
  try {
    await storageService.updateSettings({ sortOrder: e.target.value });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save sort setting:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle show favicons change
 */
async function handleShowFaviconsChange(e) {
  try {
    await storageService.updateSettings({ showFavicons: e.target.checked });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save setting:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle confirm delete change
 */
async function handleConfirmDeleteChange(e) {
  try {
    await storageService.updateSettings({ confirmDelete: e.target.checked });
    showToast('Settings saved', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save setting:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle theme change
 */
async function handleThemeChange(e) {
  try {
    await storageService.updateSettings({ theme: e.target.value });
    showToast('Theme updated', 'success');
    
  } catch (error) {
    console.error('[Options] Failed to save theme:', error);
    showToast('Failed to save settings', 'error');
  }
}

/**
 * Handle export templates
 */
async function handleExport() {
  try {
    const data = await templateManager.exportTemplates();
    const json = JSON.stringify(data, null, 2);
    const filename = `quicksessions-export-${new Date().toISOString().split('T')[0]}.json`;
    
    downloadFile(json, filename, 'application/json');
    showToast(MESSAGES.EXPORT_SUCCESS, 'success');
    
  } catch (error) {
    console.error('[Options] Failed to export templates:', error);
    showToast(MESSAGES.ERROR_EXPORT, 'error');
  }
}

/**
 * Handle import templates
 */
async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const content = await readFile(file);
    const data = JSON.parse(content);
    
    // Validate import data
    if (!data.templates || !Array.isArray(data.templates)) {
      throw new Error('Invalid import file format');
    }
    
    // Ask for confirmation
    showConfirmModal(
      'Import Templates',
      `Import ${data.templates.length} template(s)? This will merge with existing templates.`,
      async () => {
        try {
          const count = await templateManager.importTemplates(data, true);
          showToast(`${count} template(s) imported successfully`, 'success');
          await loadTemplateInfo();
          await loadDefaultTemplateOptions();
        } catch (error) {
          console.error('[Options] Import failed:', error);
          showToast(MESSAGES.ERROR_IMPORT, 'error');
        }
      }
    );
    
  } catch (error) {
    console.error('[Options] Failed to read import file:', error);
    showToast('Invalid import file', 'error');
  } finally {
    // Reset file input
    e.target.value = '';
  }
}

/**
 * Handle reset settings
 */
function handleResetSettings() {
  showConfirmModal(
    'Reset Settings',
    'Reset all settings to default values? Templates will not be affected.',
    async () => {
      try {
        await storageService.resetSettings();
        await loadSettings();
        showToast('Settings reset to defaults', 'success');
      } catch (error) {
        console.error('[Options] Failed to reset settings:', error);
        showToast('Failed to reset settings', 'error');
      }
    }
  );
}

/**
 * Handle clear templates
 */
function handleClearTemplates() {
  showConfirmModal(
    'Delete All Templates',
    'Permanently delete all templates? This action cannot be undone!',
    async () => {
      try {
        await storageService.clearTemplates();
        await loadTemplateInfo();
        await loadDefaultTemplateOptions();
        showToast('All templates deleted', 'success');
      } catch (error) {
        console.error('[Options] Failed to clear templates:', error);
        showToast('Failed to delete templates', 'error');
      }
    }
  );
}

/**
 * Show confirmation modal
 */
function showConfirmModal(title, message, callback) {
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  confirmCallback = callback;
  elements.confirmModal.classList.add('visible');
}

/**
 * Close confirmation modal
 */
function closeConfirmModal() {
  elements.confirmModal.classList.remove('visible');
  confirmCallback = null;
}

/**
 * Handle confirm OK
 */
function handleConfirmOk() {
  if (confirmCallback) {
    confirmCallback();
  }
  closeConfirmModal();
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  elements.toast.className = 'toast visible';
  if (type) {
    elements.toast.classList.add(type);
  }
  
  elements.toastMessage.textContent = message;
  
  setTimeout(() => {
    elements.toast.classList.remove('visible');
  }, 3000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);