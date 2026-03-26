// Options page script for AI Form Autofill extension

const form = document.getElementById('settingsForm');
const alertBox = document.getElementById('alertBox');
const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('apiKey');
const apiKeyGroup = document.getElementById('apiKeyGroup');
const optionalLabel = document.getElementById('optionalLabel');

/**
 * Show an alert message
 * @param {string} message - Message to display
 * @param {string} type - Alert type ('success' or 'error')
 */
function showAlert(message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  alertBox.style.display = 'block';
  
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

/**
 * Update UI based on selected provider
 */
function updateProviderUI() {
  const provider = providerSelect.value;
  
  if (provider === 'chrome' || provider === 'huggingface') {
    optionalLabel.style.display = 'inline';
    apiKeyInput.placeholder = 'Not required for Chrome AI';
    apiKeyInput.required = false;
  } else {
    optionalLabel.style.display = 'none';
    apiKeyInput.placeholder = `Enter your ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API key`;
    apiKeyInput.required = true;
  }
}

/**
 * Load saved settings
 */
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get(['apiKey', 'provider']);
    
    if (settings.apiKey) {
      apiKeyInput.value = settings.apiKey;
    }
    
    if (settings.provider) {
      providerSelect.value = settings.provider;
    } else {
      providerSelect.value = 'chrome'; // Default to Chrome AI
    }
    
    updateProviderUI();
  } catch (error) {
    showAlert('Failed to load settings', 'error');
  }
}

/**
 * Save settings
 */
async function saveSettings(e) {
  e.preventDefault();
  
  const apiKey = apiKeyInput.value.trim();
  const provider = providerSelect.value;
  
  // API key is optional for Chrome AI
  if (!apiKey && provider !== 'chrome' && provider !== 'huggingface') {
    showAlert(`Please enter an API key for ${provider}`, 'error');
    return;
  }
  
  try {
    await chrome.storage.sync.set({
      apiKey: apiKey || '',
      provider: provider
    });
    
    showAlert('Settings saved successfully!', 'success');
  } catch (error) {
    showAlert('Failed to save settings: ' + error.message, 'error');
  }
}

// Event listeners
form.addEventListener('submit', saveSettings);
providerSelect.addEventListener('change', updateProviderUI);

// Load settings on page load
loadSettings();
