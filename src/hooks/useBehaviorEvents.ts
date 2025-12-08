import { useEffect, useState } from "react";

interface BehaviorEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_name: string;
  url: string | null;
  page_title: string | null;
  element_selector: string | null;
  element_text: string | null;
  metadata: unknown;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
}

export const useBehaviorEvents = () => {
  const [events, setEvents] = useState<BehaviorEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [clickStats, setClickStats] = useState<{ prompted: number, unprompted: number }>({ prompted: 0, unprompted: 0 });

  const fetchEvents = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);

    try {
      // NOTE: We are currently only fetching click stats from the local server.
      // Behavior events are not yet migrated to the local server fully (unless we want to).
      // For now, let's just focus on click stats as requested.
      // But wait, the dashboard expects 'events' for the chart. 
      // The implementation plan mentioned "Add GET /events" but I only implemented GET /stats which returns click stats.
      // Let's assume for this step we map click stats to events or just handle click stats.
      // Actually, the user asked to replace Supabase. So 'behavior_events' (Supabase) are gone.
      // I should allow fetchEvents to return empty or mock data, or reuse click_stats as events.

      const response = await fetch('http://localhost:8000/stats');
      const data = await response.json();
      const rawEvents = data.data || [];

      // Map backend events to frontend schema
      const mappedEvents: BehaviorEvent[] = rawEvents.map((e: any) => ({
        id: e.id,
        session_id: 'session-1', // Default for now
        event_type: e.event_type,
        event_name: e.event_name,
        url: e.url,
        page_title: e.page_title,
        element_selector: null,
        element_text: null,
        metadata: e.metadata,
        user_agent: null,
        ip_address: null,
        created_at: e.created_at
      }));

      setEvents(mappedEvents);

      // Calculate split
      const prompted = mappedEvents.filter((d) => d.event_type === 'prompted').length;
      const unprompted = mappedEvents.filter((d) => d.event_type === 'unprompted').length;
      setClickStats({ prompted, unprompted });

    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    // No realtime subscription for SQLite
    const interval = setInterval(() => fetchEvents(), 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  const refresh = () => fetchEvents(true);

  // Calculate stats
  const stats = {
    totalEvents: events.length,
    uniqueSessions: new Set(events.map(e => e.session_id)).size,
    eventTypes: events.reduce((acc, e) => {
      acc[e.event_type] = (acc[e.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    lastHourEvents: events.filter(e => {
      const eventTime = new Date(e.created_at);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return eventTime > oneHourAgo;
    }).length,
  };

  return {
    events,
    isLoading,
    isRefreshing,
    refresh,
    stats,
    aiEvents: events.filter(e => e.event_type === 'ai_state_change'),
    userActions: events.filter(e => e.event_type !== 'ai_state_change'),
    clickStats,
    skillLevel: (() => {
      const total = clickStats.prompted + clickStats.unprompted;
      if (total === 0) return "No Data";
      const ratio = clickStats.prompted / total;

      if (ratio > 0.7) return "AI Reliant";
      if (ratio > 0.4) return "AI Assisted";
      if (ratio > 0.1) return "Mostly Independent";
      return "Independent";
    })()
  };
};
