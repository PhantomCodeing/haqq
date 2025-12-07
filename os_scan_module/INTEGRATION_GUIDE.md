# OS Scan Module Integration Guide

This folder contains a standalone **OS Tracking Agent** (Python) and frontend snippets (React) to integrate it into your dashboard.

## Folder Structure
- `backend/`: The Python server that tracks windows and uses Gemini AI.
- `frontend_snippets/`: Ready-to-use React hooks and components.

---

## 1. Setup the Backend (The "Eyes")

1.  **Copy**: Move the `backend` folder to your project root (e.g., rename it to `os_agent_server`).
2.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  **Environment Variables**:
    - Rename `.env.example` to `.env`.
    - Open it and paste your Google AI Studio Key:
    ```env
    GEMINI_API_KEY="AIzaSyD..."
    ```
4.  **Run in Antigravity Terminal**:
    - Open the IDE Terminal.
    - Navigate to the backend folder: `cd os_agent_server`
    - Start the agent: `python main.py`

5.  **Verify**:
    - Run `python verify_tracking.py` to confirm the agent can see your windows.

---

## 2. Integrate the Frontend (The "Display")

### Option A: Use the Hook (Custom logic)
Copy `frontend_snippets/useOsTracking.ts` to your hooks directory.

```typescript
import { useOsTracking } from './hooks/useOsTracking';

const MyDashboard = () => {
  const { osActivity, isConnected } = useOsTracking();

  return (
    <div>
       <p>Agent Status: {isConnected ? "Online" : "Offline"}</p>
       {osActivity && (
         <p>User is currently: {osActivity.interpreted.action}</p>
       )}
    </div>
  );
};
```

### Option B: Use the Status Component
Copy `frontend_snippets/OsAgentStatus.tsx` to your components directory.

```tsx
import { OsAgentStatus } from './components/OsAgentStatus';

// In your JSX:
<OsAgentStatus />
```

---

## 3. Extension Integration (Optional)
This agent also accepts data from Chrome Extensions.
- **Endpoint**: `POST http://127.0.0.1:8000/extension-events`
- **Body**: `{"url": "...", "title": "...", "timestamp": 123.45}`
