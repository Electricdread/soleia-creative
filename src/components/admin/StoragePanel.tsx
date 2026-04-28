import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  RefreshCw,
  HardDrive,
  CloudUpload,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlayCircle,
  StopCircle,
} from 'lucide-react';

type StatusReport = {
  healthy?: boolean;
  totalMs?: number;
  verifyCredentials?: { ok: boolean; status?: number; outcome?: string | null; latencyMs?: number; error?: string | null };
  list?: { ok: boolean; status?: number; latencyMs?: number; error?: string | null };
  write?: { ok: boolean; status?: number; latencyMs?: number; error?: string | null; createdId?: string; cleanedUp?: boolean; cleanupError?: string | null };
  soleiaFolder?: { id: string; name: string; webViewLink: string } | null;
  errors?: string[];
};

type MigrationResult =
  | { kind: 'success'; id: string; title: string; driveFileId: string; driveWebViewLink: string | null }
  | { kind: 'error'; id: string; title: string; error: string; skipped?: boolean };

const SUPABASE_PROJECT_REF = (import.meta.env.VITE_SUPABASE_URL as string | undefined)
  ?.match(/https?:\/\/([^.]+)\./)?.[1];

function clipPublicUrl(filename: string) {
  return SUPABASE_PROJECT_REF
    ? `https://${SUPABASE_PROJECT_REF}.supabase.co/storage/v1/object/public/clips/${encodeURIComponent(filename)}`
    : null;
}

