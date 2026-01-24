import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddClipForm } from './AddClipForm';
import { BulkImportForm } from './BulkImportForm';
import { ClipManager } from './ClipManager';
import { Settings, Plus, List, Upload } from 'lucide-react';

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
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Clip Management</DialogTitle>
          <DialogDescription>Add and manage video clips in your collection.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="add" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Clip
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <List className="h-4 w-4" />
              Manage
            </TabsTrigger>
          </TabsList>
          
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
