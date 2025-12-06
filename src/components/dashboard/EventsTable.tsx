import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MousePointerClick, Eye, Keyboard, Navigation, Zap } from "lucide-react";

interface BehaviorEvent {
  id: string;
  session_id: string;
  event_type: string;
  event_name: string;
  url: string | null;
  page_title: string | null;
  element_selector: string | null;
  element_text: string | null;
  created_at: string;
}

interface EventsTableProps {
  events: BehaviorEvent[];
  isLoading: boolean;
}

const getEventIcon = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'click':
      return MousePointerClick;
    case 'pageview':
      return Eye;
    case 'input':
    case 'keypress':
      return Keyboard;
    case 'navigation':
      return Navigation;
    default:
      return Zap;
  }
};

const getEventColor = (eventType: string) => {
  switch (eventType.toLowerCase()) {
    case 'click':
      return 'bg-chart-1/20 text-primary border-primary/30';
    case 'pageview':
      return 'bg-chart-2/20 text-purple-400 border-purple-400/30';
    case 'input':
    case 'keypress':
      return 'bg-chart-3/20 text-warning border-warning/30';
    case 'navigation':
      return 'bg-chart-4/20 text-success border-success/30';
    default:
      return 'bg-muted text-muted-foreground border-muted';
  }
};

const EventsTable = ({ events, isLoading }: EventsTableProps) => {
  if (isLoading) {
    return (
      <div className="glass-card rounded-xl p-6 animate-fade-in">
        <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-3 w-48 bg-muted rounded" />
              </div>
              <div className="h-6 w-20 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Events</h3>
        <span className="text-sm text-muted-foreground">{events.length} events</span>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No events yet</p>
          <p className="text-sm">Events from your Chrome extension will appear here</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
          {events.map((event, index) => {
            const Icon = getEventIcon(event.event_type);
            return (
              <div 
                key={event.id} 
                className="event-row flex items-center gap-4 p-3 rounded-lg"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn("p-2 rounded-lg", getEventColor(event.event_type).split(' ')[0])}>
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {event.event_name}
                    </span>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getEventColor(event.event_type))}
                    >
                      {event.event_type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {event.url || event.page_title || event.element_text || 'No details'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground font-mono">
                    {format(new Date(event.created_at), 'HH:mm:ss')}
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    {format(new Date(event.created_at), 'MMM dd')}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventsTable;
