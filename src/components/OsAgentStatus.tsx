import { useEffect, useState } from "react";

export const OsAgentStatus = ({ apiUrl = "http://127.0.0.1:8000/activity" }) => {
    const [status, setStatus] = useState<"connected" | "disconnected">("disconnected");

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch(apiUrl);
                setStatus(res.ok ? "connected" : "disconnected");
            } catch {
                setStatus("disconnected");
            }
        };
        const timer = setInterval(check, 5000);
        check();
        return () => clearInterval(timer);
    }, [apiUrl]);

    return (
        <div className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className={`w-2.5 h-2.5 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                <strong>OS Agent:</strong> {status === 'connected' ? 'Online' : 'Offline'}
            </div>
        </div>
    );
};
