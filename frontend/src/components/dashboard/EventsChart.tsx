import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format, subHours, startOfHour } from "date-fns";

interface BehaviorEvent {
  id: string;
  created_at: string;
  event_type: string;
}

interface EventsChartProps {
  events: BehaviorEvent[];
}

const EventsChart = ({ events }: EventsChartProps) => {
  // Group events by hour for the last 24 hours
  const now = new Date();
  const chartData = [];
  
  for (let i = 23; i >= 0; i--) {
    const hourStart = startOfHour(subHours(now, i));
    const hourEnd = startOfHour(subHours(now, i - 1));
    
    const eventsInHour = events.filter(e => {
      const eventTime = new Date(e.created_at);
      return eventTime >= hourStart && eventTime < hourEnd;
    });
    
    chartData.push({
      time: format(hourStart, 'HH:mm'),
      events: eventsInHour.length,
      clicks: eventsInHour.filter(e => e.event_type === 'click').length,
      pageviews: eventsInHour.filter(e => e.event_type === 'pageview').length,
    });
  }

  return (
    <div className="glass-card rounded-xl p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
      <h3 className="text-lg font-semibold mb-4">Activity Timeline</h3>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(174, 72%, 56%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="time" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(222, 47%, 8%)',
                border: '1px solid hsl(222, 30%, 18%)',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              itemStyle={{ color: 'hsl(174, 72%, 56%)' }}
            />
            <Area
              type="monotone"
              dataKey="events"
              stroke="hsl(174, 72%, 56%)"
              strokeWidth={2}
              fill="url(#colorEvents)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EventsChart;
