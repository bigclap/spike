import React, { useState, useEffect } from 'react';
import { ACTIONS } from '../common/actions';

const URLS = {
  RESUME: 'hh.ru/resume/',
  VACANCY_SEARCH: 'hh.ru/search/vacancy',
};

const Popup = () => {
  const [status, setStatus] = useState('Loading...');
  const [showStart, setShowStart] = useState(false);
  const [showStop, setShowStop] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [usageHint, setUsageHint] = useState('');

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab && tab.url) {
        if (tab.url.includes(URLS.RESUME)) {
          setShowSave(true);
        } else if (tab.url.includes(URLS.VACANCY_SEARCH)) {
          setShowStart(true);
        } else {
          setUsageHint('Navigate to a hh.ru resume or vacancy search page to use this extension.');
        }
      } else {
        setUsageHint('Navigate to a hh.ru resume or vacancy search page to use this extension.');
      }
    });

    chrome.runtime.sendMessage({ action: ACTIONS.GET_STATUS }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus('Error: ' + chrome.runtime.lastError.message);
      } else {
        setStatus(response.status);
        if (response.status === 'Running') {
          setShowStop(true);
          setShowStart(false);
        }
      }
    });
  }, []);

  const handleStart = () => {
    chrome.runtime.sendMessage({ action: ACTIONS.START }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus('Error: ' + chrome.runtime.lastError.message);
      } else {
        setStatus(response.status);
        if (response.status === 'Running') {
          setShowStop(true);
          setShowStart(false);
        }
      }
    });
  };

  const handleStop = () => {
    chrome.runtime.sendMessage({ action: ACTIONS.STOP }, (response) => {
      if (chrome.runtime.lastError) {
        setStatus('Error: ' + chrome.runtime.lastError.message);
      } else {
        setStatus(response.status);
        if (response.status === 'Stopped') {
          setShowStop(false);
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0] && tabs[0].url && tabs[0].url.includes(URLS.VACANCY_SEARCH)) {
              setShowStart(true);
            }
          });
        }
      }
    });
  };

  const handleSaveResume = () => {
    setStatus('Saving...');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab) {
        setStatus('Error: No active tab found.');
        return;
      }

      chrome.tabs.sendMessage(tab.id, { action: ACTIONS.GET_RESUME_DETAILS }, (response) => {
        if (chrome.runtime.lastError) {
          setStatus('Error: ' + chrome.runtime.lastError.message);
          console.error(chrome.runtime.lastError);
          return;
        }
        if (response.error) {
          setStatus('Error: ' + response.error);
          return;
        }

        chrome.runtime.sendMessage({ action: ACTIONS.SAVE_RESUME, resume: response.details }, (bgResponse) => {
          if (chrome.runtime.lastError) {
            setStatus('Error: ' + chrome.runtime.lastError.message);
          } else {
            setStatus(bgResponse.status);
          }
        });
      });
    });
  };

  return (
    <div className="container">
      <h1>HH.ru Vacancy Scorer</h1>
      {showSave && <button onClick={handleSaveResume}>Save Resume</button>}
      {showStart && <button onClick={handleStart}>Start</button>}
      {showStop && <button onClick={handleStop}>Stop</button>}
      {usageHint && <p>{usageHint}</p>}
      <div id="status">{status}</div>
    </div>
  );
};

export default Popup;
