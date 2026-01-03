# Digital Literacy Assistant - Extension Summary

## Overview
The Digital Literacy Assistant is a Chrome Extension designed to support Manchester City Council residents in navigating digital services. It provides an intuitive, always-available overlay that offers real-time assistance, guided tours, and progress tracking directly within the browser data.

## User Interface (UI)
The extension injects a non-intrusive interface into web pages using a **Shadow DOM** to ensure its styling does not conflict with the host website.
- **Floating Action Button (FAB)**: A permanent "Help" button (?) located in the bottom-right corner of the screen. This ensures assistance is always one click away.
- **Chat Interface**: Clicking the FAB expands a chat window where users can type questions (e.g., "How do I pay my council tax?").
- **Dashboard Tabs**: The interface is divided into two main sections:
    - **Chat**: For active assistance.
    - **My Progress**: A dashboard displaying personal usage metrics.

## Core Functionality

### 1. Context-Aware AI Assistance
When a user asks a question, the extension performs the following actions:
- **Screen Capture**: It triggers a screenshot of the user's current view.
- **Visual Analysis**: This screenshot, along with the user's text query, is sent to a backend server (powered by Google Gemini).
- **Intelligent Response**: The AI analyzes the visual context of the page to provide specific, relevant instructions tailored to exactly what the user is seeing.

### 2. Guided Tours & Highlighting
To bridge the gap between text instructions and action, the extension includes a "Guided Tour" feature powered by **Driver.js**:
- **Visual Highlighting**: The extension can dim the background and spotlight specific page elements (like buttons, forms, or headers) to focus the user's attention.
- **Step-by-Step Walkthroughs**: It displays popover instructions next to the highlighted elements, physically navigating the user through a task (e.g., "First, click here to log in").

### 3. Personal Progress & Metrics
To encourage digital independence, the extension tracks user engagement:
- **Usage Tracking**: It records the number of help requests and the types of queries made.
- **Streak Counter**: Displays how many consecutive days the user has engaged with digital tasks to gamify the learning process.
- **Privacy**: All metrics are stored locally within the browser (`chrome.storage.local`), ensuring user data remains private and is not sent to a central tracking server without consent.

## Technical Architecture

### Frontend (Chrome Extension)
- **Content Scripts**: Injected into pages to render the UI and handle user interactions. Uses an **IIFE (Immediately Invoked Function Expression)** pattern for code isolation.
- **Background Service Worker**: Handles privileged tasks such as capturing the visible tab and managing secure communication with the backend server.
- **Manifest V3**: Compliant with the latest Chrome Extension security and performance standards.

### Backend (Python Server)
- **FastAPI Application**: A lightweight Python server that acts as the intelligence layer.
- **Gemini Integration**: Connects to the Google Gemini API to process multimodal inputs (text + images) and generate helpful responses.
- **Image Processing**: Decodes and formats screenshots for AI analysis.

### Library Integration
- **Driver.js**: Integrated directly into the content script to provide robust, accessible element highlighting and tour overlays without needing complex custom implementation.