function StatusPill({
  label,
  ok,
  latencyMs,
}: {
  label: string;
  ok: boolean | undefined;
  latencyMs?: number;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${
        ok
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
          : 'border-destructive/40 bg-destructive/10 text-destructive'
      }`}
    >
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      <span className="font-medium">{label}</span>
      {typeof latencyMs === 'number' && (
        <span className="opacity-70">{latencyMs}ms</span>
      )}
    </div>
  );
}

export function StoragePanel() {
  const { toast } = useToast();

  // Drive status
  const [statusLoading, setStatusLoading] = useState(false);
  const [status, setStatus] = useState<StatusReport | null>(null);

  // Stats
  const [stats, setStats] = useState({ total: 0, supabase: 0, drive: 0 });
  const [statsLoading, setStatsLoading] = useState(false);

  // Orphans (raw bucket files not in cached_clips)
  const [orphans, setOrphans] = useState({ count: 0, bytes: 0 });
  const [orphansLoading, setOrphansLoading] = useState(false);
  const [orphanRunning, setOrphanRunning] = useState(false);
  const [orphanCancel, setOrphanCancel] = useState(false);
  const [orphanProgress, setOrphanProgress] = useState({ migrated: 0, total: 0, remaining: 0 });
  const [orphanResults, setOrphanResults] = useState<MigrationResult[]>([]);

  // Migration
  const [batchSize, setBatchSize] = useState(2);
  const [running, setRunning] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);
  const [results, setResults] = useState<MigrationResult[]>([]);
  const [progress, setProgress] = useState({ migrated: 0, total: 0, remaining: 0 });

  const refreshStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const total = await supabase
        .from('cached_clips')
        .select('id', { count: 'exact', head: true });
      const onDrive = await supabase
        .from('cached_clips')
        .select('id', { count: 'exact', head: true })
        .eq('original_storage', 'drive');
      const onSupabase = await supabase
        .from('cached_clips')
        .select('id', { count: 'exact', head: true })
        .eq('original_storage', 'supabase')
        .not('video_url', 'is', null)
        .like('video_url', '%/storage/v1/object/public/clips/%');
      setStats({
        total: total.count ?? 0,
        supabase: onSupabase.count ?? 0,
        drive: onDrive.count ?? 0,
      });
    } catch (e) {
      console.error('refreshStats error:', e);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const runStatus = useCallback(async () => {
    setStatusLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('drive-status', {
        body: {},
      });
      if (error) throw error;
      setStatus(data as StatusReport);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({
        title: 'Drive status check failed',
        description: msg,
        variant: 'destructive',
      });
      setStatus({
        healthy: false,
        errors: [msg],
        verifyCredentials: { ok: false, error: msg },
        list: { ok: false },
        write: { ok: false },
      });
    } finally {
      setStatusLoading(false);
    }
  }, [toast]);

  const refreshOrphans = useCallback(async () => {
    setOrphansLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-clips-to-drive', {
        body: { mode: 'count' },
      });
      if (error) throw error;
      const d = data as { totalOrphans: number; totalBytes: number };
      setOrphans({ count: d.totalOrphans ?? 0, bytes: d.totalBytes ?? 0 });
    } catch (e) {
      console.error('refreshOrphans error:', e);
    } finally {
      setOrphansLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    runStatus();
    refreshOrphans();
  }, [refreshStats, runStatus, refreshOrphans]);

  const runOrphanBatch = async (size: number) => {
    const { data, error } = await supabase.functions.invoke('migrate-clips-to-drive', {
      body: { mode: 'orphans', batchSize: size },
    });
    if (error) throw error;
    return data as {
      processed: number;
      migratable?: number;
      succeeded: Array<{ id: string; title: string; driveFileId: string; driveWebViewLink: string | null }>;
      failed: Array<{ id: string; title: string; error: string; skipped?: boolean }>;
      remaining: number;
    };
  };

  const handleMigrateOrphansAll = async () => {
    setOrphanRunning(true);
    setOrphanCancel(false);
    setOrphanResults([]);
    let totalSucceeded = 0;
    let totalFailed = 0;
    let initialTotal = orphans.count;
    let prevRemaining = Number.POSITIVE_INFINITY;
    try {
      while (true) {
        if (orphanCancel) break;
        const data = await runOrphanBatch(batchSize);
        if (initialTotal === 0) initialTotal = data.processed + data.remaining;
        totalSucceeded += data.succeeded.length;
        totalFailed += data.failed.length;
        setOrphanResults((prev) => [
          ...data.succeeded.map((r) => ({ kind: 'success' as const, ...r })),
          ...data.failed.map((r) => ({ kind: 'error' as const, ...r })),
          ...prev,
        ]);
        setOrphanProgress({
          migrated: totalSucceeded,
          total: initialTotal,
          remaining: data.remaining,
        });
        // Stop conditions:
        // 1. Nothing left in bucket
        // 2. Nothing was processed at all
        // 3. No actually migratable files in this batch (only oversize skips)
        // 4. Remaining didn't decrease (would loop forever on giants)
        const migratable = data.migratable ?? data.succeeded.length;
        if (
          data.remaining === 0 ||
          data.processed === 0 ||
          migratable === 0 ||
          data.remaining >= prevRemaining
        ) break;
        prevRemaining = data.remaining;
        await new Promise((r) => setTimeout(r, 500));
      }
      toast({
        title: 'Orphan migration finished',
        description: `${totalSucceeded} migrated, ${totalFailed} failed/skipped`,
      });
      await refreshOrphans();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Orphan migration stopped', description: msg, variant: 'destructive' });
    } finally {
      setOrphanRunning(false);
      setOrphanCancel(false);
    }
  };

  const handleMigrateOrphansBatch = async () => {
    setOrphanRunning(true);
    try {
      const data = await runOrphanBatch(batchSize);
      setOrphanResults((prev) => [
        ...data.succeeded.map((r) => ({ kind: 'success' as const, ...r })),
        ...data.failed.map((r) => ({ kind: 'error' as const, ...r })),
        ...prev,
      ]);
      setOrphanProgress({
        migrated: data.succeeded.length,
        total: data.processed + data.remaining,
        remaining: data.remaining,
      });
      toast({
        title: 'Batch complete',
        description: `${data.succeeded.length} migrated, ${data.failed.length} failed, ${data.remaining} remaining`,
      });
      await refreshOrphans();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Orphan migration failed', description: msg, variant: 'destructive' });
    } finally {
      setOrphanRunning(false);
    }
  };

  const runOneBatch = async (size: number) => {
    const { data, error } = await supabase.functions.invoke(
      'migrate-clips-to-drive',
      { body: { batchSize: size } },
    );
    if (error) throw error;
    return data as {
      processed: number;
      succeeded: Array<{ id: string; title: string; driveFileId: string; driveWebViewLink: string | null }>;
      failed: Array<{ id: string; title: string; error: string }>;
      remaining: number;
    };
  };

  const handleMigrateBatch = async () => {
    setRunning(true);
    setCancelRequested(false);
    try {
      const data = await runOneBatch(batchSize);
      const newResults: MigrationResult[] = [
        ...data.succeeded.map((r) => ({ kind: 'success' as const, ...r })),
        ...data.failed.map((r) => ({ kind: 'error' as const, ...r })),
      ];
      setResults((prev) => [...newResults, ...prev]);
      setProgress({
        migrated: data.succeeded.length,
        total: data.succeeded.length + data.failed.length + data.remaining,
        remaining: data.remaining,
      });
      toast({
        title: 'Batch complete',
        description: `${data.succeeded.length} migrated, ${data.failed.length} failed, ${data.remaining} remaining`,
      });
      await refreshStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Migration failed', description: msg, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  };

  const handleMigrateAll = async () => {
    setRunning(true);
    setCancelRequested(false);
    setResults([]);
    let totalSucceeded = 0;
    let totalFailed = 0;
    let initialTotal = stats.supabase;
    try {
      while (true) {
        if (cancelRequested) break;
        const data = await runOneBatch(batchSize);
        if (initialTotal === 0) initialTotal = data.succeeded.length + data.failed.length + data.remaining;
        totalSucceeded += data.succeeded.length;
        totalFailed += data.failed.length;
        setResults((prev) => [
          ...data.succeeded.map((r) => ({ kind: 'success' as const, ...r })),
          ...data.failed.map((r) => ({ kind: 'error' as const, ...r })),
          ...prev,
        ]);
        setProgress({
          migrated: totalSucceeded,
          total: initialTotal,
          remaining: data.remaining,
        });
        if (data.remaining === 0 || data.processed === 0) break;
        await new Promise((r) => setTimeout(r, 500));
      }
      toast({
        title: 'Migration finished',
        description: `${totalSucceeded} migrated, ${totalFailed} failed`,
      });
      await refreshStats();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: 'Migration stopped', description: msg, variant: 'destructive' });
    } finally {
      setRunning(false);
      setCancelRequested(false);
    }
  };

  const progressPct =
    progress.total > 0 ? Math.min(100, Math.round((progress.migrated / progress.total) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Drive connection status */}
      <section className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Google Drive Connection</h3>
              <p className="text-xs text-muted-foreground">
                Verifies the Drive connector can list and create folders.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runStatus}
            disabled={statusLoading}
            className="gap-2"
          >
            {statusLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Re-test
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <StatusPill
            label="Auth"
            ok={status?.verifyCredentials?.ok}
            latencyMs={status?.verifyCredentials?.latencyMs}
          />
          <StatusPill label="List" ok={status?.list?.ok} latencyMs={status?.list?.latencyMs} />
          <StatusPill label="Write" ok={status?.write?.ok} latencyMs={status?.write?.latencyMs} />
          {status?.healthy && (
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              Healthy
            </Badge>
          )}
          {typeof status?.totalMs === 'number' && (
            <span className="text-[11px] text-muted-foreground self-center">
              total {status.totalMs}ms
            </span>
          )}
        </div>

        {status?.soleiaFolder && (
          <div className="flex items-center gap-2 text-xs mb-3">
            <span className="text-muted-foreground">Soleia Originals folder:</span>
            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
              {status.soleiaFolder.id}
            </code>
            <a
              href={status.soleiaFolder.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Open <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {status?.errors && status.errors.length > 0 && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs space-y-1 max-h-40 overflow-auto">
            <p className="font-semibold text-destructive">Errors</p>
            {status.errors.map((e, i) => (
              <p key={i} className="font-mono text-[11px] text-destructive/90 break-all">
                {e}
              </p>
            ))}
          </div>
        )}
      </section>

      {/* Orphan files in clips bucket */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold">Orphaned Originals in Supabase</h3>
              <p className="text-xs text-muted-foreground">
                Raw files in the <code className="text-[10px] bg-muted px-1 rounded">clips</code> bucket
                that aren't tracked in the database. Migrate them to Drive to free storage.
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshOrphans} disabled={orphansLoading} className="gap-2">
            {orphansLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Recount
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Orphaned files</p>
            <p className="text-2xl font-semibold text-amber-300">{orphans.count}</p>
          </div>
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Total size</p>
            <p className="text-2xl font-semibold text-amber-300">
              {(orphans.bytes / (1024 * 1024 * 1024)).toFixed(2)} GB
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <Button
            onClick={handleMigrateOrphansBatch}
            disabled={orphanRunning || orphans.count === 0 || !status?.healthy}
            className="gap-2"
          >
            {orphanRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Migrate next batch
          </Button>
          <Button
            variant="secondary"
            onClick={handleMigrateOrphansAll}
            disabled={orphanRunning || orphans.count === 0 || !status?.healthy}
            className="gap-2"
          >
            {orphanRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            Migrate all orphans
          </Button>
          {orphanRunning && (
            <Button variant="destructive" onClick={() => setOrphanCancel(true)} className="gap-2">
              <StopCircle className="h-4 w-4" />
              Stop after current batch
            </Button>
          )}
        </div>

        {orphanProgress.total > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {orphanProgress.migrated} of {orphanProgress.total} migrated
              </span>
              <span className="font-mono">
                {Math.min(100, Math.round((orphanProgress.migrated / orphanProgress.total) * 100))}%
              </span>
            </div>
            <Progress
              value={Math.min(100, Math.round((orphanProgress.migrated / orphanProgress.total) * 100))}
              className="h-2"
            />
            <p className="text-[11px] text-muted-foreground">
              {orphanProgress.remaining} remaining in bucket
            </p>
          </div>
        )}

        {orphanResults.length > 0 && (
          <div className="rounded-lg border border-border/50">
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold">Orphan results</span>
              <Button variant="ghost" size="sm" onClick={() => setOrphanResults([])} className="h-7 text-xs">
                Clear
              </Button>
            </div>
            <ScrollArea className="h-48">
              <div className="divide-y divide-border/50">
                {orphanResults.map((r, i) => {
                  const downloadUrl = r.kind === 'error' && r.skipped ? clipPublicUrl(r.id) : null;
                  return (
                    <div key={`${r.id}-${i}`} className="flex items-start gap-2 px-3 py-2 text-xs">
                      {r.kind === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${r.skipped ? 'text-amber-400' : 'text-destructive'}`} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.title || r.id}</p>
                        {r.kind === 'error' && (
                          <>
                            <p className={`font-mono text-[11px] break-all ${r.skipped ? 'text-amber-400/90' : 'text-destructive/90'}`}>
                              {r.error}
                            </p>
                            {downloadUrl && (
                              <a
                                href={downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 text-[11px] mt-1"
                              >
                                Download from bucket <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </section>

      {/* Migration */}
      <section className="rounded-xl border border-border/50 bg-card p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CloudUpload className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-sm font-semibold">Migrate older clips to Drive</h3>
              <p className="text-xs text-muted-foreground">
                Moves originals from Supabase to Google Drive cold storage. Previews stay in
                Supabase for fast streaming.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStats}
            disabled={statsLoading}
            className="gap-2"
          >
            {statsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-muted/40 p-3">
            <p className="text-[10px] uppercase text-muted-foreground tracking-wide">Total clips</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-lg bg-amber-500/10 p-3">
            <p className="text-[10px] uppercase text-amber-400/80 tracking-wide">On Supabase</p>
            <p className="text-2xl font-semibold text-amber-300">{stats.supabase}</p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-3">
            <p className="text-[10px] uppercase text-emerald-400/80 tracking-wide">On Drive</p>
            <p className="text-2xl font-semibold text-emerald-300">{stats.drive}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="w-28">
            <label className="text-[10px] uppercase text-muted-foreground tracking-wide">
              Batch size
            </label>
            <Input
              type="number"
              min={1}
              max={20}
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              disabled={running}
              className="h-10 text-base"
            />
          </div>
          <Button
            onClick={handleMigrateBatch}
            disabled={running || stats.supabase === 0 || !status?.healthy}
            className="gap-2"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Migrate next batch
          </Button>
          <Button
            variant="secondary"
            onClick={handleMigrateAll}
            disabled={running || stats.supabase === 0 || !status?.healthy}
            className="gap-2"
          >
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}
            Migrate all
          </Button>
          {running && (
            <Button
              variant="destructive"
              onClick={() => setCancelRequested(true)}
              className="gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Stop after current batch
            </Button>
          )}
          {!status?.healthy && (
            <span className="text-xs text-destructive self-center">
              Drive connection unhealthy — fix above before migrating.
            </span>
          )}
        </div>

        {progress.total > 0 && (
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {progress.migrated} of {progress.total} migrated
              </span>
              <span className="font-mono">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground">
              {progress.remaining} remaining on Supabase
            </p>
          </div>
        )}

        {results.length > 0 && (
          <div className="rounded-lg border border-border/50">
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold">Recent results</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResults([])}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
            <ScrollArea className="h-64">
              <div className="divide-y divide-border/50">
                {results.map((r, i) => (
                  <div key={`${r.id}-${i}`} className="flex items-start gap-2 px-3 py-2 text-xs">
                    {r.kind === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{r.title || r.id}</p>
                      {r.kind === 'success' ? (
                        r.driveWebViewLink && (
                          <a
                            href={r.driveWebViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-[11px]"
                          >
                            Open in Drive <ExternalLink className="h-3 w-3" />
                          </a>
                        )
                      ) : (
                        <p className="text-destructive/90 font-mono text-[11px] break-all">
                          {r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </section>
    </div>
  );
}
