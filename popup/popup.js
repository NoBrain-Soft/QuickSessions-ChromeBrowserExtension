/**
 * QuickSessions Popup
 * Main UI logic and event handling
 */

import { templateManager } from '../services/templateManager.js';
import { tabService } from '../services/tabService.js';
import { storageService } from '../services/storageService.js';
import { 
  formatRelativeTime, 
  truncate, 
  debounce,
  getFaviconUrl,
  escapeHtml 
} from '../utils/helpers.js';
import { MESSAGES } from '../utils/constants.js';

// State
let currentTemplates = [];
let currentSort = { by: 'lastUsed', order: 'desc' };
let currentSearch = '';
let editingTemplateId = null;
let deletingTemplateId = null;

// DOM Elements
const elements = {
  // Containers
  templatesContainer: null,
  emptyState: null,
  loading: null,
  
  // Buttons
  settingsBtn: null,
  newTemplateBtn: null,
  saveCurrentBtn: null,
  emptySaveBtn: null,
  
  // Search
  searchInput: null,
  searchClearBtn: null,
  
  // Sort
  sortSelect: null,
  sortOrderBtn: null,
  
  // Modals
  saveModal: null,
  newModal: null,
  editModal: null,
  deleteModal: null,
  
  // Toast
  toast: null,
  toastMessage: null
};

/**
 * Initialize popup
 */
async function init() {
  console.log('[Popup] Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Attach event listeners
  attachEventListeners();
  
  // Load initial data
  await loadTemplates();
  
  // Check for trigger from keyboard shortcut
  checkForTrigger();
  
  console.log('[Popup] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  // Containers
  elements.templatesContainer = document.getElementById('templates-container');
  elements.emptyState = document.getElementById('empty-state');
  elements.loading = document.getElementById('loading');
  
  // Buttons
  elements.settingsBtn = document.getElementById('settings-btn');
  elements.newTemplateBtn = document.getElementById('new-template-btn');
  elements.saveCurrentBtn = document.getElementById('save-current-btn');
  elements.emptySaveBtn = document.getElementById('empty-save-btn');
  
  // Search
  elements.searchInput = document.getElementById('search-input');
  elements.searchClearBtn = document.getElementById('search-clear-btn');
  
  // Sort
  elements.sortSelect = document.getElementById('sort-select');
  elements.sortOrderBtn = document.getElementById('sort-order-btn');
  
  // Modals
  elements.saveModal = document.getElementById('save-modal');
  elements.newModal = document.getElementById('new-modal');
  elements.editModal = document.getElementById('edit-modal');
  elements.deleteModal = document.getElementById('delete-modal');
  
  // Toast
  elements.toast = document.getElementById('toast');
  elements.toastMessage = document.getElementById('toast-message');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  // Settings button
  elements.settingsBtn.addEventListener('click', openSettings);
  
  // Action buttons
  elements.newTemplateBtn.addEventListener('click', () => openModal('new-modal'));
  elements.saveCurrentBtn.addEventListener('click', () => openSaveCurrentModal());
  elements.emptySaveBtn.addEventListener('click', () => openSaveCurrentModal());
  
  // Search
  elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
  elements.searchClearBtn.addEventListener('click', clearSearch);
  
  // Sort
  elements.sortSelect.addEventListener('change', handleSortChange);
  elements.sortOrderBtn.addEventListener('click', toggleSortOrder);
  
  // Modal close buttons
  document.querySelectorAll('[data-modal]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modalId = e.target.getAttribute('data-modal');
      closeModal(modalId);
    });
  });
  
  // Modal confirm buttons
  document.getElementById('save-template-confirm').addEventListener('click', handleSaveCurrentConfirm);
  document.getElementById('new-template-confirm').addEventListener('click', handleNewTemplateConfirm);
  document.getElementById('edit-template-confirm').addEventListener('click', handleEditConfirm);
  document.getElementById('delete-template-confirm').addEventListener('click', handleDeleteConfirm);
  
  // Edit modal: Add tab button
  document.getElementById('add-tab-btn').addEventListener('click', showAddTabDialog);
  
  // Close modals on backdrop click
  document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
    backdrop.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) closeModal(modal.id);
    });
  });
  
  // Listen for messages from background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'TRIGGER_SAVE_CURRENT') {
      openSaveCurrentModal();
    }
  });
}

