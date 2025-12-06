// background.js

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "captureScreen") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ dataUrl: dataUrl });
      }
    });
    return true; // Keep message channel open for async response
  } else if (request.action === "saveMetric") {
    saveMetric(request.data).then(() => sendResponse({ success: true }));
    return true;
  } else if (request.action === "getMetrics") {
    getMetrics().then((data) => sendResponse({ data: data }));
    return true;
  } else if (request.action === "chatWithGemini") {
    chatWithGemini(request.prompt, request.image)
      .then(response => sendResponse({ text: response.text }))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

async function chatWithGemini(prompt, image) {
  console.log("Background: Sending request to Gemini Server...");
  console.log("Prompt:", prompt);
  if (image) console.log("Image present, length:", image.length);

  try {
    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image: image
      })
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Background: Received response from server:", data);
    return data;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

async function saveMetric(metric) {
  const data = await chrome.storage.local.get("metrics");
  const metrics = data.metrics || [];
  metrics.push({
    timestamp: Date.now(),
    ...metric
  });
  await chrome.storage.local.set({ metrics });
}

async function getMetrics() {
  const data = await chrome.storage.local.get("metrics");
  return data.metrics || [];
}
