document.addEventListener('DOMContentLoaded', () => {
  const startButton = document.getElementById('startButton');
  const stopButton = document.getElementById('stopButton');
  const statusDiv = document.getElementById('status');

  startButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'start' }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
      } else {
        statusDiv.textContent = response.status;
      }
    });
  });

  stopButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stop' }, (response) => {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
      } else {
        statusDiv.textContent = response.status;
      }
    });
  });

  // Request status on popup open
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (chrome.runtime.lastError) {
      statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
    } else {
      statusDiv.textContent = response.status;
    }
  });
});