/**
 * Load templates from storage
 */
async function loadTemplates() {
  try {
    showLoading(true);
    
    const templates = await templateManager.getTemplates({
      sortBy: currentSort.by,
      sortOrder: currentSort.order,
      search: currentSearch
    });
    
    currentTemplates = templates;
    renderTemplates(templates);
    
  } catch (error) {
    console.error('[Popup] Failed to load templates:', error);
    showToast(MESSAGES.ERROR_LOAD, 'error');
  } finally {
    showLoading(false);
  }
}

/**
 * Render templates list
 */
function renderTemplates(templates) {
  elements.templatesContainer.innerHTML = '';
  
  if (templates.length === 0) {
    elements.emptyState.classList.add('visible');
    elements.templatesContainer.style.display = 'none';
    return;
  }
  
  elements.emptyState.classList.remove('visible');
  elements.templatesContainer.style.display = 'block';
  
  templates.forEach(template => {
    const card = createTemplateCard(template);
    elements.templatesContainer.appendChild(card);
  });
}

/**
 * Create template card element
 */
function createTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.dataset.templateId = template.id;
  
  const tabCount = template.tabs.length;
  const lastUsed = template.lastUsedAt 
    ? formatRelativeTime(template.lastUsedAt)
    : 'Never used';
  
  card.innerHTML = `
    <div class="template-header">
      <div class="template-info">
        <div class="template-name" title="${escapeHtml(template.name)}">
          ${escapeHtml(template.name)}
        </div>
        ${template.description ? `
          <div class="template-description" title="${escapeHtml(template.description)}">
            ${escapeHtml(template.description)}
          </div>
        ` : ''}
      </div>
      <div class="template-actions">
        <button class="template-action-btn launch" title="Launch template" data-action="launch">
          ▶️
        </button>
        <button class="template-action-btn edit" title="Edit template" data-action="edit">
          ✏️
        </button>
        <button class="template-action-btn delete" title="Delete template" data-action="delete">
          🗑️
        </button>
      </div>
    </div>
    <div class="template-meta">
      <span class="template-meta-item">${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
      <span class="template-meta-item">Last used ${lastUsed}</span>
    </div>
  `;
  
  // Attach action listeners
  card.querySelector('[data-action="launch"]').addEventListener('click', () => launchTemplate(template.id));
  card.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(template.id));
  card.querySelector('[data-action="delete"]').addEventListener('click', () => openDeleteModal(template.id));
  
  return card;
}

/**
 * Handle search input
 */
function handleSearch(e) {
  currentSearch = e.target.value;
  
  if (currentSearch) {
    elements.searchClearBtn.classList.add('visible');
  } else {
    elements.searchClearBtn.classList.remove('visible');
  }
  
  loadTemplates();
}

/**
 * Clear search
 */
function clearSearch() {
  elements.searchInput.value = '';
  currentSearch = '';
  elements.searchClearBtn.classList.remove('visible');
  loadTemplates();
}

/**
 * Handle sort change
 */
function handleSortChange(e) {
  currentSort.by = e.target.value;
  loadTemplates();
}

/**
 * Toggle sort order
 */
function toggleSortOrder() {
  currentSort.order = currentSort.order === 'asc' ? 'desc' : 'asc';
  elements.sortOrderBtn.classList.toggle('desc', currentSort.order === 'desc');
  loadTemplates();
}

/**
 * Open save current tabs modal
 */
async function openSaveCurrentModal() {
  try {
    const tabs = await tabService.getCurrentWindowTabs();
    const validTabs = tabService.filterValidTabs(tabs);
    
    if (validTabs.length === 0) {
      showToast(MESSAGES.ERROR_NO_TABS, 'error');
      return;
    }
    
    document.getElementById('save-tab-count').textContent = 
      `${validTabs.length} tab${validTabs.length !== 1 ? 's' : ''} will be saved`;
    
    openModal('save-modal');
    
    // Focus on name input
    setTimeout(() => {
      document.getElementById('save-template-name').focus();
    }, 100);
    
  } catch (error) {
    console.error('[Popup] Failed to get current tabs:', error);
    showToast('Failed to get current tabs', 'error');
  }
}

