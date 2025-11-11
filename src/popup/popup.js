/**
 * @fileoverview Script for the popup UI.
 * Handles button clicks, communicates with the background script, and updates the UI state.
 */

/**
 * Actions for runtime messaging.
 * @enum {string}
 */
const ACTIONS = {
  START: 'start',
  STOP: 'stop',
  GET_STATUS: 'getStatus',
  SAVE_RESUME: 'saveResume',
  GET_RESUME_DETAILS: 'getResumeDetails',
};

/**
 * URL fragments for identifying page types.
 * @enum {string}
 */
const URLS = {
  RESUME: 'hh.ru/resume/',
  VACANCY_SEARCH: 'hh.ru/search/vacancy',
};

/**
 * Initializes the popup UI, sets up event listeners, and determines which controls to show.
 */
document.addEventListener('DOMContentLoaded', () => {
  const saveResumeButton = document.getElementById('saveResumeButton');
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const statusDiv = document.getElementById('status');
  const usageHint = document.getElementById('usageHint');

  // Hide all controls by default
  // saveResumeButton is hidden via inline style in the HTML for the primary workflow
  startButton.style.display = 'none';
  stopButton.style.display = 'none';
  usageHint.style.display = 'none';

  /**
   * Determines which UI controls to show based on the current tab's URL.
   */
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url) {
      if (tab.url.includes(URLS.RESUME)) {
        saveResumeButton.style.display = 'block';
      } else if (tab.url.includes(URLS.VACANCY_SEARCH)) {
        startButton.style.display = 'block';
      } else {
        usageHint.textContent = 'Navigate to a hh.ru resume or vacancy search page to use this extension.';
        usageHint.style.display = 'block';
      }
    } else {
        usageHint.textContent = 'Navigate to a hh.ru resume or vacancy search page to use this extension.';
        usageHint.style.display = 'block';
    }
  });

  /**
   * Handles the click event for the "Save Resume" button.
   * This is a secondary workflow for manually saving a resume.
   */
  saveResumeButton.addEventListener('click', () => {
    statusDiv.textContent = 'Saving...';
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        statusDiv.textContent = 'Error: No active tab found.';
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_RESUME_DETAILS }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          console.error(chrome.runtime.lastError);
          return;
        }
        if (response.error) {
          statusDiv.textContent = 'Error: ' + response.error;
          return;
        }

        chrome.runtime.sendMessage({ action: ACTIONS.SAVE_RESUME, resume: response.details }, (bgResponse) => {
          if (chrome.runtime.lastError) {
            statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          } else {
            statusDiv.textContent = bgResponse.status;
          }
        });
      });
    });
  });

  /**
   * Handles the click event for the "Start" button.
   */
  startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: ACTIONS.START }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
      } else {
        statusDiv.textContent = response.status;
        if (response.status === 'Running') {
            stopButton.style.display = 'block';
            startButton.style.display = 'none';
        }
      }
    });
  });

  /**
   * Handles the click event for the "Stop" button.
   */
  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: ACTIONS.STOP }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
      } else {
        statusDiv.textContent = response.status;
        if (response.status === 'Stopped') {
            stopButton.style.display = 'none';
            // Re-check URL to show the start button again if relevant
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes(URLS.VACANCY_SEARCH)) {
                    startButton.style.display = 'block';
                }
            });
        }
      }
    });
  });

  /**
   * Requests and displays the current status from the background script when the popup is opened.
   */
  chrome.runtime.sendMessage({ action: ACTIONS.GET_STATUS }, (response) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
    } else {
      statusDiv.textContent = response.status;
      if (response.status === 'Running') {
        stopButton.style.display = 'block';
        startButton.style.display = 'none';
      }
    }
  });
});

