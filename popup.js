// Popup script for AI Form Autofill extension

let currentFields = [];
let generatedValues = {};

// DOM elements
const loadingContainer = document.getElementById('loadingContainer');
const noFieldsContainer = document.getElementById('noFieldsContainer');
const fieldsContainer = document.getElementById('fieldsContainer');
const fieldsList = document.getElementById('fieldsList');
const fieldCount = document.getElementById('fieldCount');
const statusContainer = document.getElementById('statusContainer');
const statusMessage = document.getElementById('statusMessage');
const refreshBtn = document.getElementById('refreshBtn');
const generateBtn = document.getElementById('generateBtn');
const fillAllBtn = document.getElementById('fillAllBtn');
const openSettings = document.getElementById('openSettings');

/**
 * Show a status message
 * @param {string} message - Message to display
 * @param {string} type - Message type ('info', 'error', 'success')
 */
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusContainer.className = 'status-container ' + type;
  statusContainer.classList.remove('hidden');
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    statusContainer.classList.add('hidden');
  }, 5000);
}

/**
 * Get icon SVG for field type
 * @param {string} type - Field type
 * @returns {string} - SVG HTML
 */
function getFieldIcon(type) {
  const icons = {
    email: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>',
    tel: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/></svg>',
    number: '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zM4 4h3a3 3 0 006 0h3a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm2.5 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9zM12 9a1 1 0 100 2h3a1 1 0 100-2h-3zm-1 4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z"/></svg>',
    checkbox: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>',
    radio: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-13a3 3 0 100 6 3 3 0 000-6z" clip-rule="evenodd"/></svg>',
    select: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/></svg>',
    date: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/></svg>',
    default: '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>'
  };
  
  return icons[type] || icons.default;
}

/**
 * Render a field item
 * @param {Object} field - Field object
 * @param {number} index - Field index
 * @returns {HTMLElement} - Field item element
 */
function renderFieldItem(field, index) {
  const item = document.createElement('div');
  item.className = 'field-item';
  item.dataset.selector = field.selector;
  
  const label = field.label || field.name || field.id || `Field ${index + 1}`;
  const icon = getFieldIcon(field.type);
  
  item.innerHTML = `
    <div class="field-header">
      <div class="field-icon" style="color: #667eea;">${icon}</div>
      <div class="field-info">
        <div class="field-label">${label}</div>
        <span class="field-type">${field.type}</span>
      </div>
    </div>
    <div class="field-value">
      <input 
        type="text" 
        class="field-input" 
        placeholder="Click 'Generate Values' to fill"
        disabled
      />
      <button class="btn btn-secondary btn-small fill-btn" disabled>Fill</button>
    </div>
  `;
  
  // Add fill button event listener
  const fillBtn = item.querySelector('.fill-btn');
  const input = item.querySelector('.field-input');
  
  fillBtn.addEventListener('click', async () => {
    const value = input.value;
    if (!value) return;
    
    fillBtn.disabled = true;
    fillBtn.textContent = 'Filling...';
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'fillField',
        selector: field.selector,
        value: value
      });
      
      if (response.success) {
        showStatus('Field filled successfully!', 'success');
        fillBtn.textContent = '✓ Filled';
        setTimeout(() => {
          fillBtn.textContent = 'Fill';
          fillBtn.disabled = false;
        }, 2000);
      } else {
        showStatus('Failed to fill field', 'error');
        fillBtn.textContent = 'Fill';
        fillBtn.disabled = false;
      }
    } catch (error) {
      showStatus('Error: ' + error.message, 'error');
      fillBtn.textContent = 'Fill';
      fillBtn.disabled = false;
    }
  });
  
  return item;
}

/**
 * Load and display form fields
 */
async function loadFields() {
  try {
    loadingContainer.classList.remove('hidden');
    noFieldsContainer.classList.add('hidden');
    fieldsContainer.classList.add('hidden');
    
    const response = await chrome.runtime.sendMessage({ action: 'getFields' });
    
    if (response.success && response.fields.length > 0) {
      currentFields = response.fields;
      fieldCount.textContent = currentFields.length;
      
      // Clear existing fields
      fieldsList.innerHTML = '';
      
      // Render fields
      currentFields.forEach((field, index) => {
        const fieldItem = renderFieldItem(field, index);
        fieldsList.appendChild(fieldItem);
      });
      
      loadingContainer.classList.add('hidden');
      fieldsContainer.classList.remove('hidden');
      generateBtn.disabled = false;
    } else {
      loadingContainer.classList.add('hidden');
      noFieldsContainer.classList.remove('hidden');
    }
  } catch (error) {
    loadingContainer.classList.add('hidden');
    showStatus('Error: ' + error.message, 'error');
    noFieldsContainer.classList.remove('hidden');
  }
}

/**
 * Generate values using AI
 */
async function generateValues() {
  if (currentFields.length === 0) return;
  
  generateBtn.disabled = true;
  generateBtn.innerHTML = '<div class="mini-spinner"></div> Generating...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'generateValues',
      fields: currentFields
    });
    
    if (response.success) {
      generatedValues = response.fieldValues;
      
      // Update field inputs with generated values
      currentFields.forEach(field => {
        const value = generatedValues[field.selector];
        if (value !== undefined) {
          const fieldItem = fieldsList.querySelector(`[data-selector="${CSS.escape(field.selector)}"]`);
          if (fieldItem) {
            const input = fieldItem.querySelector('.field-input');
            const fillBtn = fieldItem.querySelector('.fill-btn');
            
            input.value = value;
            input.disabled = false;
            fillBtn.disabled = false;
          }
        }
      });
      
      fillAllBtn.disabled = false;
      showStatus('Values generated successfully!', 'success');
    } else {
      showStatus('Error: ' + (response.error || 'Failed to generate values'), 'error');
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2L8 14M2 8L14 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg> Generate Values';
  }
}

/**
 * Fill all fields at once
 */
async function fillAllFields() {
  if (Object.keys(generatedValues).length === 0) return;
  
  fillAllBtn.disabled = true;
  fillAllBtn.textContent = 'Filling...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'fillAll',
      fieldValues: generatedValues
    });
    
    if (response.success) {
      const { results } = response;
      showStatus(`Filled ${results.success} fields successfully!${results.failed > 0 ? ` (${results.failed} failed)` : ''}`, 'success');
      fillAllBtn.textContent = '✓ All Fields Filled';
      
      setTimeout(() => {
        fillAllBtn.textContent = 'Fill All Fields';
        fillAllBtn.disabled = false;
      }, 3000);
    } else {
      showStatus('Failed to fill fields', 'error');
      fillAllBtn.textContent = 'Fill All Fields';
      fillAllBtn.disabled = false;
    }
  } catch (error) {
    showStatus('Error: ' + error.message, 'error');
    fillAllBtn.textContent = 'Fill All Fields';
    fillAllBtn.disabled = false;
  }
}

// Event listeners
refreshBtn.addEventListener('click', loadFields);
generateBtn.addEventListener('click', generateValues);
fillAllBtn.addEventListener('click', fillAllFields);
openSettings.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Initialize on popup open
loadFields();
