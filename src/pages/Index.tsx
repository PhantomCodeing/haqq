import { useState } from "react";
import { Activity, Users, MousePointerClick, Clock } from "lucide-react";
import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import EventsTable from "@/components/dashboard/EventsTable";
import EventsChart from "@/components/dashboard/EventsChart";
import ApiDocs from "@/components/dashboard/ApiDocs";
import AiStatusList from "@/components/dashboard/AiStatusList";
import UserActionsList from "@/components/dashboard/UserActionsList";
import { useBehaviorEvents } from "@/hooks/useBehaviorEvents";
import { useOsTracking } from "@/hooks/useOsTracking";

const Index = () => {
  const [showApiDocs, setShowApiDocs] = useState(false);
  const { events, isLoading, isRefreshing, refresh, stats, aiEvents, userActions, clickStats, skillLevel } = useBehaviorEvents();
  const { osActivity, history } = useOsTracking();

  // Merge and sort events
  const allEvents = [
    ...userActions
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Header
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          showApiDocs={showApiDocs}
          onToggleApiDocs={() => setShowApiDocs(!showApiDocs)}
        />

        {showApiDocs && (
          <div className="mb-6">
            <ApiDocs />
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Events"
            value={stats.totalEvents.toLocaleString()}
            subtitle="All time"
            icon={Activity}
            delay={0}
          />
          <StatCard
            title="Digital Independence Level"
            value={skillLevel}
            subtitle={skillLevel === "No Data" ? "Start using the assistant" : "Based on recent activity"}
            icon={Users}
            delay={50}
          />
          <StatCard
            title="Last Hour"
            value={stats.lastHourEvents}
            subtitle="Recent activity"
            icon={Clock}
            trend={stats.lastHourEvents > 0 ? { value: 12, isPositive: true } : undefined}
            delay={100}
          />
        </div>

        {/* Behavior Breakdown Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Prompted Behaviour"
            value={clickStats.prompted}
            subtitle="Guided by AI"
            icon={MousePointerClick}
            className="bg-green-500/10"
            delay={200}
          />
          <StatCard
            title="Unprompted Behaviour"
            value={clickStats.unprompted}
            subtitle="Organic User Actions"
            icon={MousePointerClick}
            className="bg-orange-500/10"
            delay={250}
          />
        </div>

        {/* Chart and Events */}
        <div className="mb-6">
          <EventsChart events={events} />
        </div>

        {/* Detailed User Actions */}
        {/* Detailed User Actions */}
        <div className="mb-6">
          <UserActionsList events={allEvents} currentActivity={osActivity} />
        </div>

        {/* Legacy Table (Optional - kept for detailed debugging if needed) */}
        <div className="hidden">
          <EventsTable events={events} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default Index;
