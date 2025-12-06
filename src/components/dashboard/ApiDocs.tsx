import { Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const ApiDocs = () => {
  const [copied, setCopied] = useState<string | null>(null);
  
  const apiEndpoint = `https://yasmezksvxoeohloorxt.supabase.co/functions/v1/track-event`;
  
  const examplePayload = `{
  "session_id": "unique-session-123",
  "event_type": "click",
  "event_name": "button_click",
  "url": "https://example.com/page",
  "page_title": "Example Page",
  "element_selector": "#submit-btn",
  "element_text": "Submit",
  "metadata": {
    "custom_field": "value"
  }
}`;

  const batchPayload = `[
  {
    "session_id": "session-123",
    "event_type": "pageview",
    "event_name": "page_loaded",
    "url": "https://example.com"
  },
  {
    "session_id": "session-123",
    "event_type": "click",
    "event_name": "cta_click",
    "element_text": "Sign Up"
  }
]`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">API Documentation</h3>
        <a 
          href={apiEndpoint} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          Test Endpoint <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Endpoint</label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border/50">
            <code className="text-sm text-primary flex-1 truncate font-mono">
              POST {apiEndpoint}
            </code>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(apiEndpoint, 'endpoint')}
              className="shrink-0 h-8 w-8 p-0"
            >
              {copied === 'endpoint' ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Single Event Payload</label>
          <div className="relative">
            <pre className="p-3 bg-muted/50 rounded-lg border border-border/50 text-xs overflow-x-auto font-mono text-muted-foreground">
              {examplePayload}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(examplePayload, 'single')}
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              {copied === 'single' ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Batch Events Payload</label>
          <div className="relative">
            <pre className="p-3 bg-muted/50 rounded-lg border border-border/50 text-xs overflow-x-auto font-mono text-muted-foreground">
              {batchPayload}
            </pre>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(batchPayload, 'batch')}
              className="absolute top-2 right-2 h-8 w-8 p-0"
            >
              {copied === 'batch' ? (
                <Check className="h-4 w-4 text-success" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Headers:</strong> Content-Type: application/json
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            <strong className="text-foreground">Note:</strong> No authentication required. IP and User-Agent are automatically captured.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;
