import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { artlistCategories } from '@/lib/api/artlist';
import { FramePicker } from './FramePicker';

interface Clip {
  id: string;
  title: string;
  category: string;
  resolution: string;
  duration: string;
  created_at: string;
  video_url: string | null;
  source_url: string | null;
  thumbnail: string | null;
  sort_order?: number;
}

interface EditForm {
  title: string;
  video_url: string;
  source_url: string;
  thumbnail: string;
  resolution: string;
  duration: string;
  category: string;
}

interface ClipEditModalProps {
  clip: Clip | null;
  editForm: EditForm;
  setEditForm: React.Dispatch<React.SetStateAction<EditForm>>;
  onClose: () => void;
  onSave: () => void;
  onFrameCaptured: (blob: Blob) => void;
  isSaving: boolean;
  isCapturingFrame: boolean;
}

export function ClipEditModal({
  clip,
  editForm,
  setEditForm,
  onClose,
  onSave,
  onFrameCaptured,
  isSaving,
  isCapturingFrame,
}: ClipEditModalProps) {
  return (
    <Dialog open={!!clip} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Edit Clip</DialogTitle>
          <DialogDescription>
            Update clip details or pick a new thumbnail frame.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              value={editForm.title}
              onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-video-url">Video URL</Label>
            <Input
              id="edit-video-url"
              value={editForm.video_url}
              onChange={(e) => setEditForm((prev) => ({ ...prev, video_url: e.target.value }))}
              placeholder="https://..."
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-source-url">Source URL</Label>
            <Input
              id="edit-source-url"
              value={editForm.source_url}
              onChange={(e) => setEditForm((prev) => ({ ...prev, source_url: e.target.value }))}
              placeholder="https://..."
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-thumbnail">Thumbnail URL</Label>
            <Input
              id="edit-thumbnail"
              value={editForm.thumbnail}
              onChange={(e) => setEditForm((prev) => ({ ...prev, thumbnail: e.target.value }))}
              placeholder="https://..."
              className="h-11"
            />
            {editForm.thumbnail && (
              <img
                src={editForm.thumbnail}
                alt="Thumbnail preview"
                className="w-full max-w-[200px] rounded-lg border border-border mt-2"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            )}
          </div>

          {/* Frame Picker */}
          {(editForm.video_url || clip?.video_url) && (
            <div className="pt-4 border-t border-border">
              <FramePicker
                videoUrl={editForm.video_url || clip?.video_url || ''}
                currentThumbnail={editForm.thumbnail}
                onFrameCaptured={onFrameCaptured}
                isCapturing={isCapturingFrame}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-resolution">Resolution</Label>
              <Input
                id="edit-resolution"
                value={editForm.resolution}
                onChange={(e) => setEditForm((prev) => ({ ...prev, resolution: e.target.value }))}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration</Label>
              <Input
                id="edit-duration"
                value={editForm.duration}
                onChange={(e) => setEditForm((prev) => ({ ...prev, duration: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={editForm.category}
              onValueChange={(value) => setEditForm((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {artlistCategories.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="h-11 w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="h-11 w-full sm:w-auto">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
