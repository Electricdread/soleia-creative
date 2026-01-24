import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddClipForm } from './AddClipForm';
import { ClipManager } from './ClipManager';
import { useAuth } from '@/hooks/useAuth';
import { Settings, Plus, List, Lock } from 'lucide-react';

export function AdminPanel({ onClipsUpdated }: { onClipsUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const { isAdmin, user } = useAuth();

  // Only show admin button to admins
  if (!isAdmin) {
    return null;
  }

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="add" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Clip
            </TabsTrigger>
            <TabsTrigger value="manage" className="gap-2">
              <List className="h-4 w-4" />
              Manage Clips
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="add" className="mt-4">
            <AddClipForm onClipAdded={onClipsUpdated} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-4">
            <ClipManager onClipsUpdated={onClipsUpdated} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
