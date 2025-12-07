import { Activity, RefreshCw, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  showApiDocs: boolean;
  onToggleApiDocs: () => void;
}

const Header = ({ onRefresh, isRefreshing, showApiDocs, onToggleApiDocs }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between mb-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/20 glow-effect">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Behavior Analytics</h1>
          <p className="text-sm text-muted-foreground">Track user interactions from your Chrome extension</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleApiDocs}
          className={cn(
            "gap-2 border-border/50 hover:bg-secondary",
            showApiDocs && "bg-secondary border-primary/50"
          )}
        >
          <Code className="h-4 w-4" />
          API Docs
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="gap-2 border-border/50 hover:bg-secondary"
        >
          <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>
    </header>
  );
};

export default Header;
