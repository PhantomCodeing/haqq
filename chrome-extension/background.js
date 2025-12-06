// NeuralPath Background Script & Telemetry Service

// State for WebSocket connection to Hub
let socket = null;
const HUB_URL = 'ws://localhost:3000';

// Initialize Telemetry Storage
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        dependencyRatio: { assisted: 0, unassisted: 0 },
        navigationHistory: []
    });
    console.log("NeuralPath Extension Installed");
    connectToHub();
});

// Connect to Electron Hub
function connectToHub() {
    try {
        // Note: Native WebSocket support in Service Workers
        socket = new WebSocket(HUB_URL);

        socket.onopen = () => {
            console.log('Connected to NeuralPath Hub');
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleHubMessage(data);
        };

        socket.onclose = () => {
            console.log('Disconnected from Hub. Retrying in 5s...');
            setTimeout(connectToHub, 5000);
        };
    } catch (e) {
        console.error('Socket connection error:', e);
    }
}

function handleHubMessage(data) {
    if (data.action === 'FLASH_TRIGGER') {
        // Send message to active tab to show overlay
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_SMART_LAUNCHER' });
            }
        });
    }
}

// --- TELEMETRY SERVICE ---

// 1. Browsing Behavior (Tab Creation/Updates)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        logTelemetry('NAVIGATION_COMPLETE', { url: tab.url, title: tab.title });
    }
});

// 2. Error Tracking (404s, DNS errors)
chrome.webNavigation.onErrorOccurred.addListener((details) => {
    if (details.frameId === 0) { // Top-level frame only
        logTelemetry('ERROR_PAGE_ENCOUNTERED', { url: details.url, error: details.error });
    }
});

// 3. Telemetry Logging Helper
function logTelemetry(eventType, data) {
    const entry = {
        timestamp: new Date().toISOString(),
        event: eventType,
        data: data
    };

    // Persist locally
    chrome.storage.local.get(['navigationHistory'], (result) => {
        const history = result.navigationHistory || [];
        history.push(entry);
        chrome.storage.local.set({ navigationHistory: history });
    });

    // If connected, stream to Hub
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'TELEMETRY', payload: entry }));
    }
}

// Listen for messages from Content Script (Smart Launcher events)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SMART_LAUNCHER_USED') {
        updateDependencyRatio('assisted');
        logTelemetry('NAVIGATION_STARTED', { source: 'smart_launcher', input: message.input });
    } else if (message.type === 'REDIRECT_REQUEST') {
        // Handle redirect logic here or forward to Hub
        // For now, assume Hub handles "smart routing" via socket, 
        // but we can also do simple redirects here.
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'RESOLVE_URL', input: message.input }));
        }
    }
});

function updateDependencyRatio(type) {
    chrome.storage.local.get(['dependencyRatio'], (result) => {
        const stats = result.dependencyRatio || { assisted: 0, unassisted: 0 };
        stats[type]++;
        chrome.storage.local.set({ dependencyRatio: stats });
    });
}
