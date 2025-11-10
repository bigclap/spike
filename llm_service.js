/**
 * @fileoverview Background script for the HH.ru Vacancy Scorer extension.
 * Handles API calls to the local vLLM service and orchestrates the application process.
 */

let isRunning = false;
let status = 'Stopped';

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'start') {
    start(sendResponse);
  } else if (request.action === 'stop') {
    isRunning = false;
    status = 'Stopped';
    sendResponse({ status });
  } else if (request.action === 'getStatus') {
    sendResponse({ status });
  }
  return true;
});

async function start(sendResponse) {
  isRunning = true;
  console.log('Starting the vacancy scoring process.');

  // 1. Get the active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    console.error('No active tab found.');
    status = 'Error: No active tab';
    return;
  }

  // 2. Get the resume text
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'getResumeText' });
    if (response.error) {
      throw new Error(response.error);
    }
    const resumeText = response.resumeText;
    await chrome.storage.local.set({ resumeText });
    console.log('Resume text saved.');

    // 3. Get the list of vacancies
    const vacancies = await getVacancyLinks(tab.id, tab.url);
    console.log(`Found ${vacancies.length} vacancies.`);

    // 4. Loop through vacancies and process them
    for (const vacancy of vacancies) {
        if (!isRunning) break;

        const vacancyText = await getVacancyText(vacancy);
        if (!vacancyText) continue;

        const score = await getScore(vacancyText);
        console.log(`Vacancy score: ${score}`);

        if (score >= 4) {
            const coverLetter = await getCoverLetter(vacancyText);
            console.log(`Generated cover letter: ${coverLetter}`);
            // TODO: Apply with the cover letter
        }
    }

  } catch (error) {
    console.error('Error during the process:', error);
    status = `Error: ${error.message}`;
  } finally {
    if (isRunning) {
        status = 'Finished';
    }
  }
  sendResponse(status);
}

async function getVacancyLinks(tabId, url) {
    if (!url.includes('https://hh.ru/search/vacancy')) {
        throw new Error('This is not a vacancy search page.');
    }
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { action: 'getVacancies' }, (response) => {
            if (chrome.runtime.lastError) {
                return reject(new Error(chrome.runtime.lastError.message));
            }
            if (response.error) {
                return reject(new Error(response.error));
            }
            resolve(response.vacancies);
        });
    });
}

async function getVacancyText(vacancyUrl) {
    return new Promise(async (resolve, reject) => {
        const tab = await chrome.tabs.create({ url: vacancyUrl, active: false });
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: 'getVacancyContent' }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.vacancyText);
                    }
                    chrome.tabs.remove(tab.id);
                });
                chrome.tabs.onUpdated.removeListener(listener);
            }
        });
    });
}

async function getScore(vacancyText) {
    const { resumeText } = await chrome.storage.local.get('resumeText');
    const prompt = `Системная инструкция: Ты — HR-ассистент. Оцени соответствие резюме вакансии по шкале от 1 до 5. В ответе укажи только одну цифру без пояснений. \n\n### Резюме:\n${resumeText}\n\n### Вакансия:\n${vacancyText}\n\n### Оценка:`;
    let response = await callLlm(prompt);
    response = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return parseInt(response);
}

async function getCoverLetter(vacancyText) {
    const { resumeText } = await chrome.storage.local.get('resumeText');
    const prompt = `Системная инструкция: Ты — HR-ассистент. Напиши профессиональное и вежливое сопроводительное письмо на основе резюме для указанной вакансии. \n\n### Резюме:\n${resumeText}\n\n### Вакансия:\n${vacancyText}\n\n### Сопроводительное письмо:`;
    return callLlm(prompt);
}

async function callLlm(prompt) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['username', 'password', 'modelName', 'apiEndpoint'], async (result) => {
      try {
        const { username, password, modelName, apiEndpoint } = result;

        if (!username || !password || !modelName || !apiEndpoint) {
          throw new Error('All settings must be configured.');
        }

        const requestBody = {
          model: modelName,
          messages: [
            { "role": "system", "content": "You are a helpful assistant." },
            { "role": "user", "content": prompt }
          ]
        };

        const credentials = btoa(`${username}:${password}`);
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorBody = await response.text();
          throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();

        if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
            resolve(data.choices[0].message.content);
        } else {
            throw new Error('Unexpected API response structure.');
        }
      } catch (error) {
        console.error('Error calling local vLLM API:', error);
        reject(error);
      }
    });
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { callLlm, start, getScore, getCoverLetter };
}
