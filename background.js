// background.js

let realDebridApiKey

chrome.storage.sync.get(['realDebridApiKey'], (result) => {
    if (result.realDebridApiKey) {
        realDebridApiKey= result.realDebridApiKey;
    }

    async function unrestrictLink(url) {
        const API_ENDPOINT = 'https://api.real-debrid.com/rest/1.0/unrestrict/link';

        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `link=${encodeURIComponent(url)}`
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error during link debriding: ${errorData.error || response.statusText}`);
            }

            const reponseContent = await response.json();

            sendMessageToTab(`Link debrided : ${JSON.stringify(reponseContent)}`);

            return reponseContent
        } catch (error) {
            console.error('Error unrestricting link:', error);
            throw error;
        }
    }






    // Add these functions to your background.js

    async function addTorrent(magnetLink) {
        const ADD_MAGNET_ENDPOINT = 'https://api.real-debrid.com/rest/1.0/torrents/addMagnet';

        try {
            const response = await fetch(ADD_MAGNET_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `magnet=${encodeURIComponent(magnetLink)}`
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error adding torrent: ${errorData.error || response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error adding torrent:', error);
            throw error;
        }
    }

    async function removeTorrent(torrentId) {
        const DELETE_TORRENT_ENDPOINT = `https://api.real-debrid.com/rest/1.0/torrents/delete/${torrentId}`;

        try {
            const response = await fetch(DELETE_TORRENT_ENDPOINT, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error removing torrent: ${errorData.error || response.statusText}`);
            }

            // DELETE requests typically return no content
            return response.ok;
        } catch (error) {
            console.error('Error removing torrent:', error);
            throw error;
        }
    }

    async function selectFiles(torrentId, fileIds = 'all') {
        const SELECT_FILES_ENDPOINT = `https://api.real-debrid.com/rest/1.0/torrents/selectFiles/${torrentId}`;

        try {
            const response = await fetch(SELECT_FILES_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: `files=${fileIds}`
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error selecting files: ${errorData.error || response.statusText}`);
            }

            return true;
        } catch (error) {
            console.error('Error selecting files:', error);
            throw error;
        }
    }

    async function getTorrentInfo(torrentId) {
        const INFO_ENDPOINT = `https://api.real-debrid.com/rest/1.0/torrents/info/${torrentId}`;

        try {
            const response = await fetch(INFO_ENDPOINT, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error getting torrent info: ${errorData.error || response.statusText}`);
            }

            let torrentInfo = await response.json();

            if (torrentInfo.status === 'uploading') {
                torrentInfo.progress = 100;
            }

            return torrentInfo
        } catch (error) {
            console.error('Error getting torrent info:', error);
            throw error;
        }
    }

    async function isTorrentActive(magnetLink) {
        try {
            // Get list of user's torrents
            const response = await fetch('https://api.real-debrid.com/rest/1.0/torrents', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const torrents = await response.json();
            
            // Clean up magnet link to get hash if needed
            const hash = magnetLink.startsWith('magnet:') 
                ? magnetLink.match(/xt=urn:btih:([^&]+)/i)[1].toLowerCase()
                : magnetLink.toLowerCase();

            // Look for matching torrent in user's list
            let foundTorrent = torrents.find(t => 
                t.hash.toLowerCase() === hash ||
                (t.links && t.links.some(link => link.toLowerCase().includes(hash)))
            );

            if (foundTorrent && foundTorrent.status !== 'downloading' && foundTorrent.status !== 'queued') {
                    
                foundTorrent.progress = 100;
            }

            return {
                isActive: !!foundTorrent,
                torrentInfo: foundTorrent || null
            };
        } catch (error) {
            console.error('Error checking torrent status:', error);
            throw error;
        }
    }

    async function removeTorrent(torrentId) {
        try {
            const response = await fetch(`https://api.real-debrid.com/rest/1.0/torrents/delete/${torrentId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${realDebridApiKey}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to remove torrent: ${errorData.error || response.statusText}`);
            }

            return true; // Successful deletion
        } catch (error) {
            console.error('Error removing torrent:', error);
            throw error;
        }
    }

    async function unrestrictTorrent(magnetLink) {

        let torrentId
        try {
            // Step 1: Add the magnet link

            const addResult = await addTorrent(magnetLink);
            torrentId = addResult.id;

            // Step 2: Select all files (you can modify this to select specific files)
            await selectFiles(torrentId);

            const torrentInfo = await getTorrentInfo(torrentId);

            if (!torrentInfo.status === 'downloaded') {

                // remove torrent from list
                await removeTorrent(torrentId);
                
                throw new Error('Torrent is not cached');
            }

            // Step 4: Return the unrestricted links and file information
            return torrentInfo;

        } catch (error) {
            console.error('Error processing torrent:', error);
            if (torrentId) {
                await removeTorrent(torrentId);
            }
            throw error;
        }
    }

    function openUrl(url, openTab) {
        // Validate URL
        try {
          new URL(url);
        } catch (error) {
          console.error('Invalid URL provided:', error);
          return Promise.reject('Invalid URL');
        }
      
        // Open URL based on openTab preference
        if (openTab) {
          // Open in new tab
          return chrome.tabs.create({
            url: url,
            active: true // Make the new tab active
          });
        } else {
          // Update current tab
          return chrome.tabs.update({ url: url });
        }
    }

    // Add this to your existing message listener in background.js
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'openUrl') {
            openUrl(request.url, request.openTab)
                .then(result => {
                    sendResponse(result)
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'setApiKey') {
            realDebridApiKey = request.realDebridApiKey;
            sendResponse('Api key set');
            return true;
        }
        if (request.action === 'unrestrictTorrent') {
            unrestrictTorrent(request.magnetLink)
                .then(result => {
                    sendResponse(result)
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'getTorrentInfo') {
            getTorrentInfo(request.torrentId)
                .then(result => {
                    sendResponse(result)
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'isTorrentActive') {
            isTorrentActive(request.magnetLink)
                .then(result => {
                    sendResponse(result)
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'removeTorrent') {
            removeTorrent(request.torrentId)
                .then(result => {
                    sendResponse(result)
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'unrestrictLink') {
            unrestrictLink(request.url)
                .then(result => {
                    sendResponse(result)
                    // download the file one time only
                    chrome.downloads.download({
                        url: result.download,
                        filename: result.filename,
                        saveAs: false
                    });
                })
                .catch(error => sendResponse({ error: error.message }));
            return true; // Will respond asynchronously
        }
        if (request.action === 'openPopup') {

            sendMessageToTab('Opened popup');
            // Open the popup window
            chrome.action.openPopup()
        }
    });

})


// send logs to background.js

function sendMessageToTab(message) {
    // send to all tabs
    chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { type: 'log', log: message })
        })
    })
}