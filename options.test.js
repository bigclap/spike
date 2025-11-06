const { init, loadSettings, saveData } = require('./options.js');

describe('Options Page Logic', () => {

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <input id="apiKey" type="text">
      <input id="modelName" type="text">
      <textarea id="resumeText"></textarea>
      <button id="saveKey"></button>
      <p id="resumeStatus"></p>
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
        resumeText: 'My resume text.',
        modelName: 'my-model'
    });

    expect(document.getElementById('apiKey').value).toBe('saved-key');
    expect(document.getElementById('resumeText').value).toBe('My resume text.');
    expect(document.getElementById('modelName').value).toBe('my-model');
    expect(document.getElementById('resumeStatus').textContent).toBe('Resume text is saved.');
  });


  test('save button should save API key, model name, and resume text to storage', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const resumeTextInput = document.getElementById('resumeText');
    const modelNameInput = document.getElementById('modelName');

    apiKeyInput.value = 'new-api-key';
    resumeTextInput.value = 'New resume text.';
    modelNameInput.value = 'new-model';
    // Manually call the function since the event listener is in the script
    saveData();

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: 'new-api-key', resumeText: 'New resume text.', modelName: 'new-model' }, expect.any(Function));

    // The callback to alert should be called
    chrome.storage.local.set.mock.calls[0][1](); // Manually invoke the callback
    expect(alert).toHaveBeenCalledWith('API Key, model name, and resume text saved!');
    expect(document.getElementById('resumeStatus').textContent).toBe('Resume text is saved.');
  });

  test('save button should alert if API key is empty', () => {
    document.getElementById('apiKey').value = '';
    document.getElementById('resumeText').value = 'Some resume text.';
    document.getElementById('modelName').value = 'some-model';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('save button should alert if resume text is empty', () => {
    document.getElementById('apiKey').value = 'some-key';
    document.getElementById('resumeText').value = '';
    document.getElementById('modelName').value = 'some-model';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  test('save button should alert if model name is empty', () => {
    document.getElementById('apiKey').value = 'some-key';
    document.getElementById('resumeText').value = 'some-text';
    document.getElementById('modelName').value = '';
    saveData();
    expect(alert).toHaveBeenCalledWith('Please fill out all fields.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });
});
