import { useEffect, useState } from "react";
// Ensure you have lucide-react or similar icons installed
// import { Wifi, WifiOff } from "lucide-react"; 

// NOTE: A simple component to display the connection status of the OS Agent
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
        <div style={{
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: status === 'connected' ? '#f0fff4' : '#fff5f5'
        }}>
            <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: status === 'connected' ? 'green' : 'red'
            }} />
            <div>
                <strong>OS Agent:</strong> {status === 'connected' ? 'Online' : 'Offline'}
            </div>
        </div>
    );
};
