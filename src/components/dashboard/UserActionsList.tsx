import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MousePointerClick, Globe, Layout, Clock, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { OsAgentStatus } from "../OsAgentStatus";

interface UserEvent {
    id: string;
    created_at: string;
    event_type: string;
    event_name: string;
    url: string | null;
    page_title: string | null;
    element_text: string | null;
    metadata: any;
}

interface UserActionsListProps {
    events: UserEvent[];
    currentActivity?: {
        status: string;
        interpreted: {
            action: string;
            category: string;
        };
    } | null;
}

const UserActionsList = ({ events, currentActivity }: UserActionsListProps) => {
    const getIcon = (type: string) => {
        switch (type) {
            case 'click':
                return <MousePointerClick className="h-4 w-4 text-blue-500" />;
            case 'navigation':
            case 'pageload':
                return <Globe className="h-4 w-4 text-green-500" />;
            case 'os_activity':
                return <Activity className="h-4 w-4 text-purple-500" />;
            default:
                return <Layout className="h-4 w-4 text-gray-500" />;
        }
    };


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="flex items-center gap-2">
                    <ActivityIcon />
                    Recent User Actions
                </CardTitle>
                <OsAgentStatus />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {currentActivity && currentActivity.status === 'active' && (
                        <div className="relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
                            <div className="p-4 pl-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </div>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-green-600 dark:text-green-400">
                                        Happening Now
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-lg leading-tight">
                                        {currentActivity.interpreted.action}
                                    </p>
                                    <p className="text-sm text-muted-foreground capitalize">
                                        {currentActivity.interpreted.category || 'System Activity'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    {events.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No user actions recorded
                        </div>
                    ) : (
                        events.map((event) => (
                            <div
                                key={event.id}
                                className="flex items-start gap-3 p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                            >
                                <div className="mt-1 p-1.5 bg-muted rounded-md border">
                                    {getIcon(event.event_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        {event.event_type === 'prompted' ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-xs font-normal">
                                                AI Guided
                                            </Badge>
                                        ) : event.event_type === 'unprompted' ? (
                                            <Badge variant="secondary" className="text-xs font-normal bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                                                Organic
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="capitalize text-xs font-normal">
                                                {event.event_type.replace('_', ' ')}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                        </span>
                                    </div>

                                    <div className="text-sm font-medium leading-none mb-1.5 truncate">
                                        {event.element_text || event.page_title || 'Unknown Element'}
                                    </div>

                                    {event.url && (
                                        <div className="text-xs text-muted-foreground truncate" title={event.url}>
                                            {new URL(event.url).hostname}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

// Helper component for the header icon
const ActivityIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5 text-primary"
    >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
);

export default UserActionsList;
