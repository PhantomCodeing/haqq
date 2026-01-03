import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Power, CircleDot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AiEvent {
    id: string;
    created_at: string;
    element_text: string | null;
    metadata: any;
}

interface AiStatusListProps {
    events: AiEvent[];
}

const AiStatusList = ({ events }: AiStatusListProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Assistant Status
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {events.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4">
                            No AI state changes recorded
                        </div>
                    ) : (
                        events.map((event) => {
                            const isOn = event.element_text === 'ON' || event.metadata?.state === 'ON';
                            return (
                                <div
                                    key={event.id}
                                    className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${isOn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                            <Power className={`h-4 w-4 ${isOn ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                Assistant {isOn ? 'Enabled' : 'Disabled'}
                                                {isOn && <Badge variant="secondary" className="text-xs">Active</Badge>}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <CircleDot className="h-3 w-3" />
                                                {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default AiStatusList;
