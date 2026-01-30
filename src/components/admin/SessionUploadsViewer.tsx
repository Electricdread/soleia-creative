import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Download, 
  Image, 
  FileText, 
  FolderOpen, 
  Loader2, 
  X,
  ExternalLink,
  File
} from 'lucide-react';
import { format } from 'date-fns';

interface SessionUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_url: string;
  file_size: number | null;
  created_at: string;
}

interface SessionUploadsViewerProps {
  linkId: string;
  clientName: string;
  onClose: () => void;
}

const FILE_TYPE_CONFIG: Record<string, { icon: typeof Image; label: string; color: string }> = {
  logo: { icon: Image, label: 'Logo', color: 'bg-blue-500/20 text-blue-400' },
  media: { icon: FolderOpen, label: 'Media', color: 'bg-purple-500/20 text-purple-400' },
  document: { icon: FileText, label: 'Document', color: 'bg-amber-500/20 text-amber-400' },
};

export function SessionUploadsViewer({ linkId, clientName, onClose }: SessionUploadsViewerProps) {
  const [uploads, setUploads] = useState<SessionUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUploads();
  }, [linkId]);

  const fetchUploads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('session_uploads')
        .select('*')
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUploads(data || []);
    } catch (error) {
      console.error('Error fetching uploads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    const config = FILE_TYPE_CONFIG[fileType];
    return config ? config.icon : File;
  };

  const downloadFile = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      window.open(url, '_blank');
    }
  };

  const downloadAll = () => {
    uploads.forEach((upload) => {
      downloadFile(upload.file_url, upload.file_name);
    });
  };

  const groupedUploads = uploads.reduce((acc, upload) => {
    const type = upload.file_type || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(upload);
    return acc;
  }, {} as Record<string, SessionUpload[]>);

  return (
    <Card className="border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Client Uploads - {clientName}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {uploads.length} file{uploads.length !== 1 ? 's' : ''} uploaded by client
          </p>
        </div>
        <div className="flex items-center gap-2">
          {uploads.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={downloadAll}
              className="gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download All
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : uploads.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No files uploaded by client yet.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedUploads).map(([type, files]) => {
              const config = FILE_TYPE_CONFIG[type] || { 
                icon: File, 
                label: type.charAt(0).toUpperCase() + type.slice(1), 
                color: 'bg-muted text-muted-foreground' 
              };
              const Icon = config.icon;

              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={config.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {files.length} file{files.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 group hover:bg-secondary/50 transition-colors"
                      >
                        {/* Thumbnail/Icon */}
                        {type === 'logo' || (type === 'media' && upload.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-background flex-shrink-0">
                            <img
                              src={upload.file_url}
                              alt={upload.file_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-background flex items-center justify-center flex-shrink-0">
                            <Icon className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" title={upload.file_name}>
                            {upload.file_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(upload.file_size)} • {format(new Date(upload.created_at), 'MMM d, h:mm a')}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => window.open(upload.file_url, '_blank')}
                            title="Open in new tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => downloadFile(upload.file_url, upload.file_name)}
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
