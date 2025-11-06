/**
 * @fileoverview Logic for the extension's options page.
 * Handles saving the Qwen API key and processing the uploaded PDF resume.
 */

// We need a reference to the DOM elements.
let apiKeyInput, saveKeyButton, uploadPdfInput, pdfStatus;

/**
 * Initializes the options page by setting up DOM element references and event listeners.
 */
function init() {
  apiKeyInput = document.getElementById('apiKey');
  saveKeyButton = document.getElementById('saveKey');
  uploadPdfInput = document.getElementById('uploadPdf');
  pdfStatus = document.getElementById('pdfStatus');

  // Set the workerSrc for pdf.js from a CDN.
  if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js';
  }

  // Add event listeners
  saveKeyButton.addEventListener('click', saveApiKey);
  uploadPdfInput.addEventListener('change', handlePdfUpload);

  // Load initial settings
  loadSettings();
}


/**
 * Loads the saved API key and resume file name from chrome.storage.local
 * and populates the respective fields on the options page.
 */
function loadSettings() {
  chrome.storage.local.get(['apiKey', 'pdfResumeFileName'], (result) => {
    if (result.apiKey) {
      apiKeyInput.value = result.apiKey;
    }
    if (result.pdfResumeFileName) {
      pdfStatus.textContent = `Saved resume: ${result.pdfResumeFileName}`;
    }
  });
}

/**
 * Saves the entered Qwen API key to chrome.storage.local.
 */
function saveApiKey() {
  const apiKey = apiKeyInput.value;
  if (apiKey) {
    chrome.storage.local.set({ apiKey }, () => {
      alert('API Key saved!');
    });
  } else {
    alert('Please enter an API Key.');
  }
}

/**
 * Handles the PDF file upload. Reads the file, extracts the text content
 * using pdf.js, and saves it to chrome.storage.local.
 * @param {Event} event - The file input change event.
 */
function handlePdfUpload(event) {
  const file = event.target.files[0];
  if (file && file.type === 'application/pdf') {
    const reader = new FileReader();
    reader.onload = (e) => {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.getDocument(typedarray).promise.then(async (pdf) => {
        let textContent = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          textContent += text.items.map(item => item.str).join(' ');
        }

        chrome.storage.local.set({ pdfResumeText: textContent, pdfResumeFileName: file.name }, () => {
          pdfStatus.textContent = `Saved resume: ${file.name}`;
          alert('PDF Resume processed and text saved!');
        });
      });
    };
    reader.readAsArrayBuffer(file);
  } else {
    alert('Please select a PDF file.');
  }
}

// Initialize the script when the DOM is ready.
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', init);
}


// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { init, loadSettings, saveApiKey, handlePdfUpload };
}