/**
 * Handle save current tabs confirm
 */
async function handleSaveCurrentConfirm() {
  const nameInput = document.getElementById('save-template-name');
  const descriptionInput = document.getElementById('save-template-description');
  
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!name) {
    nameInput.classList.add('error');
    showToast('Please enter a template name', 'error');
    return;
  }
  
  try {
    await templateManager.createFromCurrentTabs(name, description);
    
    closeModal('save-modal');
    nameInput.value = '';
    descriptionInput.value = '';
    nameInput.classList.remove('error');
    
    showToast(MESSAGES.SAVE_SUCCESS, 'success');
    await loadTemplates();
    
  } catch (error) {
    console.error('[Popup] Failed to save template:', error);
    showToast(error.message || MESSAGES.ERROR_SAVE, 'error');
  }
}

/**
 * Handle new template confirm
 */
async function handleNewTemplateConfirm() {
  const nameInput = document.getElementById('new-template-name');
  const descriptionInput = document.getElementById('new-template-description');
  
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!name) {
    nameInput.classList.add('error');
    showToast('Please enter a template name', 'error');
    return;
  }
  
  try {
    const template = await templateManager.createEmpty(name, description);
    
    closeModal('new-modal');
    nameInput.value = '';
    descriptionInput.value = '';
    nameInput.classList.remove('error');
    
    showToast('Template created', 'success');
    await loadTemplates();
    
    // Optionally open edit modal to add URLs
    setTimeout(() => openEditModal(template.id), 300);
    
  } catch (error) {
    console.error('[Popup] Failed to create template:', error);
    showToast(error.message || MESSAGES.ERROR_SAVE, 'error');
  }
}

/**
 * Open edit modal
 */
async function openEditModal(templateId) {
  try {
    const template = await templateManager.getTemplate(templateId);
    if (!template) {
      showToast('Template not found', 'error');
      return;
    }
    
    editingTemplateId = templateId;
    
    // Populate form
    document.getElementById('edit-template-name').value = template.name;
    document.getElementById('edit-template-description').value = template.description || '';
    
    // Render tabs
    renderEditTabs(template.tabs);
    
    openModal('edit-modal');
    
  } catch (error) {
    console.error('[Popup] Failed to open edit modal:', error);
    showToast('Failed to load template', 'error');
  }
}

/**
 * Render tabs in edit modal
 */
function renderEditTabs(tabs) {
  const tabsList = document.getElementById('edit-tabs-list');
  const tabCount = document.getElementById('edit-tab-count');
  
  tabCount.textContent = tabs.length;
  
  if (tabs.length === 0) {
    tabsList.innerHTML = '<div class="tabs-list-empty">No tabs yet. Click "Add URL" to add tabs.</div>';
    return;
  }
  
  tabsList.innerHTML = '';
  
  tabs.forEach((tab, index) => {
    const tabItem = createTabItem(tab, index);
    tabsList.appendChild(tabItem);
  });
}

/**
 * Create tab item element
 */
function createTabItem(tab, index) {
  const item = document.createElement('div');
  item.className = 'tab-item';
  item.dataset.index = index;
  
  const favicon = tab.favicon || getFaviconUrl(tab.url);
  
  item.innerHTML = `
    <div class="tab-item-icon">
      ${favicon ? `<img src="${favicon}" width="16" height="16" alt="">` : '🌐'}
    </div>
    <div class="tab-item-info">
      <div class="tab-item-title">${escapeHtml(tab.title || 'Untitled')}</div>
      <div class="tab-item-url">${escapeHtml(truncate(tab.url, 50))}</div>
    </div>
    <button class="tab-item-remove" title="Remove tab">×</button>
  `;
  
  item.querySelector('.tab-item-remove').addEventListener('click', () => removeTab(index));
  
  return item;
}

/**
 * Show add tab dialog
 */
