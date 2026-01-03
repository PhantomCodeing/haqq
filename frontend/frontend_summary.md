# Frontend Summary

## Overview
The `access_project` frontend is a React-based observability and analytics dashboard designed to monitor user interactions, digital usage patterns, and the status of an AI OS Agent. It provides real-time visibility into how users interact with the system, distinguishing between AI-guided actions and organic user behaviors.

## Technology Stack
- **Core Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Shadcn/Radix UI, Lucide React (Icons)
- **Data Visualization**: Recharts
- **State/Data Fetching**: TanStack Query (implied), Supabase Client
- **Routing**: React Router DOM

## Key Functionalities

### 1. Dashboard (`/`)
The main interface serves as a comprehensive status board with the following features:
- **Activity Monitoring**: Displays metrics on user events, including click breakdown (Prompted vs. Unprompted) and Digital Independence Level.
- **Visual Analytics (`EventsChart`)**: A 24-hour timeline visualizing the volume of events (clicks, pageviews) to identify usage trends.
- **Real-time Status**: Indicators for the "OS Agent" connection status (Online/Offline) via `OsAgentStatus`.

### 2. User Action Tracking (`UserActionsList`)
A detailed feed of user behaviors:
- **Event Categorization**: Distinguishes between:
  - **AI Guided**: Actions where the user followed AI assistance.
  - **Organic**: Unprompted, independent user actions.
- **Event Types**: Monitors clicks, page loads, and OS-level activities.
- **Live Activity**: A "Happening Now" indicator showing currently active interpreted actions (e.g., "System Activity").

### 3. AI Assistant History (`AiStatusList`)
Tracks the operational state of the AI Assistant:
- **State Logging**: Records when the assistant is enabled or disabled.
- **Timeline**: Shows timestamps for state changes, allowing correlation with user performance or errors.

## Architecture & Data Flow
- **Connectivity**: The app communicates with a local backend (likely Python-based on port 8000) to fetch OS activity status.
- **Hooks**: separate data logic into custom hooks:
  - `useBehaviorEvents`: Aggregates general user interaction data.
  - `useOsTracking`: Dedicated to tracking OS-level interactions (implied by usage).
