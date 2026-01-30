import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DailyActivity {
  date: string;
  displayDate: string;
  selections: number;
  sessions: number;
  uploads: number;
}

export function ActivityChart() {
  const [data, setData] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const startDate = startOfDay(subDays(new Date(), 13));
      const endDate = new Date();

      const [selections, creativeSessions, moodItems] = await Promise.all([
        supabase
          .from('link_selections')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('creative_sessions')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('mood_board_items')
          .select('created_at')
          .gte('created_at', startDate.toISOString()),
      ]);

      const days = eachDayOfInterval({ start: startDate, end: endDate });
      
      const activityData: DailyActivity[] = days.map(day => {
        const dayStr = format(day, 'yyyy-MM-dd');
        
        const selectionsCount = selections.data?.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
        ).length || 0;

        const sessionsCount = creativeSessions.data?.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
        ).length || 0;

        const uploadsCount = moodItems.data?.filter(s => 
          format(new Date(s.created_at), 'yyyy-MM-dd') === dayStr
        ).length || 0;

        return {
          date: dayStr,
          displayDate: format(day, 'MMM d'),
          selections: selectionsCount,
          sessions: sessionsCount,
          uploads: uploadsCount,
        };
      });

      setData(activityData);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
          <p className="font-tech text-xs text-zinc-400 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs font-tech">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-300">{entry.name}:</span>
              <span className="text-white font-bold">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 h-[300px] animate-pulse">
        <div className="h-full bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-tech text-sm uppercase tracking-wider text-zinc-300">14-Day Activity</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setChartType('area')}
            className={`px-2 py-1 text-[10px] font-tech uppercase rounded transition-colors ${
              chartType === 'area' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Area
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-2 py-1 text-[10px] font-tech uppercase rounded transition-colors ${
              chartType === 'bar' 
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Bar
          </button>
        </div>
      </div>

      <div className="p-4 h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id="selectionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="uploadsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="selections"
                name="Selections"
                stroke="#06b6d4"
                fill="url(#selectionsGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke="#a855f7"
                fill="url(#sessionsGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="uploads"
                name="Uploads"
                stroke="#10b981"
                fill="url(#uploadsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <BarChart data={data}>
              <XAxis 
                dataKey="displayDate" 
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: '#27272a' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="selections" name="Selections" fill="#06b6d4" radius={[2, 2, 0, 0]} />
              <Bar dataKey="sessions" name="Sessions" fill="#a855f7" radius={[2, 2, 0, 0]} />
              <Bar dataKey="uploads" name="Uploads" fill="#10b981" radius={[2, 2, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="px-4 pb-3 flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-500" />
          <span className="text-[10px] font-tech text-zinc-400">Selections</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-[10px] font-tech text-zinc-400">Sessions</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-tech text-zinc-400">Uploads</span>
        </div>
      </div>
    </div>
  );
}
