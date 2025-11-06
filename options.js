/**
 * @fileoverview Logic for the extension's options page.
 * Handles saving the local vLLM API key, model name, and resume text.
 */

// We need a reference to the DOM elements.
let apiKeyInput, saveKeyButton, resumeTextInput, resumeStatus, modelNameInput;

/**
 * Initializes the options page by setting up DOM element references and event listeners.
 */
function init() {
  apiKeyInput = document.getElementById('apiKey');
  saveKeyButton = document.getElementById('saveKey');
  resumeTextInput = document.getElementById('resumeText');
  resumeStatus = document.getElementById('resumeStatus');
  modelNameInput = document.getElementById('modelName');

  // Add event listeners
  saveKeyButton.addEventListener('click', saveData);

  // Load initial settings
  loadSettings();
}


/**
 * Loads the saved API key, model name, and resume text from chrome.storage.local
 * and populates the respective fields on the options page.
 */
function loadSettings() {
  chrome.storage.local.get(['apiKey', 'resumeText', 'modelName'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.resumeText) {
      resumeTextInput.value = result.resumeText;
      resumeStatus.textContent = 'Resume text is saved.';
    }
    if (result.modelName) {
      modelNameInput.value = result.modelName;
    }
  });
}

/**
 * Saves the entered API key, model name, and resume text to chrome.storage.local.
 */
function saveData() {
  const apiKey = apiKeyInput.value;
  const resumeText = resumeTextInput.value;
  const modelName = modelNameInput.value;
  if (apiKey && resumeText && modelName) {
    chrome.storage.local.set({ apiKey, resumeText, modelName }, () => {
      alert('API Key, model name, and resume text saved!');
      resumeStatus.textContent = 'Resume text is saved.';
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
