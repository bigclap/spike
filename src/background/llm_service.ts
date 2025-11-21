/**
 * @fileoverview Background script for the HH.ru Vacancy Scorer extension.
 * Handles API calls to the local vLLM service and orchestrates the application process.
 */

import { ACTIONS } from '../common/actions';
import { Resume, StoredResumes } from '../common/types';

let isRunning = false;
let status = 'Stopped';

chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response: any) => void) => {
  switch (request.action) {
    case ACTIONS.START:
      start(sendResponse);
      break;
    case ACTIONS.STOP:
      isRunning = false;
      status = 'Stopped';
      sendResponse({ status });
      break;
    case ACTIONS.GET_STATUS:
      sendResponse({ status });
      break;
    case ACTIONS.SAVE_RESUME:
      saveResume(request, sendResponse);
      break;
    default:
      // Optional: handle unknown actions
      break;
  }
  return true; // Keep the message channel open for asynchronous responses.
});

async function saveResume(request: { resume: Resume }, sendResponse: (response: { status: string }) => void): Promise<void> {
    status = 'Saving resume...';
    try {
        const { resume } = request;
        if (!resume || !resume.id) {
            throw new Error('Invalid resume data provided.');
        }

        const data: { resumes?: StoredResumes } = await chrome.storage.local.get('resumes');
        const resumes: StoredResumes = data.resumes || {};

        resumes[resume.id] = {
            title: resume.title,
            text: resume.text,
        };

        await chrome.storage.local.set({ resumes });
        status = `Resume "${resume.title}" saved.`;
        console.log(`Resume ${resume.id} saved.`);
    } catch (error: any) {
        console.error('Error saving resume:', error);
        status = `Error: ${error.message}`;
    }
    sendResponse({ status });
}

async function getResumeTextById(resumeId: string): Promise<string> {
    const data: { resumes?: StoredResumes } = await chrome.storage.local.get('resumes');
    const resumes: StoredResumes = data.resumes || {};
    if (resumes[resumeId]) {
        console.log(`Resume ${resumeId} found in storage.`);
        return resumes[resumeId].text;
    }

    console.log(`Resume ${resumeId} not in storage. Fetching...`);
    status = `Fetching resume ${resumeId}...`;

    const resumeUrl = `https://hh.ru/resume/${resumeId}`;
    const tab = await chrome.tabs.create({ url: resumeUrl, active: false });

    return new Promise<string>((resolve, reject) => {
        chrome.tabs.onUpdated.addListener(async function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener);
                try {
                    const response = await chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_RESUME_DETAILS });
                    if (response.error) throw new Error(response.error);

                    const { details } = response;
                    const data: { resumes?: StoredResumes } = await chrome.storage.local.get('resumes');
                    const resumes: StoredResumes = data.resumes || {};
                    resumes[details.id] = { title: details.title, text: details.text };
                    await chrome.storage.local.set({ resumes });

                    console.log(`Resume ${details.id} fetched and saved.`);
                    await chrome.tabs.remove(tab.id);
                    resolve(details.text);
                } catch (error) {
                    await chrome.tabs.remove(tab.id);
                    reject(error);
                }
            }
        });
    });
}

async function start(sendResponse: (response: { status: string }) => void): Promise<void> {
  isRunning = true;
  status = 'Running';
  console.log('Starting the vacancy scoring process.');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id || !tab.url) {
    console.error('No active tab found.');
    status = 'Error: No active tab';
    sendResponse({ status });
    return;
  }

  try {
    const url = new URL(tab.url);
    const resumeId = url.searchParams.get('resume');
    if (!resumeId) {
      throw new Error('No resume ID found in the URL (e.g., ?resume=RESUME_ID).');
    }

    const resumeText = await getResumeTextById(resumeId);
    const vacancies = await getVacancyLinks(tab.id, tab.url);
    console.log(`Found ${vacancies.length} vacancies.`);
    status = `Found ${vacancies.length} vacancies. Processing...`;
    sendResponse({ status });

    for (const vacancy of vacancies) {
        if (!isRunning) break;

        const vacancyText = await getVacancyText(vacancy);
        if (!vacancyText) continue;

        const score = await getScore(vacancyText, resumeText);
        console.log(`Vacancy score: ${score}`);

        if (score >= 4) {
            const coverLetter = await getCoverLetter(vacancyText, resumeText);
            console.log(`Generated cover letter: ${coverLetter}`);
            // TODO: Apply with the cover letter
        }
    }
    status = 'Finished';
  } catch (error: any) {
    console.error('Error during the process:', error);
    status = `Error: ${error.message}`;
  }
  sendResponse({status});
}

async function getVacancyLinks(tabId: number, url: string): Promise<string[]> {
    if (!url.includes('hh.ru/search/vacancy')) {
        throw new Error('This is not a vacancy search page.');
    }
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { action: ACTIONS.GET_VACANCIES }, (response) => {
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

async function getVacancyText(vacancyUrl: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        const tab = await chrome.tabs.create({ url: vacancyUrl, active: false });
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (info.status === 'complete' && tabId === tab.id) {
                chrome.tabs.onUpdated.removeListener(listener);
                chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_VACANCY_CONTENT }, (response) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else if (response.error) {
                        reject(new Error(response.error));
                    } else {
                        resolve(response.vacancyText);
                    }
                    chrome.tabs.remove(tab.id);
                });
            }
        });
    });
}

async function getScore(vacancyText: string, resumeText: string): Promise<number> {
    const prompt = `Системная инструкция: Ты — HR-ассистент. Оцени соответствие резюме вакансии по шкале от 1 до 5. В ответе укажи только одну цифру без пояснений. \n\n### Резюме:\n${resumeText}\n\n### Вакансия:\n${vacancyText}\n\n### Оценка:`;
    let response = await callLlm(prompt);
    response = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return parseInt(response, 10);
}

async function getCoverLetter(vacancyText: string, resumeText: string): Promise<string> {
    const prompt = `Системная инструкция: Ты — HR-ассистент. Напиши профессиональное и вежливое сопроводительное письмо на основе резюме для указанной вакансии. \n\n### Резюме:\n${resumeText}\n\n### Вакансия:\n${vacancyText}\n\n### Сопроводительное письмо:`;
    return callLlm(prompt);
}

async function callLlm(prompt: string): Promise<string> {
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
      } catch (error: any) {
        console.error('Error calling local vLLM API:', error);
        reject(error);
      }
    });
  });
}

export { callLlm };
