import { useEffect, useState } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { OperatorGuard } from '@/components/office/OperatorGuard';
import { supabase } from '@/integrations/supabase/client';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface LoginEvent {
  id: string;
  email: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface GeoInfo {
  city?: string;
  region?: string;
  country_name?: string;
}

// Cheap client + OS read-out from the raw UA string — good enough for "which
// browser/device signed in", not a full parse.
function describeUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser =
    ua.match(/Edg\//) ? 'Edge'
    : ua.match(/Chrome\//) && !ua.match(/Chromium/) ? 'Chrome'
    : ua.match(/Firefox\//) ? 'Firefox'
    : ua.match(/Safari\//) && !ua.match(/Chrome/) ? 'Safari'
    : 'Unknown browser';
  const os =
    ua.match(/Windows/) ? 'Windows'
    : ua.match(/Mac OS X/) ? 'macOS'
    : ua.match(/iPhone|iPad/) ? 'iOS'
    : ua.match(/Android/) ? 'Android'
    : ua.match(/Linux/) ? 'Linux'
    : 'Unknown OS';
  return `${browser} · ${os}`;
}

// Resolved lazily, only when this page is opened, so an IP is sent to the
// lookup service only when the owner is actually viewing the report — never
// at log time.
async function resolveLocation(ip: string): Promise<GeoInfo | null> {
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) return null;
    return { city: data.city, region: data.region, country_name: data.country_name };
  } catch {
    return null;
  }
}

function AdminLoginActivityContent() {
  const [events, setEvents] = useState<LoginEvent[]>([]);
  const [geo, setGeo] = useState<Record<string, GeoInfo | null>>({});
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_login_events')
        .select('id, email, ip_address, user_agent, created_at')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setEvents((data ?? []) as LoginEvent[]);

      const uniqueIps = Array.from(
        new Set((data ?? []).map((e: LoginEvent) => e.ip_address).filter(Boolean))
      ) as string[];
      const resolved = await Promise.all(uniqueIps.map(async (ip) => [ip, await resolveLocation(ip)] as const));
      setGeo(Object.fromEntries(resolved));
    } catch (error) {
      console.error('Error fetching login activity:', error);
      toast.error('Failed to load login activity');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const locationFor = (ip: string | null) => {
    if (!ip) return '—';
    const info = geo[ip];
    if (info === undefined) return 'Looking up…';
    if (info === null) return 'Unknown';
    return [info.city, info.region, info.country_name].filter(Boolean).join(', ') || 'Unknown';
  };

  return (
    <AdminShell
      title="Login Activity"
      subtitle="Who has signed into /admin, and from where. Visible only to you."
      actions={
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={isLoading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      }
    >
      {events.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
          <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>
          <p className="text-xs text-muted-foreground/70">
            The next time anyone signs into /admin, it will show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>IP address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Device</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(e.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{e.email}</TableCell>
                  <TableCell>
                    {e.ip_address ? <Badge variant="outline">{e.ip_address}</Badge> : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {locationFor(e.ip_address)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {describeUserAgent(e.user_agent)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminShell>
  );
}

export default function AdminLoginActivity() {
  return (
    <OperatorGuard>
      <AdminLoginActivityContent />
    </OperatorGuard>
  );
}
