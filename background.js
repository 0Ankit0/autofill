// Background service worker for the AI Form Autofill extension

// Import AI service (note: In Manifest V3, we need to use importScripts)
importScripts('ai-service.js');

// Store for generated field values
let cachedFieldValues = {};
let cachedFields = [];

/**
 * Get the current active tab
 * @returns {Promise<Tab>} - The active tab
 */
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Send message to content script
 * @param {number} tabId - Tab ID
 * @param {Object} message - Message to send
 * @returns {Promise<Object>} - Response from content script
 */
async function sendMessageToTab(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return response;
  } catch (error) {
    // Try to inject content script if it's not already loaded
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['utils.js', 'content.js']
      });
      // Wait a bit for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
      // Try again
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (injectError) {
      throw new Error('Failed to communicate with page. Please refresh the page and try again.');
    }
  }
}

/**
 * Handle messages from popup and content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle async operations
  (async () => {
    try {
      switch (request.action) {
        case 'getFields':
          const tab = await getCurrentTab();
          const response = await sendMessageToTab(tab.id, { action: 'extractFields' });
          if (response.success) {
            cachedFields = response.fields;
            sendResponse({ success: true, fields: response.fields });
          } else {
            sendResponse({ success: false, error: 'Failed to extract fields' });
          }
          break;
          
        case 'generateValues':
          // Get settings (API key is optional for Hugging Face)
          const settings = await chrome.storage.sync.get(['apiKey', 'provider']);
          
          // Default to Hugging Face if no provider set
          const provider = settings.provider || 'huggingface';
          
          // Only require API key for Gemini and OpenAI
          if ((provider === 'gemini' || provider === 'openai') && !settings.apiKey) {
            sendResponse({ 
              success: false, 
              error: `Please configure your API key in the extension options for ${provider}`
            });
            break;
          }
          
          try {
            const fieldValues = await generateFieldValues(
              request.fields,
              settings.apiKey || null,
              provider
            );
            
            cachedFieldValues = fieldValues;
            sendResponse({ success: true, fieldValues: fieldValues });
          } catch (error) {
            sendResponse({ 
              success: false, 
              error: error.message || 'Failed to generate values'
            });
          }
          break;
          
        case 'fillField':
          const fillTab = await getCurrentTab();
          const fillResponse = await sendMessageToTab(fillTab.id, {
            action: 'fillField',
            selector: request.selector,
            value: request.value
          });
          sendResponse(fillResponse);
          break;
          
        case 'fillAll':
          const fillAllTab = await getCurrentTab();
          const fillAllResponse = await sendMessageToTab(fillAllTab.id, {
            action: 'fillMultiple',
            fieldValues: request.fieldValues
          });
          sendResponse(fillAllResponse);
          break;
          
        case 'getCachedData':
          sendResponse({ 
            success: true, 
            fields: cachedFields,
            fieldValues: cachedFieldValues
          });
          break;
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep the message channel open for async response
});

// Clear cache when tab is closed or changed
chrome.tabs.onActivated.addListener(() => {
  cachedFieldValues = {};
  cachedFields = [];
});

chrome.tabs.onRemoved.addListener(() => {
  cachedFieldValues = {};
  cachedFields = [];
});
