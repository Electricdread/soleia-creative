import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, File, Image, FileText, X, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionUpload {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  created_at: string;
}

interface SessionFileUploaderProps {
  linkId: string;
  uploads: SessionUpload[];
  onUploadComplete: () => void;
}

const FILE_CATEGORIES = [
  { id: 'logo', label: 'Company Logo', accept: 'image/*', icon: Image },
  { id: 'media', label: 'Media Files', accept: 'image/*,video/*', icon: FolderOpen },
  { id: 'document', label: 'Documents', accept: '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx', icon: FileText },
];

export default function SessionFileUploader({ linkId, uploads, onUploadComplete }: SessionFileUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return FolderOpen;
    return FileText;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const uploadFile = async (file: File, category: string) => {
    const fileName = `${linkId}/${category}/${Date.now()}-${file.name}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('session-uploads')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('session-uploads')
      .getPublicUrl(fileName);

    const { error: dbError } = await supabase
      .from('session_uploads')
      .insert({
        link_id: linkId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: category,
        file_size: file.size,
      });

    if (dbError) throw dbError;

    // Send email notification
    try {
      await supabase.functions.invoke('notify-upload', {
        body: {
          linkId,
          fileName: file.name,
          fileType: category,
          fileSize: file.size,
        },
      });
    } catch (notifyError) {
      console.error('Failed to send upload notification:', notifyError);
      // Don't throw - notification failure shouldn't block upload
    }
  };

  const handleFileSelect = useCallback(async (files: FileList | null, category: string) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file, category);
      }
      toast({
        title: 'Upload Complete',
        description: `${files.length} file(s) uploaded successfully`,
      });
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  }, [linkId, onUploadComplete, toast]);

  const handleDelete = async (uploadId: string, fileUrl: string) => {
    try {
      // Extract path from URL
      const urlParts = fileUrl.split('/session-uploads/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage.from('session-uploads').remove([filePath]);
      }

      const { error } = await supabase
        .from('session_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      toast({
        title: 'File Deleted',
        description: 'File removed successfully',
      });
      onUploadComplete();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, category: string) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files, category);
  }, [handleFileSelect]);

  return (
    <Card className="border-dashed border-2 border-primary/20 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          Upload Your Assets
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Share your company logo, brand media, and documents so we can create your custom visual clips.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zones */}
        <div className="grid gap-3 sm:grid-cols-3">
          {FILE_CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <label
                key={category.id}
                className={cn(
                  "flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all",
                  "hover:border-primary hover:bg-primary/5",
                  dragOver ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                )}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => handleDrop(e, category.id)}
              >
                <input
                  type="file"
                  className="hidden"
                  accept={category.accept}
                  multiple
                  onChange={(e) => handleFileSelect(e.target.files, category.id)}
                  disabled={isUploading}
                />
                <Icon className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">{category.label}</span>
                <span className="text-xs text-muted-foreground mt-1">
                  Tap to upload
                </span>
              </label>
            );
          })}
        </div>

        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Uploading...</span>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploads.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files ({uploads.length})</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {uploads.map((upload) => {
                const FileIcon = getFileIcon(upload.file_type);
                const isImage = upload.file_type.startsWith('image/');
                
                return (
                  <div
                    key={upload.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border"
                  >
                    {isImage ? (
                      <img
                        src={upload.file_url}
                        alt={upload.file_name}
                        className="h-10 w-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{upload.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(upload.file_size)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={() => handleDelete(upload.id, upload.file_url)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
