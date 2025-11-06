const { init, loadSettings, saveApiKey, handlePdfUpload } = require('./options.js');

describe('Options Page Logic', () => {

  beforeEach(() => {
    // Set up our document body
    document.body.innerHTML = `
      <input id="apiKey" type="text">
      <button id="saveKey"></button>
      <input id="uploadPdf" type="file">
      <p id="pdfStatus"></p>
    `;

    // Clear all mocks
    chrome.storage.local.get.mockClear();
    chrome.storage.local.set.mockClear();
    alert.mockClear();
    pdfjsLib.getDocument.mockClear();

    // Initialize the script
    init();
  });

  test('loadSettings should populate fields from storage', () => {
    // Simulate storage returning data
    chrome.storage.local.get.mock.calls[0][1]({
        apiKey: 'saved-key',
        pdfResumeFileName: 'resume.pdf'
    });

    expect(document.getElementById('apiKey').value).toBe('saved-key');
    expect(document.getElementById('pdfStatus').textContent).toBe('Saved resume: resume.pdf');
  });


  test('save button should save API key to storage', () => {
    const apiKeyInput = document.getElementById('apiKey');

    apiKeyInput.value = 'new-api-key';
    // Manually call the function since the event listener is in the script
    saveApiKey();

    expect(chrome.storage.local.set).toHaveBeenCalledTimes(1);
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ apiKey: 'new-api-key' }, expect.any(Function));

    // The callback to alert should be called
    chrome.storage.local.set.mock.calls[0][1](); // Manually invoke the callback
    expect(alert).toHaveBeenCalledWith('API Key saved!');
  });

  test('save button should alert if API key is empty', () => {
    document.getElementById('apiKey').value = '';
    saveApiKey();
    expect(alert).toHaveBeenCalledWith('Please enter an API Key.');
    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });


  test('PDF upload should process file and save text', async () => {
    const uploadInput = document.getElementById('uploadPdf');
    const mockFile = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });

    // Mock FileReader
    const mockReader = {
      readAsArrayBuffer: jest.fn(),
      onload: null,
      result: new ArrayBuffer(8)
    };
    global.FileReader = jest.fn(() => mockReader);

    // Simulate a file selection
    Object.defineProperty(uploadInput, 'files', {
        value: [mockFile],
    });

    // Trigger the change event
    const event = { target: uploadInput };
    handlePdfUpload(event);

    expect(mockReader.readAsArrayBuffer).toHaveBeenCalledWith(mockFile);

    // Manually trigger onload
    mockReader.onload({ target: { result: mockReader.result } });

    // Wait for promises to resolve
    await new Promise(process.nextTick);

    expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1);

    // Simulate the callback from set
    chrome.storage.local.set.mock.calls[0][1]();
    expect(alert).toHaveBeenCalledWith('PDF Resume processed and text saved!');
    expect(document.getElementById('pdfStatus').textContent).toBe('Saved resume: test.pdf');

  });

});
