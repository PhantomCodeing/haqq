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
  let lastChatInteraction = 0; // Analytics State

  let currentStepData = null; // Store current step info
  let messages = []; // Store chat history
  let currentGoal = null; // Store the user's goal (first prompt)



  /**
   * 3. DOM Manipulation: Helper to create the UI safely.
   */
  function init() {
    // Check if it already exists and remove it (cleanup orphaned instances)
    const existing = document.getElementById(HOST_ID);
    if (existing) {
      console.log("Digital Literacy Extension: Removing orphaned instance...");
      existing.remove();
    }

    console.log("Digital Literacy Extension: Initializing...");

    // Create Host for Shadow DOM
    const host = document.createElement('div');
    host.id = HOST_ID;
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    // AGGRESSIVE BLOCKING: unique host-level listener to stop ALL propagation from inside
    const stopPropagation = (e) => {
      e.stopPropagation();
      e.stopImmediatePropagation();
    };
    host.addEventListener('keydown', stopPropagation);
    host.addEventListener('keyup', stopPropagation);
    host.addEventListener('keypress', stopPropagation);
    host.addEventListener('input', stopPropagation);

    // NUCLEAR OPTION: Window Capture Phase Blocker
    // This catches the event at the Window, BEFORE it goes down to Document/Body.
    // If the target is our Host (meaning the user is typing inside Shadow DOM), destroy the event.
    ['keydown', 'keyup', 'keypress', 'input'].forEach(evt => {
      window.addEventListener(evt, (e) => {
        // ANTIGRAVITY FIX: Use composedPath() to detect if event started inside our Shadow Host
        const path = e.composedPath();
        if (path.includes(host)) {
          // If the event came from us, KILL IT immediately.
          e.stopPropagation();
          e.stopImmediatePropagation();
        }
      }, true); // true = Capture Phase
    });

    // Inject Styles
    injectStyles();

    // Build UI
    createOverlay();

    // Restore State
    restoreState();
  }

  function saveState() {
    const state = {
      isChatVisible: isChatVisible,
      currentStepData: currentStepData,
      messages: messages,
      currentGoal: currentGoal
    };
    chrome.storage.local.set({ 'dle_state': state });
  }

  function restoreState() {
    chrome.storage.local.get('dle_state', (result) => {
      if (result.dle_state) {
        const state = result.dle_state;
        isChatVisible = state.isChatVisible || false;
        currentStepData = state.currentStepData || null;
        messages = state.messages || [];
        currentGoal = state.currentGoal || null;

        // Restore Goal UI if exists
        if (currentGoal) {
          updateGoalDisplay(currentGoal);
        }

        // Restore visibility
        const chatWindow = shadowRoot.getElementById('dle-chat-window');
        if (isChatVisible) {
          chatWindow.classList.remove('hidden');
        } else {
          chatWindow.classList.add('hidden');
        }

        // Restore messages
        const messagesDiv = shadowRoot.getElementById('dle-messages');
        // Clear default welcome message if we have history
        if (messages.length > 0) {
          messagesDiv.innerHTML = '';
          messages.forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `dle-message ${msg.sender}`;
            msgDiv.textContent = msg.text;
            messagesDiv.appendChild(msgDiv);
          });
          messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Restore Verify Button if needed
        if (currentStepData && (currentStepData.type === 'instruction' || currentStepData.type === 'verification_failure')) {
          addVerifyButton();

          // Auto-verify on load if we have an active instruction
          // We check if the chat is visible to avoid annoying the user if they closed it
          if (isChatVisible) {
            console.log("Content: Auto-verifying on page load...");
            // Add a small delay to ensure page is settled
            setTimeout(() => {
              handleVerify();
            }, 300);
          }


          // Auto-verify on load if we have an active instruction
          // We check if the chat is visible to avoid annoying the user if they closed it
          if (isChatVisible) {
            console.log("Content: Auto-verifying on page load...");
            // Add a small delay to ensure page is settled
            setTimeout(() => {
              handleVerify();
            }, 300);
          }

        } else if (currentStepData && currentStepData.type === 'verification_success' && currentStepData.step_number) {
          addVerifyButton();
        }
      }
    });
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
    closeBtn.title = 'Close';
    closeBtn.onclick = toggleChat;

    const clearBtn = document.createElement('button');
    clearBtn.id = 'dle-clear';
    clearBtn.textContent = '🗑️';
    clearBtn.title = 'Clear Chat History';
    clearBtn.style.marginRight = '8px';
    clearBtn.style.background = 'none';
    clearBtn.style.border = 'none';
    clearBtn.style.cursor = 'pointer';
    clearBtn.onclick = clearChat;

    const controlsDiv = document.createElement('div');
    controlsDiv.appendChild(clearBtn);
    controlsDiv.appendChild(closeBtn);

    header.appendChild(controlsDiv);
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

    // Goal Display Area
    const goalDisplay = document.createElement('div');
    goalDisplay.id = 'dle-goal-display';
    goalDisplay.style.display = 'none';
    goalDisplay.style.padding = '8px 15px';
    goalDisplay.style.fontSize = '12px';
    goalDisplay.style.color = '#555';
    goalDisplay.style.backgroundColor = '#f0f4f8';
    goalDisplay.style.borderBottom = '1px solid #eee';
    goalDisplay.innerHTML = '<strong>Goal:</strong> <span id="dle-goal-text"></span>';
    contentArea.appendChild(goalDisplay);

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

    // FIX: More aggressive event trapping
    const stopEvent = (e) => {
      // 1. Stop it from bubbling up to the host and document
      e.stopPropagation();
      // 2. Stop other listeners on this same element (if any)
      e.stopImmediatePropagation();
    };

    // Apply to ALL key event types to be safe
    ['keydown', 'keyup', 'keypress', 'input'].forEach(eventType => {
      input.addEventListener(eventType, (e) => {
        // Allow Enter key to work for sending
        if (e.key === 'Enter' && eventType === 'keypress') {
          handleSendMessage();
        }

        // CRITICAL: Prevent the '/' key from triggering Quick Search on sites like DDG
        if (e.key === '/') {
          e.stopPropagation();
        }

        stopEvent(e);
      });
    });

    // FOCUS TRAP: If user clicks anywhere in the chat view, focus the input
    chatView.addEventListener('click', (e) => {
      // Don't steal focus if they are selecting text or clicking a button
      if (e.target.tagName === 'BUTTON' || window.getSelection().toString().length > 0) return;
      input.focus();
    });

    return chatWindow;
  }

  function toggleChat() {
    const chatWindow = shadowRoot.getElementById('dle-chat-window');
    isChatVisible = !isChatVisible;
    if (isChatVisible) {
      chatWindow.classList.remove('hidden');
      // Auto-focus input when opening
      setTimeout(() => {
        const input = shadowRoot.getElementById('dle-input');
        if (input) input.focus();
      }, 100);
    } else {
      chatWindow.classList.add('hidden');
    }
    saveState();
  }

  function clearChat() {
    console.log("Clear chat requested");
    // Removed confirm for smoother UX/Debugging
    messages = [];
    currentStepData = null;
    currentGoal = null;
    saveState();

    // Clear Goal UI
    const goalDisplay = shadowRoot.getElementById('dle-goal-display');
    if (goalDisplay) goalDisplay.style.display = 'none';

    // Clear UI
    const messagesDiv = shadowRoot.getElementById('dle-messages');
    if (messagesDiv) {
      messagesDiv.innerHTML = `
        <div class="dle-message system">
          Chat cleared. How can I help you?
        </div>
      `;
    }

    // Remove verify button if present
    const verifyBtns = shadowRoot.querySelectorAll('.dle-verify-btn');
    verifyBtns.forEach(btn => btn.remove());
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

    // Set Goal if not set
    if (!currentGoal) {
      currentGoal = text;
      updateGoalDisplay(currentGoal);
    }

    // Analytics: track time of last prompt
    lastChatInteraction = Date.now();

    addMessage(text, 'user');
    input.value = '';

    // Save metric
    chrome.runtime.sendMessage({
      action: "saveMetric",
      data: { category: "chat", query: text }
    });

    // Capture HTML content (truncated to avoid huge payloads)
    const htmlContent = document.body.outerHTML.substring(0, 50000);

    // Send to background (which will capture screenshot)
    sendToGemini(text, null, null, htmlContent, currentGoal);
  }

  function handleVerify() {
    if (!currentStepData) return;

    addMessage("Verifying...", 'system');

    // Disable verify button if it exists
    const verifyBtn = shadowRoot.querySelector('.dle-verify-btn');
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = "Checking...";
    }

    // Context is the current step we are verifying
    const context = JSON.stringify(currentStepData);

    // Capture HTML content
    const htmlContent = document.body.outerHTML.substring(0, 50000);

    // Send to background (which will capture screenshot)
    sendToGemini("Verify this step", null, context, htmlContent, currentGoal);
  }

  function sendToGemini(prompt, image, context, html, goal) {
    chrome.runtime.sendMessage({
      action: "chatWithGemini",
      prompt: prompt,
      image: image,
      context: context,
      html: html,
      goal: goal
    }, (apiResponse) => {
      console.log("api response", apiResponse);
      if (apiResponse && apiResponse.text) {
        // parse apiresponse
        let data = JSON.parse(apiResponse.text);
        handleAgentResponse(data);
      } else if (apiResponse && apiResponse.error) {
        addMessage("Error: " + apiResponse.error, 'system');
      } else {
        addMessage("Sorry, something went wrong.", 'system');
      }
    });
  }

  function handleAgentResponse(data) {
    console.log("Content: Handling agent response:", data);

    // Handle array response from Gemini
    if (Array.isArray(data)) {
      data = data[0];
    }

    currentStepData = data;
    saveState();

    if (data.type === 'instruction' || data.type === 'verification_failure') {
      // Remove existing verify button if present to avoid duplicates/confusion
      const existingBtn = shadowRoot.querySelector('.dle-verify-btn');
      if (existingBtn) existingBtn.remove();

      addMessage(data.message, 'system');

      // Highlight element if provided
      if (data.element_selector) {
        console.log("Highlighting selector:", data.element_selector);
        try {
          // Ensure driver is loaded
          if (window.driver && window.driver.js && window.driver.js.driver) {
            const driver = window.driver.js.driver;
            const driverObj = driver({
              showProgress: false,
              steps: [
                {
                  element: data.element_selector,
                  popover: {
                    title: 'Click Here',
                    description: data.message,
                    side: "bottom",
                    align: 'start'
                  }
                }
              ]
            });
            driverObj.drive();
          } else {
            console.warn("Driver.js not found on window");
          }
        } catch (e) {
          console.error("Error highlighting element:", e);
        }
      }

      addVerifyButton();

      // Trigger Driver.js if selector is present
      if (data.element_selector) {
        startDriverTour(data.element_selector, data.message);
      }

    } else if (data.type === 'verification_success') {
      // Remove existing verify button
      const existingBtn = shadowRoot.querySelector('.dle-verify-btn');
      if (existingBtn) existingBtn.remove();

      addMessage(data.message, 'system');
      if (data.step_number) {
        addVerifyButton();
      }
    } else if (data.type === 'completion') {
      addMessage(data.message, 'system');
    } else {
      console.warn("Content: Unknown response type:", data.type);
      addMessage(data.message || JSON.stringify(data), 'system');
    }
  }

  function addVerifyButton() {
    const messagesDiv = shadowRoot.getElementById('dle-messages');
    const btn = document.createElement('button');
    btn.textContent = "Verify & Next Step";
    btn.className = "dle-verify-btn";
    btn.style.marginTop = "10px";
    btn.style.padding = "8px 16px";
    btn.style.backgroundColor = "#4CAF50";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";
    btn.style.display = "block";

    btn.onclick = () => {
      btn.disabled = true;
      btn.textContent = "Checking...";
      handleVerify();
    };

    messagesDiv.appendChild(btn);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

  }

  function addMessage(text, sender) {
    // Add to state
    messages.push({ text: text, sender: sender });
    saveState();

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

        // Calculate Streak (Unique Days)
        const uniqueDays = new Set(metrics.map(m => new Date(m.timestamp).toLocaleDateString()));
        shadowRoot.getElementById('dle-streak').textContent = `${uniqueDays.size} days`;

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

  function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver((mutations) => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  function startDriverTour(selector, message) {
    // Ensure driver is available
    if (!window.driver || !window.driver.js || !window.driver.js.driver) {
      console.error("Driver.js not loaded");
      return;
    }

    // Wait for element to exist before driving
    waitForElement(selector).then((element) => {
      if (!element) {
        console.warn("Driver.js: Element not found:", selector);
        return;
      }

      const driver = window.driver.js.driver;
      const driverObj = driver({
        showProgress: false,
        steps: [
          {
            element: element,
            popover: {
              title: 'Step Guide',
              description: message
            }
          }
        ]
      });

      driverObj.drive();
    });
  }

  function updateGoalDisplay(goalText) {
    const goalDisplay = shadowRoot.getElementById('dle-goal-display');
    const goalTextSpan = shadowRoot.getElementById('dle-goal-text');

    if (goalDisplay && goalTextSpan) {
      goalTextSpan.textContent = goalText;
      goalDisplay.style.display = 'block';
    }
    saveState();
  }

  // 4. Click Tracking
  document.addEventListener('click', (e) => {
    // Ignore clicks inside our own extension UI
    const container = document.getElementById(CONTAINER_ID);
    if (container && container.contains(e.target)) return;
    if (e.target.id === CONTAINER_ID) return;

    // Check if the click is on the "Active" driver element
    // Driver.js adds 'driver-active-element' to the highlighted element
    const activeElement = document.querySelector('.driver-active-element');
    const driverPopover = document.querySelector('.driver-popover');

    let isPrompted = false;

    // Debug logging
    // console.log("Click Event Target:", e.target);
    // console.log("Active Driver Element:", activeElement);

    if (activeElement) {
      if (activeElement === e.target || activeElement.contains(e.target)) {
        isPrompted = true;
      }
    }

    // NEW RULE: If user chatted recently (last 60s), assume they are following instructions
    if (!isPrompted && (Date.now() - lastChatInteraction < 60000)) {
      console.log("Analytics: Marking as prompted due to recent chat interaction.");
      isPrompted = true;
    }

    // Fallback: Check if we clicked the driver popover or its buttons (Next/Prev)
    // Actually, clicks on the popover itself shouldn't count as "interacting with the page element"
    // but maybe the user considers following the "Next" button as a prompted action?
    // For now, let's stick to the highlighted element.

    // IMPROVEMENT: Sometimes driver.js puts an overlay. 
    // If we can't detect the element, maybe we check if the driver is active at all?
    // But we want to distinguish "clicking the highlighted button" vs "clicking elsewhere".

    // Helper to get a selector
    const getSelector = (el) => {
      if (el.id) return '#' + el.id;
      if (el.className && typeof el.className === 'string') return '.' + el.className.split(' ').join('.');
      return el.tagName.toLowerCase();
    };

    const stats = {
      event_type: isPrompted ? 'prompted' : 'unprompted',
      element_selector: getSelector(e.target),
      url: window.location.href
    };

    console.log("Recording click:", stats);

    chrome.runtime.sendMessage({
      action: "saveStats",
      data: stats
    });

  }, true); // Capture phase to ensure we get it

  // Initialize
  init();

})();
