import React, { useState, useEffect } from 'react';

const Options = () => {
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [modelName, setModelName] = useState('Qwen/Qwen3-30B-A3B-Instruct-2507');

  useEffect(() => {
    chrome.storage.local.get(['username', 'password', 'modelName', 'apiEndpoint'], (result) => {
      if (result.username) {
        setUsername(result.username);
      }
      if (result.password) {
        setPassword(result.password);
      }
      if (result.modelName) {
        setModelName(result.modelName);
      }
      if (result.apiEndpoint) {
        setApiEndpoint(result.apiEndpoint);
      }
    });
  }, []);

  const handleSave = () => {
    if (username && password && modelName && apiEndpoint) {
      chrome.storage.local.set({ username, password, modelName, apiEndpoint }, () => {
        alert('Settings saved!');
      });
    } else {
      alert('Please fill out all fields.');
    }
  };

  return (
    <div className="container">
      <h1>HH.ru Vacancy Scorer Options</h1>
      <div className="input-group">
        <label htmlFor="apiEndpoint">Local LLM API Endpoint</label>
        <input
          type="text"
          id="apiEndpoint"
          placeholder="e.g., http://localhost:11434/api/generate"
          value={apiEndpoint}
          onChange={(e) => setApiEndpoint(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="username">Username</label>
        <input
          type="text"
          id="username"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label htmlFor="modelName">Model Name</label>
        <input
          type="text"
          id="modelName"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
        />
      </div>
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default Options;
