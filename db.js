/**
 * @fileoverview Database helper functions for interacting with chrome.storage.local.
 */

/**
 * Saves or updates a vacancy's score and status in chrome.storage.local.
 * @param {string} vacancyId - The unique identifier for the vacancy.
 * @param {number} score - The score assigned to the vacancy.
 * @param {string} status - The current status of the vacancy (e.g., 'analyzed', 'applied', 'error').
 * @returns {Promise<void>} A promise that resolves when the data has been successfully saved.
 */
function setVacancyScore(vacancyId, score, status) {
  return new Promise((resolve) => {
    const vacancyData = {
      [`vacancy_${vacancyId}`]: {
        score,
        status,
        timestamp: new Date().toISOString()
      }
    };
    chrome.storage.local.set(vacancyData, () => {
      resolve();
    });
  });
}

/**
 * Retrieves the status and score for a specific vacancy from chrome.storage.local.
 * @param {string} vacancyId - The unique identifier for the vacancy.
 * @returns {Promise<object|undefined>} A promise that resolves with the vacancy data object
 * (containing score, status, and timestamp), or undefined if not found.
 */
function getVacancyStatus(vacancyId) {
  return new Promise((resolve) => {
    const key = `vacancy_${vacancyId}`;
    chrome.storage.local.get(key, (result) => {
      resolve(result[key]);
    });
  });
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { setVacancyScore, getVacancyStatus };
}
