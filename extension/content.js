/**
 * Digital Literacy Assistant - Content Script
 * Wraps logic in an IIFE to prevent global scope pollution.
 */

(function () {
  // 1. Constants for maintainability
  const HOST_ID = 'digital-literacy-extension-host';
  const CONTAINER_ID = 'dle-container';

  // 2. State Management
  let shadowRoot = null;
  let isChatVisible = false;

  /**
   * 3. DOM Manipulation: Helper to create the UI safely.
   */
  function init() {
    // Check if it already exists to avoid duplicates
    if (document.getElementById(HOST_ID)) return;

    console.log("Digital Literacy Extension: Initializing...");

    // Create Host for Shadow DOM
    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject Styles
    injectStyles();

    // Build UI
    createOverlay();
  }

  function injectStyles() {
    const styleLink = document.createElement('link');
    styleLink.setAttribute('rel', 'stylesheet');
    styleLink.setAttribute('href', chrome.runtime.getURL('styles.css'));
    shadowRoot.appendChild(styleLink);

    // We also need driver.css in the main page for the tour to work correctly
    // or we can try to inject it into shadow if driver supports it, 
    // but driver.js usually works on the main DOM.
    // Let's check if driver.css is already in head
    if (!document.querySelector('link[href*="driver.css"]')) {
      const driverStyle = document.createElement('link');
      driverStyle.rel = 'stylesheet';
      driverStyle.href = chrome.runtime.getURL('driver.css');
      document.head.appendChild(driverStyle);
    }
  }

  function createOverlay() {
    // Main Container
    const container = document.createElement('div');
    container.id = CONTAINER_ID;

    // Floating Action Button
    const fab = document.createElement('button');
    fab.id = 'dle-fab';
    fab.innerHTML = '<span>?</span>';
    fab.title = 'Get Help';
    fab.onclick = toggleChat;
    container.appendChild(fab);

    // Chat Window
    const chatWindow = createChatWindow();
    container.appendChild(chatWindow);

    shadowRoot.appendChild(container);
  }

  function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.id = 'dle-chat-window';
    chatWindow.classList.add('hidden');

    // Header
    const header = document.createElement('div');
    header.className = 'dle-header';
    header.innerHTML = `<h3>Digital Helper</h3>`;

    const closeBtn = document.createElement('button');
    closeBtn.id = 'dle-close';
    closeBtn.textContent = '×';
    closeBtn.onclick = toggleChat;
    header.appendChild(closeBtn);
    chatWindow.appendChild(header);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'dle-tabs';
    tabs.innerHTML = `
      <button class="dle-tab active" data-tab="chat">Chat</button>
      <button class="dle-tab" data-tab="progress">My Progress</button>
    `;
    chatWindow.appendChild(tabs);

    // Content Area
    const contentArea = document.createElement('div');
    contentArea.className = 'dle-content';
    chatWindow.appendChild(contentArea);

    // Chat View
    const chatView = document.createElement('div');
    chatView.id = 'dle-chat-view';
    chatView.className = 'dle-view active';
    chatView.innerHTML = `
      <div id="dle-messages">
        <div class="dle-message system">
          Hello! I can help you navigate this page. Ask me anything or click "Guide Me".
        </div>
      </div>
      <div class="dle-input-area">
        <input type="text" id="dle-input" placeholder="How do I..." />
        <button id="dle-send">Send</button>
      </div>
    `;
    contentArea.appendChild(chatView);

    // Progress View
    const progressView = document.createElement('div');
    progressView.id = 'dle-progress-view';
    progressView.className = 'dle-view';
    progressView.innerHTML = `
      <div class="dle-stats">
        <div class="dle-stat-card">
          <h4>Requests</h4>
          <span id="dle-total-requests">0</span>
        </div>
        <div class="dle-stat-card">
          <h4>Streak</h4>
          <span id="dle-streak">0 days</span>
        </div>
      </div>
      <div id="dle-history-list"></div>
    `;
    contentArea.appendChild(progressView);

    // Event Listeners for Tabs
    const tabButtons = tabs.querySelectorAll('.dle-tab');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => switchTab(e, shadowRoot));
    });

    // Event Listeners for Chat
    const sendBtn = chatView.querySelector('#dle-send');
    const input = chatView.querySelector('#dle-input');

    sendBtn.addEventListener('click', handleSendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });

    return chatWindow;
  }

  function toggleChat() {
    const chatWindow = shadowRoot.getElementById('dle-chat-window');
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      chatWindow.classList.remove('hidden');
    } else {
      chatWindow.classList.add('hidden');
    }
  }

  function switchTab(e, root) {
    // Remove active class from all tabs and views
    root.querySelectorAll('.dle-tab').forEach(t => t.classList.remove('active'));
    root.querySelectorAll('.dle-view').forEach(v => v.classList.remove('active'));

    // Add active to clicked tab
    e.target.classList.add('active');

    // Show corresponding view
    const tabName = e.target.dataset.tab;
    root.getElementById(`dle-${tabName}-view`).classList.add('active');

    if (tabName === 'progress') {
      loadMetrics();
    }
  }

  function handleSendMessage() {
    const input = shadowRoot.getElementById('dle-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    // Save metric
    chrome.runtime.sendMessage({
      action: "saveMetric",
      data: { category: "chat", query: text }
    });

    // Capture screenshot and send to Gemini
    chrome.runtime.sendMessage({ action: "captureScreen" }, (response) => {
      if (response && response.dataUrl) {
        const screenshot = response.dataUrl;

        // Send to background for processing
        chrome.runtime.sendMessage({
          action: "chatWithGemini",
          prompt: text,
          image: screenshot
        }, (apiResponse) => {
          if (apiResponse && apiResponse.text) {
            addMessage(apiResponse.text, 'system');
            // Check if response suggests a tour (simple heuristic for now)
            if (apiResponse.text.toLowerCase().includes("guide") || apiResponse.text.toLowerCase().includes("step")) {
              // Optional: Trigger driver if needed, or maybe the server returns structured actions later
              // startDriverTour(); 
            }
          } else if (apiResponse && apiResponse.error) {
            addMessage("Error: " + apiResponse.error, 'system');
          } else {
            addMessage("Sorry, something went wrong.", 'system');
          }
        });
      } else {
        // Fallback without screenshot if capture fails
        chrome.runtime.sendMessage({
          action: "chatWithGemini",
          prompt: text,
          image: null
        }, (apiResponse) => {
          if (apiResponse && apiResponse.text) {
            addMessage(apiResponse.text, 'system');
          } else {
            addMessage("Sorry, something went wrong.", 'system');
          }
        });
      }
    });
  }

  function addMessage(text, sender) {
    const messagesDiv = shadowRoot.getElementById('dle-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `dle-message ${sender}`;
    msgDiv.textContent = text;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }

  function loadMetrics() {
    chrome.runtime.sendMessage({ action: "getMetrics" }, (response) => {
      if (response && response.data) {
        const metrics = response.data;
        shadowRoot.getElementById('dle-total-requests').textContent = metrics.length;

        const list = shadowRoot.getElementById('dle-history-list');
        list.innerHTML = '<h4>Recent Activity</h4>';
        metrics.slice(-5).reverse().forEach(m => {
          const item = document.createElement('div');
          item.className = 'dle-history-item';
          item.innerHTML = `
            <span>${new Date(m.timestamp).toLocaleDateString()}</span>
            <span>${m.query}</span>
          `;
          list.appendChild(item);
        });
      }
    });
  }

  function startDriverTour() {
    // Ensure driver is available
    if (!window.driver || !window.driver.js || !window.driver.js.driver) {
      console.error("Driver.js not loaded");
      addMessage("Error: Driver.js not loaded", 'system');
      return;
    }

    const driver = window.driver.js.driver;
    const driverObj = driver({
      showProgress: true,
      steps: [
        {
          element: 'h1',
          popover: {
            title: 'Page Title',
            description: 'This is the main title of the page. It tells you what this section is about.'
          }
        },
        {
          element: 'a',
          popover: {
            title: 'Navigation Links',
            description: 'These links help you move to other pages. Click them to explore more.'
          }
        },
        {
          element: 'input',
          popover: {
            title: 'Input Fields',
            description: 'You can type information here, like search terms or your details.'
          }
        },
        {
          element: 'button',
          popover: {
            title: 'Action Buttons',
            description: 'Click these buttons to submit forms or perform actions.'
          }
        }
      ]
    });

    driverObj.drive();
  }

  // Initialize
  init();

})();
