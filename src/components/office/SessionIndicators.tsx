import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Palette, Image, BookOpen, Activity } from 'lucide-react';

interface SessionStats {
  creativeSessionsActive: number;
  creativeSessionsTotal: number;
  looksSessionsActive: number;
  looksSessionsTotal: number;
  totalClips: number;
  recentSelections: number;
}

export function SessionIndicators() {
  const [stats, setStats] = useState<SessionStats>({
    creativeSessionsActive: 0,
    creativeSessionsTotal: 0,
    looksSessionsActive: 0,
    looksSessionsTotal: 0,
    totalClips: 0,
    recentSelections: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    
    // Set up realtime subscriptions
    const channel = supabase
      .channel('office-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'creative_sessions' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'client_links' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'link_selections' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const [creativeSessions, clientLinks, clips, selections] = await Promise.all([
        supabase.from('creative_sessions').select('id, is_active'),
        supabase.from('client_links').select('id, is_active'),
        supabase.from('cached_clips').select('id', { count: 'exact', head: true }),
        supabase.from('link_selections').select('id, created_at').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ]);

      setStats({
        creativeSessionsActive: creativeSessions.data?.filter(s => s.is_active).length || 0,
        creativeSessionsTotal: creativeSessions.data?.length || 0,
        looksSessionsActive: clientLinks.data?.filter(l => l.is_active).length || 0,
        looksSessionsTotal: clientLinks.data?.length || 0,
        totalClips: clips.count || 0,
        recentSelections: selections.data?.length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const indicators = [
    {
      label: 'Creative Sessions',
      active: stats.creativeSessionsActive,
      total: stats.creativeSessionsTotal,
      icon: Palette,
      color: 'cyan',
      pulse: stats.creativeSessionsActive > 0,
    },
    {
      label: 'Looks Collection',
      active: stats.looksSessionsActive,
      total: stats.looksSessionsTotal,
      icon: Image,
      color: 'purple',
      pulse: stats.looksSessionsActive > 0,
    },
    {
      label: 'Clip Library',
      active: stats.totalClips,
      total: stats.totalClips,
      icon: BookOpen,
      color: 'emerald',
      pulse: false,
    },
    {
      label: 'Weekly Selections',
      active: stats.recentSelections,
      total: stats.recentSelections,
      icon: Activity,
      color: 'pink',
      pulse: stats.recentSelections > 5,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 animate-pulse">
            <div className="h-10 bg-zinc-800 rounded mb-2" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {indicators.map((ind) => (
        <div
          key={ind.label}
          className={`relative bg-zinc-900/80 border border-zinc-800 rounded-lg p-4 overflow-hidden group hover:border-${ind.color}-500/50 transition-colors`}
        >
          {/* Pulse indicator */}
          {ind.pulse && (
            <div className={`absolute top-3 right-3 w-2 h-2 rounded-full bg-${ind.color}-400 animate-pulse`} />
          )}
          
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg bg-${ind.color}-500/10 border border-${ind.color}-500/30 flex items-center justify-center mb-3`}>
            <ind.icon className={`w-5 h-5 text-${ind.color}-400`} />
          </div>

          {/* Stats */}
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-tech font-bold text-${ind.color}-400`}>
              {ind.active}
            </span>
            {ind.active !== ind.total && (
              <span className="text-xs font-tech text-zinc-500">/ {ind.total}</span>
            )}
          </div>
          
          <p className="text-xs font-tech text-zinc-400 mt-1 uppercase tracking-wider">
            {ind.label}
          </p>

          {/* Glow effect */}
          <div className={`absolute inset-0 bg-gradient-to-br from-${ind.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />
        </div>
      ))}
    </div>
  );
}
