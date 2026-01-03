import { useEffect, useState, useRef } from "react";

// NOTE: Add this interface to your types file or component
interface OsActivityResponse {
    status: string;
    raw_title: string;
    interpreted: {
        action: string;
        category: string;
    };
}

// NOTE: This is a standalone hook. You can drop this into your React project.
// Usage: const { osActivity, isConnected } = useOsTracking();
export const useOsTracking = (apiUrl: string = "http://127.0.0.1:8000/activity") => {
    const [osActivity, setOsActivity] = useState<OsActivityResponse | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const lastTitleRef = useRef<string>("");

    useEffect(() => {
        const checkOsActivity = async () => {
            try {
                const res = await fetch(apiUrl);
                if (res.ok) {
                    setIsConnected(true);
                    const data: OsActivityResponse = await res.json();

                    if (data.status === 'active') {
                        // Only update if changed to prevent re-renders
                        if (data.raw_title !== lastTitleRef.current) {
                            console.log("OS Agent: New Activity Detected:", data.interpreted.action);
                            lastTitleRef.current = data.raw_title;
                            setOsActivity(data);
                        }
                    }
                } else {
                    setIsConnected(false);
                }
            } catch (e) {
                console.error("OS Agent Connection Error:", e);
                setIsConnected(false);
            }
        };

        // Poll every 2 seconds
        const interval = setInterval(checkOsActivity, 2000);
        return () => clearInterval(interval);
    }, [apiUrl]);

    return { osActivity, isConnected };
};
