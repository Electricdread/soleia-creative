import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddClipForm } from './AddClipForm';
import { BulkImportForm } from './BulkImportForm';
import { ClipManager } from './ClipManager';
import { BatchVideoUploader } from './BatchVideoUploader';
import { ClientLinkManager } from './ClientLinkManager';
import { Settings, Plus, List, Upload, Video, Link2 } from 'lucide-react';

export function AdminPanel({ onClipsUpdated }: { onClipsUpdated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
          <DialogDescription>Manage clips and create client session links.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="sessions" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sessions" className="gap-2">
              <Link2 className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Video className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <List className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="sessions" className="mt-4">
            <ClientLinkManager />
          </TabsContent>
          
          <TabsContent value="upload" className="mt-4">
            <BatchVideoUploader onClipAdded={onClipsUpdated} />
          </TabsContent>
          
          <TabsContent value="add" className="mt-4">
            <AddClipForm onClipAdded={onClipsUpdated} />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-4">
            <BulkImportForm onClipsAdded={onClipsUpdated} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-4">
            <ClipManager onClipsUpdated={onClipsUpdated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
