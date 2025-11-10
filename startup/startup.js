/**
 * QuickSessions Startup Page
 * Template selector shown on browser start
 */

import { templateManager } from '../services/templateManager.js';
import { formatRelativeTime, escapeHtml } from '../utils/helpers.js';

// DOM Elements
const elements = {
  templatesGrid: null,
  emptyState: null,
  loading: null,
  skipBtn: null,
  settingsLink: null,
  createTemplateBtn: null
};

/**
 * Initialize startup page
 */
async function init() {
  console.log('[Startup] Initializing...');
  
  // Cache DOM elements
  cacheElements();
  
  // Attach event listeners
  attachEventListeners();
  
  // Load templates
  await loadTemplates();
  
  console.log('[Startup] Initialized');
}

/**
 * Cache DOM elements
 */
function cacheElements() {
  elements.templatesGrid = document.getElementById('templates-grid');
  elements.emptyState = document.getElementById('empty-state');
  elements.loading = document.getElementById('loading');
  elements.skipBtn = document.getElementById('skip-btn');
  elements.settingsLink = document.getElementById('settings-link');
  elements.createTemplateBtn = document.getElementById('create-template-btn');
}

/**
 * Attach event listeners
 */
function attachEventListeners() {
  elements.skipBtn.addEventListener('click', handleSkip);
  elements.settingsLink.addEventListener('click', handleSettings);
  elements.createTemplateBtn.addEventListener('click', handleCreateTemplate);
}

/**
 * Load templates
 */
async function loadTemplates() {
  try {
    showLoading(true);
    
    const templates = await templateManager.getTemplates({
      sortBy: 'lastUsed',
      sortOrder: 'desc'
    });
    
    if (templates.length === 0) {
      showEmptyState();
    } else {
      renderTemplates(templates);
    }
    
  } catch (error) {
    console.error('[Startup] Failed to load templates:', error);
    showEmptyState();
  } finally {
    showLoading(false);
  }
}

/**
 * Render templates
 */
function renderTemplates(templates) {
  elements.templatesGrid.innerHTML = '';
  elements.emptyState.classList.remove('visible');
  
  templates.forEach(template => {
    const card = createTemplateCard(template);
    elements.templatesGrid.appendChild(card);
  });
}

/**
 * Create template card
 */
function createTemplateCard(template) {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.dataset.templateId = template.id;
  
  const tabCount = template.tabs.length;
  const lastUsed = template.lastUsedAt 
    ? formatRelativeTime(template.lastUsedAt)
    : 'Never used';
  
  const icon = template.icon || '📑';
  
  card.innerHTML = `
    <div class="template-icon">${icon}</div>
    <div class="template-name" title="${escapeHtml(template.name)}">
      ${escapeHtml(template.name)}
    </div>
    ${template.description ? `
      <div class="template-description" title="${escapeHtml(template.description)}">
        ${escapeHtml(template.description)}
      </div>
    ` : ''}
    <div class="template-meta">
      <span class="template-meta-item">
        <span>📊</span>
        <span>${tabCount} tab${tabCount !== 1 ? 's' : ''}</span>
      </span>
      <span class="template-meta-item">
        <span>🕒</span>
        <span>${lastUsed}</span>
      </span>
    </div>
  `;
  
  card.addEventListener('click', () => launchTemplate(template.id));
  
  return card;
}

/**
 * Launch template
 */
async function launchTemplate(templateId) {
  try {
    await templateManager.launchTemplate(templateId);
    
    // Close this tab after short delay
    setTimeout(() => {
      window.close();
    }, 500);
    
  } catch (error) {
    console.error('[Startup] Failed to launch template:', error);
    alert('Failed to launch template. Please try again.');
  }
}

/**
 * Show empty state
 */
function showEmptyState() {
  elements.templatesGrid.innerHTML = '';
  elements.emptyState.classList.add('visible');
}

/**
 * Show loading state
 */
function showLoading(show) {
  if (show) {
    elements.loading.classList.add('visible');
    elements.templatesGrid.style.display = 'none';
    elements.emptyState.classList.remove('visible');
  } else {
    elements.loading.classList.remove('visible');
    elements.templatesGrid.style.display = 'grid';
  }
}

/**
 * Handle skip button
 */
function handleSkip() {
  window.close();
}

/**
 * Handle settings link
 */
function handleSettings(e) {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
  window.close();
}

/**
 * Handle create template button
 */
function handleCreateTemplate() {
  chrome.action.openPopup();
  window.close();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);