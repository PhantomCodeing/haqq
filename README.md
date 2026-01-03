# Haqqathon Project: Digital Inclusion Assistant

> **✨ VIBE Coded with Google's Antigravity IDE**

![Frontend UI](media/frontend%20UI.png)

## 📖 Introduction

This project was developed during the **Haqqathon** in Manchester, organized by **Ihsaan**—an organization dedicated to inspiring excellence in Muslim students across the UK through industry mentorship and workshops.

Our team tackled a challenge presented by the **Manchester City Council**, aimed at solving a key issue in digital literacy initiatives.

## 🎯 The Challenge

**Problem Statement:**
> *"How can we effectively measure the outcomes of digital inclusion programmes in terms of building confidence, improving digital competencies and fostering independence online?"*

The council needed a way to not just teach digital skills, but to *quantify* whether citizens were becoming more independent and confident in their digital navigation after participating in inclusion programs.

## 💡 Our Solution

We built a **Chrome Extension** paired with an **Analytics Dashboard** that serves as a personalized, AI-powered digital companion.

### How It Works
1.  **The Companion Extension**: Users install a Chrome extension that provides a chat interface overlay on any website.
2.  **Context-Aware Help**: When a user asks for help, the extension captures a **screenshot** of their current view and sends it to the backend.
3.  **AI Navigation**: Using **Google Gemini (2.5 Flash)**, the system analyzes the page and the user's goal. It highlights specific elements on the screen (using **Driver.js**) and provides step-by-step instructions.
4.  **Continuous Guidance**: As the user navigates, the AI checks the new page state, verifies progress ("Verify and Advance"), and provides the next instruction until the goal is achieved.

### 📊 Measuring Independence
Crucially, our solution tracks user behavior to generate a **"Digital Independence Level"**.
*   **Prompted Behavior**: Actions taken immediately after AI instruction (Green).
*   **Unprompted Behavior**: Organic actions taken by the user without help (Orange).

By visualizing the ratio of organic vs. guided interactions over time, the Council can clearly see if a user is becoming less reliant on the AI—proving the efficacy of the digital inclusion program.

![Extension in Action](media/extension%20in%20action.png)

## 🏗️ Project Structure

The project is organized into three main components:

```text
/
├── backend/          # Python FastAPI server & AI logic
├── frontend/         # React (Vite) Analytics Dashboard
├── extension/       # Chrome Extension source code
└── media/            # Project screenshots and assets
```

### 1. Backend (`/backend`)
The backend acts as the "brain", bridging the browser extension and the AI.
- **FastAPI**: High-performance API serving the `/chat` and `/events` endpoints.
- **Gemini Integration**: Multimodal analysis (Vision + Text) to understand screenshots and provide navigation guidance.
- **OS Tracking**: Monitors active window titles to provide deeper context for user activity.
- **Persistence**: Local JSON storage for tracking user behavioral events.

### 2. Frontend (`/frontend`)
An observability dashboard for city council staff to monitor program efficacy.
- **React 18 + Vite**: Fast, modern frontend.
- **Tailwind CSS + Shadcn UI**: Premium, responsive design system.
- **Recharts**: Visualizes usage trends and independence metrics.
- **Real-time Metrics**: Tracks "Prompted vs. Unprompted" actions and calculates independence levels.

### 3. Extension (`/extension`)
The user-facing tool that provides on-page assistance.
- **Shadow DOM**: Ensures the extension UI doesn't conflict with host websites.
- **Driver.js**: Powering the spotlight and guided tours.
- **Screen Capture**: Takes context-aware screenshots for AI analysis.
- **Manifest V3**: Using modern extension standards for security and performance.

## 💻 Code Highlights

### The "Verify and Advance" Protocol
We instructed the AI to act as a patient teacher, ensuring it never does the work *for* the user, but guides them.

```python
# backend/os_agent_server/main.py

SYSTEM_PROMPT = """
You are a patient Digital Literacy Guide.
Your goal is to TEACH the user how to use the web, step-by-step.

**CRITICAL RULES:**
1.  **NEVER** do the task for them. Do not type, click, or submit. 
2.  **THE "VERIFY AND ADVANCE" RULE**:
    * **Check the previous step**: Look at the image/HTML. Did they do what you asked?
    * **If FAILED**: Explain the mistake gently and repeat the instruction.
    * **If SUCCEEDED**: You must **IMMEDIATELY** provide the **NEXT STEP**.
"""
```

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js (v18+)
- Google Gemini API Key (set in `.env`)

### Installation & Setup

1.  **Backend:**
    ```bash
    cd backend
    pip install -r requirements.txt # (Ensure you have a requirements.txt or install pydantic, fastapi, uvicorn, google-generativeai, etc.)
    python os_agent_server/main.py
    ```

2.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

3.  **Extension:**
    - Open Chrome and go to `chrome://extensions/`
    - Enable "Developer mode"
    - Click "Load unpacked" and select the `extension/` folder.

## 🚀 Reflections & Future Improvements

### Hackathon Outcome
While we didn't win the challenge—the judges were looking for broader policy frameworks rather than a direct technical implementation—our project received high praise for its "Real-time independence tracking" and technical execution.

### Future Roadmap
1.  **Cost Optimization**: Moving to open-source multimodal models.
2.  **Privacy**: Rigorous PII redaction on screenshots.
3.  **Offline Mode**: Caching common navigation flows for standard government services.

## 👥 Meet the Team

*   [@AMuh2020](https://github.com/AMuh2020)
*   [@Muhammad-Ali-Shah](https://github.com/Muhammad-Ali-Shah)
*   [@PhantomCodeing](https://github.com/PhantomCodeing)