function showAddTabDialog() {
  const url = prompt('Enter URL:', 'https://');
  if (!url) return;
  
  const title = prompt('Enter title (optional):', '');
  
  addTab({ url, title: title || url });
}

/**
 * Add tab to editing template
 */
async function addTab(tab) {
  try {
    await templateManager.addTab(editingTemplateId, tab);
    
    const template = await templateManager.getTemplate(editingTemplateId);
    renderEditTabs(template.tabs);
    
  } catch (error) {
    console.error('[Popup] Failed to add tab:', error);
    showToast(error.message || 'Failed to add tab', 'error');
  }
}

/**
 * Remove tab from editing template
 */
async function removeTab(index) {
  try {
    await templateManager.removeTab(editingTemplateId, index);
    
    const template = await templateManager.getTemplate(editingTemplateId);
    renderEditTabs(template.tabs);
    
  } catch (error) {
    console.error('[Popup] Failed to remove tab:', error);
    showToast('Failed to remove tab', 'error');
  }
}

/**
 * Handle edit confirm
 */
async function handleEditConfirm() {
  const nameInput = document.getElementById('edit-template-name');
  const descriptionInput = document.getElementById('edit-template-description');
  
  const name = nameInput.value.trim();
  const description = descriptionInput.value.trim();
  
  if (!name) {
    nameInput.classList.add('error');
    showToast('Please enter a template name', 'error');
    return;
  }
  
  try {
    await templateManager.updateTemplate(editingTemplateId, {
      name,
      description
    });
    
    closeModal('edit-modal');
    editingTemplateId = null;
    
    showToast('Template updated', 'success');
    await loadTemplates();
    
  } catch (error) {
    console.error('[Popup] Failed to update template:', error);
    showToast(error.message || 'Failed to update template', 'error');
  }
}

/**
 * Open delete modal
 */
async function openDeleteModal(templateId) {
  try {
    const template = await templateManager.getTemplate(templateId);
    if (!template) {
      showToast('Template not found', 'error');
      return;
    }
    
    deletingTemplateId = templateId;
    
    document.getElementById('delete-message').textContent = 
      `Are you sure you want to delete "${template.name}"?`;
    
    openModal('delete-modal');
    
  } catch (error) {
    console.error('[Popup] Failed to open delete modal:', error);
    showToast('Failed to load template', 'error');
  }
}

/**
 * Handle delete confirm
 */
async function handleDeleteConfirm() {
  try {
    await templateManager.deleteTemplate(deletingTemplateId);
    
    closeModal('delete-modal');
    deletingTemplateId = null;
    
    showToast(MESSAGES.DELETE_SUCCESS, 'success');
    await loadTemplates();
    
  } catch (error) {
    console.error('[Popup] Failed to delete template:', error);
    showToast('Failed to delete template', 'error');
  }
}

/**
 * Launch template
 */
async function launchTemplate(templateId) {
  try {
    await templateManager.launchTemplate(templateId);
    
    showToast('Template launched', 'success');
    
    // Close popup after short delay
    setTimeout(() => window.close(), 500);
    
  } catch (error) {
    console.error('[Popup] Failed to launch template:', error);
    showToast(error.message || 'Failed to launch template', 'error');
  }
}

/**
 * Open settings page
 */
function openSettings() {
  chrome.runtime.openOptionsPage();
  window.close();
}

/**
 * Open modal
 */
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('visible');
  }
}

/**
 * Close modal
 */
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('visible');
  }
}

/**
 * Show loading state
 */
function showLoading(show) {
  if (show) {
    elements.loading.classList.add('visible');
    elements.templatesContainer.style.display = 'none';
    elements.emptyState.classList.remove('visible');
  } else {
    elements.loading.classList.remove('visible');
  }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  elements.toastMessage.textContent = message;
  elements.toast.classList.add('visible');
  
  setTimeout(() => {
    elements.toast.classList.remove('visible');
  }, 3000);
}

/**
 * Check for trigger from keyboard shortcut
 */
function checkForTrigger() {
  // This will be called if popup was opened via keyboard shortcut
  // The background script can send a message to trigger save
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);