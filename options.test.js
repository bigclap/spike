const { init, loadSettings, saveData } = require('./options.js');

describe('Options Page Logic', () => {

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <input id="apiKey" type="text">
      <input id="modelName" type="text">
      <button id="saveKey"></button>
      <input id="apiEndpoint" type="text">
    `;

    // Clear all mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    alert.mockClear();

    // Initialize the script
    init();
  });

  test('loadSettings should populate fields from storage', () => {
    // Simulate storage returning data
    chrome.storage.local.get.mock.calls[0][1]({
        apiKey: 'saved-key',
        modelName: 'my-model',
        apiEndpoint: 'http://localhost/api'
    });

    expect(document.getElementById('apiKey').value).toBe('saved-key');
    expect(document.getElementById('modelName').value).toBe('my-model');
    expect(document.getElementById('apiEndpoint').value).toBe('http://localhost/api');
  });


  test('save button should save API key, model name, and API endpoint to storage', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const modelNameInput = document.getElementById('modelName');
    const apiEndpointInput = document.getElementById('apiEndpoint');

    apiKeyInput.value = 'new-api-key';
    modelNameInput.value = 'new-model';
    apiEndpointInput.value = 'http://new-endpoint';
    // Manually call the function since the event listener is in the script
    saveData();

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: 'new-api-key', modelName: 'new-model', apiEndpoint: 'http://new-endpoint' }, expect.any(Function));

    // The callback to alert should be called
    chrome.storage.local.set.mock.calls[0][1](); // Manually invoke the callback
    expect(alert).toHaveBeenCalledWith('Settings saved!');
  });

  test('save button should alert if API key is empty', () => {
    document.getElementById('apiKey').value = '';
    document.getElementById('modelName').value = 'some-model';
    document.getElementById('apiEndpoint').value = 'http://some-endpoint';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('save button should alert if model name is empty', () => {
    document.getElementById('apiKey').value = 'some-key';
    document.getElementById('modelName').value = '';
    document.getElementById('apiEndpoint').value = 'http://some-endpoint';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('save button should alert if api endpoint is empty', () => {
    document.getElementById('apiKey').value = 'some-key';
    document.getElementById('modelName').value = 'some-model';
    document.getElementById('apiEndpoint').value = '';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
});
