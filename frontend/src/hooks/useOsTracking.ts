import { useEffect, useState, useRef } from "react";

interface OsActivityResponse {
    status: string;
    raw_title: string;
    interpreted: {
        action: string;
        category: string;
    };
}

export const useOsTracking = (apiUrl: string = "http://127.0.0.1:8000/activity") => {
    const [osActivity, setOsActivity] = useState<OsActivityResponse | null>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const lastTitleRef = useRef<string>("");

    useEffect(() => {
        const checkOsActivity = async () => {
            try {
                // console.log("OS Agent: Polling...", apiUrl); // Comment out to reduce noise if needed
                const res = await fetch(apiUrl);
                if (res.ok) {
                    if (!isConnected) {
                        console.log("OS Agent: Connection Restored");
                        setIsConnected(true);
                    }
                    const data: OsActivityResponse = await res.json();

                    // console.log("OS Agent Data:", data);

                    if (data.status === 'active') {
                        if (data.raw_title !== lastTitleRef.current) {
                            console.log("OS Agent: New Activity Detected:", data.interpreted.action, data);
                            lastTitleRef.current = data.raw_title;
                            setOsActivity(data);

                            // Add to history
                            setHistory(prev => {
                                const newEvent = {
                                    id: `os-${Date.now()}`,
                                    interpreted: data.interpreted,
                                    timestamp: new Date().toISOString()
                                };
                                // Keep last 50 events
                                return [newEvent, ...prev].slice(0, 50);
                            });
                        } else {
                            // Even if title is same, we might want to update if we had null before
                            if (!osActivity) setOsActivity(data);
                        }
                    }
                } else {
                    if (isConnected) {
                        console.warn("OS Agent: Connection Lost (Status Error)", res.status);
                        setIsConnected(false);
                    }
                }
            } catch (e) {
                if (isConnected) {
                    console.error("OS Agent: Connection Failed", e);
                    setIsConnected(false);
                }
            }
        };

        // Poll every 1 second for snappier updates
        const interval = setInterval(checkOsActivity, 1000);
        return () => clearInterval(interval);
    }, [apiUrl, isConnected, osActivity]);

    return { osActivity, isConnected, history };
};
