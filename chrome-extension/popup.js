document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById('trigger-flash');
    const statusDiv = document.getElementById('connection-status');
    const metricsDiv = document.getElementById('metrics-display');

    // Trigger Flash Overlay
    triggerBtn.addEventListener('click', () => {
        // We send this to the Active Tab directly or via Background?
        // Let's send to Background to relay to Active Tab (centralized control)
        // Actually, for the popup, we can just message the active tab directly
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, { type: 'SHOW_SMART_LAUNCHER' });
                window.close(); // Close popup after triggering
            }
        });
    });

    // Check Local Stats
    chrome.storage.local.get(['dependencyRatio'], (result) => {
        const stats = result.dependencyRatio || { assisted: 0, unassisted: 0 };
        metricsDiv.textContent = `Assisted: ${stats.assisted} | Unassisted: ${stats.unassisted}`;
    });

    // Check Hub Connection (via background)
    // Since popup is separate execution context, verifying WS connection is tricky without messaging background.
    // For now, simple static message.
    statusDiv.textContent = "Ready";
});
