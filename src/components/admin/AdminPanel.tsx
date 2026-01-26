import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
          <span className="hidden sm:inline">Admin</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-3xl h-[90vh] max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 sm:px-6 py-4 border-b border-border/50 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl">Admin Panel</DialogTitle>
          <DialogDescription className="text-sm">Manage clips and create client session links.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="sessions" className="flex-1 flex flex-col min-h-0">
          {/* Mobile-optimized horizontal scrolling tabs */}
          <div className="border-b border-border/50 px-2 sm:px-4 flex-shrink-0">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex h-12 w-max gap-1 bg-transparent p-1">
                <TabsTrigger 
                  value="sessions" 
                  className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 data-[state=active]:bg-primary/10 rounded-lg whitespace-nowrap"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Sessions</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="upload" 
                  className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 data-[state=active]:bg-primary/10 rounded-lg whitespace-nowrap"
                >
                  <Video className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Upload</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="add" 
                  className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 data-[state=active]:bg-primary/10 rounded-lg whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">URL</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="bulk" 
                  className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 data-[state=active]:bg-primary/10 rounded-lg whitespace-nowrap"
                >
                  <Upload className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Bulk</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="manage" 
                  className="gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 data-[state=active]:bg-primary/10 rounded-lg whitespace-nowrap"
                >
                  <List className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">Manage</span>
                </TabsTrigger>
              </TabsList>
              <ScrollBar orientation="horizontal" className="h-1.5" />
            </ScrollArea>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <TabsContent value="sessions" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <ClientLinkManager />
            </TabsContent>
            
            <TabsContent value="upload" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <BatchVideoUploader onClipAdded={onClipsUpdated} />
            </TabsContent>
            
            <TabsContent value="add" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <AddClipForm onClipAdded={onClipsUpdated} />
            </TabsContent>
            
            <TabsContent value="bulk" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <BulkImportForm onClipsAdded={onClipsUpdated} />
            </TabsContent>
            
            <TabsContent value="manage" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <ClipManager onClipsUpdated={onClipsUpdated} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
