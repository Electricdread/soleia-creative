import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getPublicOrigin } from "@/lib/ogShare";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import {
  Plus,
  Trash2,
  Video,
  Loader2,
  ExternalLink,
  Copy,
  GripVertical,
  Upload,
} from "lucide-react";

interface ContentPreview {
  id: string;
  link_id: string;
  title: string;
  subtitle: string | null;
  video_url: string | null;
  video_type: string;
  sort_order: number;
}

interface ContentPrevizManagerProps {
  linkId: string;
  linkToken: string;
  clientName: string;
  onClose: () => void;
}

export function ContentPrevizManager({
  linkId,
  linkToken,
  clientName,
  onClose,
}: ContentPrevizManagerProps) {
  const { toast } = useToast();
  const [previews, setPreviews] = useState<ContentPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // New item form
  const [newTitle, setNewTitle] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const fetchPreviews = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("content_previews")
      .select("*")
      .eq("link_id", linkId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching previews:", error);
    } else {
      setPreviews(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchPreviews();
  }, [linkId]);

  const addPreview = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for this preview",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    const { data, error } = await supabase
      .from("content_previews")
      .insert({
        link_id: linkId,
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || null,
        video_url: newVideoUrl.trim() || null,
        sort_order: previews.length,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else if (data) {
      setPreviews((prev) => [...prev, data]);
      setNewTitle("");
      setNewSubtitle("");
      setNewVideoUrl("");
      toast({ title: "Preview added" });
    }
    setIsSaving(false);
  };

  const deletePreview = async (id: string) => {
    const { error } = await supabase
      .from("content_previews")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPreviews((prev) => prev.filter((p) => p.id !== id));
      toast({ title: "Preview removed" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const ext = file.name.split(".").pop();
    const filePath = `previz/${linkId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("clip-previews")
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setIsUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("clip-previews").getPublicUrl(filePath);

    setNewVideoUrl(publicUrl);
    const videoType = file.type || "video/mp4";
    toast({ title: "Video uploaded", description: file.name });
    setIsUploading(false);
  };

  const copyPrevizLink = async () => {
    const url = `${getPublicOrigin()}/preview/${linkToken}`;
    await navigator.clipboard.writeText(url);
    toast({ title: "Previz link copied!" });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Video className="w-4 h-4 text-primary" />
            Content Previz — {clientName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyPrevizLink}
              className="gap-1.5 text-xs"
            >
              <Copy className="w-3 h-3" />
              Copy Link
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(`/preview/${linkToken}`, "_blank")
              }
              className="gap-1.5 text-xs"
            >
              <ExternalLink className="w-3 h-3" />
              Preview
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing previews */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : previews.length > 0 ? (
          <div className="space-y-2">
            {previews.map((preview, idx) => (
              <div
                key={preview.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50"
              >
                <GripVertical className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {preview.title}
                  </p>
                  {preview.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {preview.subtitle}
                    </p>
                  )}
                  {preview.video_url ? (
                    <p className="text-xs text-emerald-500 truncate mt-0.5">
                      ✓ Video attached
                    </p>
                  ) : (
                    <p className="text-xs text-amber-500 mt-0.5">
                      No video yet
                    </p>
                  )}
                </div>
                <DeleteConfirmDialog
                  trigger={
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10 flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  }
                  title="Delete preview?"
                  description={`This will permanently remove "${preview.title}" from the previz. This action cannot be undone.`}
                  onConfirm={() => deletePreview(preview.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            No previz content yet. Add videos below.
          </p>
        )}

        {/* Add new preview */}
        <div className="border border-dashed border-border/60 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Add Preview
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title *</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., 2D Logo - Indoor"
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Subtitle</Label>
              <Input
                value={newSubtitle}
                onChange={(e) => setNewSubtitle(e.target.value)}
                placeholder="e.g., Background Animation"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Video URL</Label>
            <div className="flex gap-2">
              <Input
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                placeholder="Paste video URL or upload a file"
                className="h-9 text-sm flex-1"
              />
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1.5 h-9"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload
                  </span>
                </Button>
              </label>
            </div>
          </div>

          <Button
            onClick={addPreview}
            disabled={isSaving || !newTitle.trim()}
            size="sm"
            className="gap-1.5 w-full"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add Preview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
