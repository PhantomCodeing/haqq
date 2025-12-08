# Haqqathon Project: Digital Inclusion Assistant

> **✨ VIBE Coded with Google's Antigravity IDE**

![Frontend UI](frontend%20UI.png)

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
2.  **Context-Aware Help**: When a user asks for help (e.g., "How do I pay my council tax?"), the extension captures a **screenshot** of their current view.
3.  **AI Navigation**: Using **Google Gemini**, the system analyzes the page and the user's goal. It highlights specific elements on the screen (using colored overlays) and provides step-by-step instructions.
4.  **Continuous Guidance**: As the user navigates, the AI checks the new page state, verifies progress ("Verify and Advance"), and provides the next instruction until the goal is achieved.

### 📊 Measuring Independence
Crucially, our solution tracks user behavior to generate a **"Digital Independence Level"**.
*   **Prompted Behavior**: Actions taken immediately after AI instruction (Green).
*   **Unprompted Behavior**: Organic actions taken by the user without help (Orange).

By visualizing the ratio of organic vs. guided interactions over time, the Council can clearly see if a user is becoming less reliant on the AI—proving the efficacy of the digital inclusion program.

![Extension in Action](extension%20in%20action.png)

## 🏗️ Technical Overview

The project leverages a modern stack designed for rapid prototyping and AI integration:

*   **Frontend**: React (Vite) + Tailwind CSS for a responsive, "Vibe-coded" dashboard.
*   **Backend**: Python (FastAPI) serving as the bridge between the browser and the AI.
*   **AI Model**: **Google Gemini (2.5 Flash)** for multimodal analysis (Vision + Text) to understand screenshots and DOM elements.
*   **Browser Integration**: Chrome Extension Manifest V3 with `driver.js` principles for element highlighting.
*   **Storage**: Local JSON persistence for session tracking (prototype phase).

## 💻 Code Highlights

### The "Verify and Advance" Protocol
We instructed the AI to act as a patient teacher, ensuring it never does the work *for* the user, but guides them.

```python
# os_agent_server/main.py

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

### Measuring Digital Independence
The dashboard aggregates events to calculate real-time metrics for policy makers.

```typescript
// src/pages/Index.tsx

<StatCard
  title="Digital Independence Level"
  value={skillLevel} 
  subtitle={skillLevel === "No Data" ? "Start using the assistant" : "Based on recent activity"}
  icon={Users}
  delay={50}
/>
<StatCard
  title="Prompted Behaviour"
  value={clickStats.prompted}
  subtitle="Guided by AI"
  icon={MousePointerClick}
  className="bg-green-500/10"
/>
<StatCard
  title="Unprompted Behaviour"
  value={clickStats.unprompted}
  subtitle="Organic User Actions"
  icon={MousePointerClick}
  className="bg-orange-500/10"
/>
```

## 🚀 Reflections & Future Improvements

### Hackathon Outcome
While we didn't win the challenge—the judges were looking for broader policy frameworks rather than a direct technical implementation, and we missed addressing data privacy in our pitch—our project received high praise.
*   **Innovation**: A judge from the City Council found the "real-time independence tracking" concept highly innovative.
*   **Practicality**: It offers a tangible way to close the feedback loop for digital skills training.

### Challenges
*   **Prompt Engineering**: Tuning the AI to be concise without being curt was difficult. We implemented a strict JSON schema to control the output.
*   **Latency**: Sending screenshots for every step can be slow depending on the model's response time.

### Future Roadmap
1.  **Cost Optimization**: Moving from proprietary LLMs to open-source multimodal models to reduce token costs for large-scale deployment.
2.  **Privacy**: Implementing rigorous PII redaction on screenshots before they leave the client. Ensuring GDPR Compliance.
3.  **Offline Mode**: Caching common navigation flows for standard government services.

## 👥 Meet the Team

*   [@AMuh2020](https://github.com/AMuh2020)
*   [@Muhammad-Ali-Shah](https://github.com/Muhammad-Ali-Shah)
*   [@PhantomCodeing](https://github.com/PhantomCodeing)
