/**
 * @fileoverview Logic for the extension's options page.
 * Handles saving the local vLLM API key and model name.
 */

// We need a reference to the DOM elements.
let apiKeyInput, saveKeyButton, modelNameInput, apiEndpointInput;

/**
 * Initializes the options page by setting up DOM element references and event listeners.
 */
function init() {
  apiKeyInput = document.getElementById('apiKey');
  saveKeyButton = document.getElementById('saveKey');
  modelNameInput = document.getElementById('modelName');
  apiEndpointInput = document.getElementById('apiEndpoint');

  // Add event listeners
  saveKeyButton.addEventListener('click', saveData);

  // Load initial settings
  loadSettings();
}


/**
 * Loads the saved API key, model name, and API endpoint from chrome.storage.local
 * and populates the respective fields on the options page.
 */
function loadSettings() {
  chrome.storage.local.get(['apiKey', 'modelName', 'apiEndpoint'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.modelName) {
      modelNameInput.value = result.modelName;
    }
    if (result.apiEndpoint) {
      apiEndpointInput.value = result.apiEndpoint;
    }
  });
}

/**
 * Saves the entered API key, model name, and API endpoint to chrome.storage.local.
 */
function saveData() {
  const apiKey = apiKeyInput.value;
  const modelName = modelNameInput.value;
  const apiEndpoint = apiEndpointInput.value;
  if (apiKey && modelName && apiEndpoint) {
    chrome.storage.local.set({ apiKey, modelName, apiEndpoint }, () => {
      alert('Settings saved!');
    });
  } else {
    alert('Please fill out all fields.');
  }
}

// Initialize the script when the DOM is ready.
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}


// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { init, loadSettings, saveData };
}
