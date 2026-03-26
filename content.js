// Content script for detecting and filling form fields

// Store detected fields
let detectedFields = [];

/**
 * Extract all form fields from the current page
 * @returns {Array} - Array of field objects
 */
function extractFormFields() {
  const fields = [];
  const fieldElements = document.querySelectorAll(
    'input:not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="hidden"]):not([type="image"]), select, textarea'
  );
  
  fieldElements.forEach((element, index) => {
    if (shouldExcludeField(element)) {
      return;
    }
    
    const fieldType = getFieldType(element);
    const fieldData = {
      index: index,
      selector: getElementSelector(element),
      xpath: getElementXPath(element),
      type: fieldType,
      name: element.name || '',
      id: element.id || '',
      label: getFieldLabel(element),
      placeholder: element.placeholder || '',
      value: element.value || '',
      validation: getValidationRules(element),
      options: getFieldOptions(element),
      autocomplete: element.autocomplete || ''
    };
    
    fields.push(fieldData);
  });
  
  detectedFields = fields;
  return fields;
}

/**
 * Fill a specific field with a value
 * @param {string} selector - CSS selector for the field
 * @param {*} value - Value to fill
 * @returns {boolean} - Success status
 */
function fillField(selector, value) {
  try {
    const element = document.querySelector(selector);
    if (!element) {
      return false;
    }
    
    const fieldType = getFieldType(element);
    
    // Handle different field types
    switch (fieldType) {
      case 'checkbox':
        element.checked = Boolean(value);
        break;
        
      case 'radio':
        if (element.value === value) {
          element.checked = true;
        } else {
          // Try to find the radio button with the matching value
          const radioGroup = document.querySelectorAll(`input[name="${element.name}"]`);
          radioGroup.forEach(radio => {
            if (radio.value === value) {
              radio.checked = true;
            }
          });
        }
        break;
        
      case 'select':
      case 'select-multiple':
        element.value = value;
        break;
        
      case 'date':
      case 'datetime-local':
      case 'time':
      case 'month':
      case 'week':
        element.value = value;
        break;
        
      default:
        element.value = value;
    }
    
    // Trigger events to ensure the page recognizes the change
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Fill multiple fields at once
 * @param {Object} fieldValues - Object with selectors as keys and values as values
 * @returns {Object} - Results object with success counts
 */
function fillMultipleFields(fieldValues) {
  const results = {
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const [selector, value] of Object.entries(fieldValues)) {
    const success = fillField(selector, value);
    if (success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ selector, value });
    }
  }
  
  return results;
}

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'extractFields':
      const fields = extractFormFields();
      sendResponse({ success: true, fields: fields });
      break;
      
    case 'fillField':
      const success = fillField(request.selector, request.value);
      sendResponse({ success: success });
      break;
      
    case 'fillMultiple':
      const results = fillMultipleFields(request.fieldValues);
      sendResponse({ success: true, results: results });
      break;
      
    case 'getDetectedFields':
      sendResponse({ success: true, fields: detectedFields });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep the message channel open for async response
});

// Auto-extract fields when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(extractFormFields, 500);
  });
} else {
  setTimeout(extractFormFields, 500);
}
