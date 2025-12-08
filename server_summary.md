# OS Agent Server Summary

## Purpose
The OS Agent Server acts as the backend brain for the Digital Literacy Assistant project. Its primary goal is to facilitate a "Digital Literacy Guide" that teaches users how to use the web and their computer step-by-step. It bridges the gap between the user's browser (via the Chrome Extension) and the operating system, providing a holistic view of the user's activity to offer context-aware AI assistance.

## Technologies Used
*   **Language**: Python
*   **Web Framework**: FastAPI (High-performance web API framework)
*   **Server**: Uvicorn (ASGI web server implementation)
*   **AI Model**: Google Gemini 2.5 Flash (via `google.generativeai`) usually used for multimodal reasoning (text + images).
*   **System Utilities**: `psutil` (for process and window management), `signal` (for graceful shutdowns).
*   **Data Handling**: Python built-in `json` for simple file-based persistence.

## Core Functionality & Effects

### 1. Context-Aware AI Assistance
The server hosts a `/chat` endpoint that communicates with Google Gemini. It constructs complex prompts that include:
*   **User Requests**: What the user wants to do.
*   **Global Goals**: The "Definition of Done" for the current task.
*   **Context**: Previous steps and history.
*   **Visual Context**: Screenshots captured by the browser extension.
*   **Page Content**: HTML content from the user's current web page.

This allows the AI to provide specific, verifiable instructions (e.g., "Click the blue 'Submit' button") rather than generic advice.

### 2. Operating System Activity Tracking
Using a custom tracker, the server monitors the user's "Active Window" on the OS level.
*   It logs what applications or websites (window titles) the user is interacting with.
*   It uses Gemini to "interpret" these raw window titles into meaningful categories (e.g., "Browsing", "Coding", "Productivity").
*   This provides a background layer of "OS Activity" context that runs independently of the browser extension.

### 3. Behavioral Events & Analytics
The server acts as a central logger for user behaviors:
*   **Extension Events**: Receives stats from the Chrome extension, such as clicks, page loads, and element interactions.
*   **Prompted vs. Unprompted**: It distinguishes between actions the user took because the AI told them to ("Prompted") versus organic actions ("Unprompted").
*   **Storage**: Events are persisted to a local JSON file (`events.json`), enabling a dashboard to visualize the user's learning progress and independence level over time.

### 4. Application Management
*   The server includes robust startup logic to ensure it has a clean environment, automatically killing any rogue processes holding its port (8000) before starting.
*   It runs a local CORS-enabled API server, allowing the browser extension to communicate with it securely from any web page.
