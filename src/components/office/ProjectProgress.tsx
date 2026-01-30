import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { Calendar, Clock, CheckCircle2, AlertTriangle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Project {
  id: string;
  project_name: string;
  client_name: string;
  created_at: string;
  is_active: boolean;
  type: 'creative' | 'looks';
  event_date?: string;
  daysRemaining?: number;
  progress: number;
}

export function ProjectProgress() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const [creativeSessions, clientLinks] = await Promise.all([
        supabase.from('creative_sessions').select('*').order('created_at', { ascending: false }),
        supabase.from('client_links').select('*').order('created_at', { ascending: false }),
      ]);

      const creativeProjects: Project[] = (creativeSessions.data || []).map(s => {
        const daysElapsed = differenceInDays(new Date(), new Date(s.created_at));
        const progress = Math.min(100, (daysElapsed / 21) * 100);
        return {
          id: s.id,
          project_name: s.project_name,
          client_name: s.client_name,
          created_at: s.created_at,
          is_active: s.is_active,
          type: 'creative' as const,
          daysRemaining: Math.max(0, 21 - daysElapsed),
          progress,
        };
      });

      const looksProjects: Project[] = (clientLinks.data || []).map(l => {
        const eventDate = l.event_date ? new Date(l.event_date) : null;
        const daysUntilEvent = eventDate ? differenceInDays(eventDate, new Date()) : null;
        return {
          id: l.id,
          project_name: l.event_name,
          client_name: l.client_name,
          created_at: l.created_at,
          is_active: l.is_active,
          type: 'looks' as const,
          event_date: l.event_date || undefined,
          daysRemaining: daysUntilEvent ?? undefined,
          progress: daysUntilEvent !== null ? Math.max(0, Math.min(100, 100 - (daysUntilEvent / 30) * 100)) : 50,
        };
      });

      setProjects([...creativeProjects, ...looksProjects].slice(0, 10));
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (project: Project) => {
    if (!project.is_active) return 'zinc';
    if (project.daysRemaining !== undefined) {
      if (project.daysRemaining <= 0) return 'red';
      if (project.daysRemaining <= 5) return 'amber';
      if (project.daysRemaining <= 10) return 'yellow';
    }
    return 'emerald';
  };

  if (loading) {
    return (
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="font-tech text-sm uppercase tracking-wider text-zinc-300">Active Projects</h3>
        <span className="text-xs font-tech text-cyan-400">{projects.filter(p => p.is_active).length} active</span>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="divide-y divide-zinc-800/50">
          {projects.map((project) => {
            const statusColor = getStatusColor(project);
            return (
              <div
                key={`${project.type}-${project.id}`}
                className="p-4 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-tech uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        project.type === 'creative' 
                          ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                          : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      }`}>
                        {project.type}
                      </span>
                      {!project.is_active && (
                        <span className="text-[10px] font-tech uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                          Closed
                        </span>
                      )}
                    </div>
                    <h4 className="font-tech font-bold text-white truncate">{project.project_name}</h4>
                    <p className="text-xs font-tech text-zinc-500">{project.client_name}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {project.daysRemaining !== undefined && project.is_active && (
                      <div className={`flex items-center gap-1 text-${statusColor}-400`}>
                        {project.daysRemaining <= 0 ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : project.daysRemaining <= 5 ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <Calendar className="w-3 h-3" />
                        )}
                        <span className="text-xs font-tech font-bold">
                          {project.daysRemaining <= 0 ? 'Expired' : `${project.daysRemaining}d`}
                        </span>
                      </div>
                    )}
                    {project.event_date && (
                      <span className="text-[10px] font-tech text-zinc-500">
                        {format(new Date(project.event_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <Progress 
                    value={project.progress} 
                    className={`h-1.5 flex-1 bg-zinc-800 [&>div]:bg-${statusColor}-500`}
                  />
                  <span className="text-[10px] font-tech text-zinc-500 w-8 text-right">
                    {Math.round(project.progress)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
