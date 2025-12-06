// NeuralPath Content Script

console.log("NeuralPath Content Script Loaded");

// Styles for the Smart Launcher
const overlayStyles = `
  #neuralpath-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.85);
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', sans-serif;
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none; /* Initially allow clicks through? No, blocking is better for focus */
  }

  #neuralpath-overlay.active {
    opacity: 1;
    pointer-events: all;
  }

  .neuralpath-input-container {
    position: relative;
    width: 600px;
    max-width: 90%;
  }

  #neuralpath-input {
    width: 100%;
    padding: 20px 30px;
    font-size: 24px;
    border-radius: 50px;
    border: 4px solid #2563EB;
    background: #fff;
    outline: none;
    box-shadow: 0 0 50px rgba(37, 99, 235, 0.5);
    animation: neuralPulse 2s infinite;
  }

  @keyframes neuralPulse {
    0% { box-shadow: 0 0 0 0px rgba(37, 99, 235, 0.4); }
    70% { box-shadow: 0 0 0 20px rgba(37, 99, 235, 0); }
    100% { box-shadow: 0 0 0 0px rgba(37, 99, 235, 0); }
  }

  .neuralpath-hint {
    color: #fff;
    margin-top: 20px;
    font-size: 18px;
    text-align: center;
  }
`;

// Inject Styles
const styleSheet = document.createElement("style");
styleSheet.innerText = overlayStyles;
document.head.appendChild(styleSheet);

// Create Overlay Elements
const overlay = document.createElement('div');
overlay.id = 'neuralpath-overlay';
overlay.innerHTML = `
  <div class="neuralpath-input-container">
    <input type="text" id="neuralpath-input" placeholder="Where do you want to go?" />
    <div class="neuralpath-hint">Type your destination (e.g., "my email" or "youtube")</div>
  </div>
`;
document.body.appendChild(overlay);

const input = overlay.querySelector('#neuralpath-input');

// Listen for messages from Background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_SMART_LAUNCHER') {
        showOverlay();
    }
});

function showOverlay() {
    overlay.classList.add('active');
    input.focus();
}

function hideOverlay() {
    overlay.classList.remove('active');
}

// Handle User Input
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const value = input.value;
        if (value.trim().length > 0) {
            // 1. Log metrics (Assisted Action)
            chrome.runtime.sendMessage({
                type: 'SMART_LAUNCHER_USED',
                input: value
            });

            // 2. Request Redirect
            chrome.runtime.sendMessage({
                type: 'REDIRECT_REQUEST',
                input: value
            });

            // Feedback to user (could be better)
            input.value = "Navigating...";
            setTimeout(hideOverlay, 1000);
        }
    } else if (e.key === 'Escape') {
        hideOverlay();
    }
});

// "Unassisted" Listener - Detect clicks on regular links?
// This is harder to capture perfectly without noise, but we can listen for clicks on <a> tags
document.addEventListener('click', (e) => {
    if (overlay.classList.contains('active')) return; // Ignore clicks inside overlay

    const anchor = e.target.closest('a');
    if (anchor && anchor.href) {
        // This is an unassisted navigation action
        // We don't send individual click events to avoid spam, but we could if needed.
        // Ideally, the 'tab update' in background.js captures the result of this.
    }
});
