// Utility functions for the AI Form Autofill extension

/**
 * Generate a unique CSS selector for an element
 * @param {Element} element - The DOM element
 * @returns {string} - CSS selector string
 */
function getElementSelector(element) {
  if (element.id) {
    return `#${element.id}`;
  }
  
  let selector = element.tagName.toLowerCase();
  
  if (element.name) {
    selector += `[name="${element.name}"]`;
  } else if (element.className) {
    selector += `.${element.className.split(' ').join('.')}`;
  }
  
  // Add index if needed to make it unique
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(
      child => child.tagName === element.tagName
    );
    if (siblings.length > 1) {
      const index = siblings.indexOf(element);
      selector += `:nth-of-type(${index + 1})`;
    }
  }
  
  return selector;
}

/**
 * Generate an XPath for an element
 * @param {Element} element - The DOM element
 * @returns {string} - XPath string
 */
function getElementXPath(element) {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }
  
  if (element === document.body) {
    return '/html/body';
  }
  
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling === element) {
      return `${getElementXPath(element.parentNode)}/${element.tagName.toLowerCase()}[${ix + 1}]`;
    }
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
    }
  }
}

/**
 * Get the label text for a form field
 * @param {Element} element - The form field element
 * @returns {string} - Label text or empty string
 */
function getFieldLabel(element) {
  // Check for associated label using 'for' attribute
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) {
      return label.textContent.trim();
    }
  }
  
  // Check for parent label
  const parentLabel = element.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.replace(element.value, '').trim();
  }
  
  // Check for aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label');
  }
  
  // Check for placeholder as fallback
  if (element.placeholder) {
    return element.placeholder;
  }
  
  // Use name attribute as last resort
  return element.name || element.id || '';
}

/**
 * Extract validation requirements from a form field
 * @param {Element} element - The form field element
 * @returns {Object} - Validation rules
 */
function getValidationRules(element) {
  const rules = {};
  
  if (element.required) rules.required = true;
  if (element.pattern) rules.pattern = element.pattern;
  if (element.minLength) rules.minLength = element.minLength;
  if (element.maxLength) rules.maxLength = element.maxLength;
  if (element.min) rules.min = element.min;
  if (element.max) rules.max = element.max;
  if (element.step) rules.step = element.step;
  
  return rules;
}

/**
 * Get options for select, radio, or checkbox elements
 * @param {Element} element - The form field element
 * @returns {Array} - Array of option values
 */
function getFieldOptions(element) {
  const type = element.type || element.tagName.toLowerCase();
  
  if (type === 'select-one' || type === 'select-multiple') {
    return Array.from(element.options).map(opt => ({
      value: opt.value,
      text: opt.text,
      selected: opt.selected
    }));
  }
  
  if (type === 'radio' || type === 'checkbox') {
    const name = element.name;
    if (!name) return [];
    
    const group = document.querySelectorAll(`input[name="${name}"]`);
    return Array.from(group).map(input => ({
      value: input.value,
      checked: input.checked,
      label: getFieldLabel(input)
    }));
  }
  
  return [];
}

/**
 * Determine the field type category
 * @param {Element} element - The form field element
 * @returns {string} - Field type category
 */
function getFieldType(element) {
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'select') {
    return element.multiple ? 'select-multiple' : 'select';
  }
  
  if (tagName === 'textarea') {
    return 'textarea';
  }
  
  if (tagName === 'input') {
    return element.type || 'text';
  }
  
  return 'unknown';
}

/**
 * Check if a field should be excluded from autofill
 * @param {Element} element - The form field element
 * @returns {boolean} - True if field should be excluded
 */
function shouldExcludeField(element) {
  const excludedTypes = ['file', 'submit', 'button', 'reset', 'hidden', 'image'];
  const type = getFieldType(element);
  
  if (excludedTypes.includes(type)) {
    return true;
  }
  
  // Exclude disabled or readonly fields
  if (element.disabled || element.readOnly) {
    return true;
  }
  
  // Exclude invisible fields
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') {
    return true;
  }
  
  return false;
}

// Export for use in other scripts (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getElementSelector,
    getElementXPath,
    getFieldLabel,
    getValidationRules,
    getFieldOptions,
    getFieldType,
    shouldExcludeField
  };
}
