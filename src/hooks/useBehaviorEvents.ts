import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  const fetchEvents = async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const { data, error } = await supabase
        .from('behavior_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('behavior-events-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'behavior_events',
        },
        (payload) => {
          console.log('New event received:', payload);
          setEvents((prev) => [payload.new as BehaviorEvent, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
  };
};
