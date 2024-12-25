document.addEventListener('DOMContentLoaded', () => {
    // Load saved API key
    chrome.storage.sync.get(['realDebridApiKey'], (result) => {
      if (result.realDebridApiKey) {
        document.getElementById('apiKey').value = result.realDebridApiKey;
      }
    });

    // Save button click handler
    document.getElementById('saveBtn').addEventListener('click', async () => {
      const apiKey = document.getElementById('apiKey').value;

      
      chrome.storage.sync.set({ realDebridApiKey: apiKey }, () => {
        chrome.runtime.sendMessage({ action: 'setApiKey', realDebridApiKey: apiKey }, function(response) {
            console.log("Response from background:", response);
            window.close();
        });
      });

    });

    // Cancel button click handler
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.close();
    });
  });