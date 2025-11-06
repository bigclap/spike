// jest.setup.js
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        callback({});
      }),
      set: jest.fn((items, callback) => {
        callback();
      }),
    },
  },
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn()
  }
};

global.pdfjsLib = {
    GlobalWorkerOptions: {
        workerSrc: ''
    },
    getDocument: jest.fn(() => ({
        promise: Promise.resolve({
            numPages: 1,
            getPage: jest.fn(() => Promise.resolve({
                getTextContent: jest.fn(() => Promise.resolve({
                    items: [{ str: 'dummy text' }]
                }))
            }))
        })
    }))
};

global.alert = jest.fn();

global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
        output: {
            choices: [{
                message: {
                    content: "Mocked API response"
                }
            }]
        }
    }),
    text: () => Promise.resolve(''),
  })
);
