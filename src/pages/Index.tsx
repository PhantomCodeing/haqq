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

const Index = () => {
  const [showApiDocs, setShowApiDocs] = useState(false);
  const { events, isLoading, isRefreshing, refresh, stats, aiEvents, userActions } = useBehaviorEvents();

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
            title="Unique Sessions"
            value={stats.uniqueSessions.toLocaleString()}
            subtitle="Active users"
            icon={Users}
            delay={50}
          />
          <StatCard
            title="Click Events"
            value={stats.eventTypes['click'] || 0}
            subtitle={`${Math.round(((stats.eventTypes['click'] || 0) / Math.max(stats.totalEvents, 1)) * 100)}% of total`}
            icon={MousePointerClick}
            delay={100}
          />
          <StatCard
            title="Last Hour"
            value={stats.lastHourEvents}
            subtitle="Recent activity"
            icon={Clock}
            trend={stats.lastHourEvents > 0 ? { value: 12, isPositive: true } : undefined}
            delay={150}
          />
        </div>

        {/* Chart and Events */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <EventsChart events={events} />
          <div className="flex flex-col gap-6">
            <AiStatusList events={aiEvents} />
          </div>
        </div>

        {/* Detailed User Actions */}
        <div className="mb-6">
          <UserActionsList events={userActions} />
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
