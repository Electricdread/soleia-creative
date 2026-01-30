import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ClientLinkManager } from '@/components/admin/ClientLinkManager';
import { BatchVideoUploader } from '@/components/admin/BatchVideoUploader';
import { AddClipForm } from '@/components/admin/AddClipForm';
import { BulkImportForm } from '@/components/admin/BulkImportForm';
import { ClipManager } from '@/components/admin/ClipManager';
import { ArrowLeft, Loader2, Link2, Video, Plus, Upload, List } from 'lucide-react';
import showbloxLogo from '@/assets/showblox-full-logo.jpeg';

export default function AdminLooks() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/admin/login');
    }
  }, [user, isLoading, navigate]);

  const handleClipsUpdated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-zinc-700" />
              <img 
                src={showbloxLogo} 
                alt="ShowBlox" 
                className="h-8 w-auto object-contain"
              />
            </div>
            
            <h1 className="text-lg font-semibold text-white">
              Soleia Looks Collection
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl overflow-hidden">
          <Tabs defaultValue="sessions" className="flex flex-col">
            {/* Tabs Header */}
            <div className="border-b border-zinc-800 px-4">
              <ScrollArea className="w-full">
                <TabsList className="inline-flex h-14 w-max gap-1 bg-transparent p-1">
                  <TabsTrigger 
                    value="sessions" 
                    className="gap-2 px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg whitespace-nowrap"
                  >
                    <Link2 className="h-4 w-4" />
                    <span>Client Sessions</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="upload" 
                    className="gap-2 px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg whitespace-nowrap"
                  >
                    <Video className="h-4 w-4" />
                    <span>Upload Videos</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="add" 
                    className="gap-2 px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg whitespace-nowrap"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add URL</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="bulk" 
                    className="gap-2 px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg whitespace-nowrap"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Bulk Import</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="manage" 
                    className="gap-2 px-4 py-2.5 data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400 rounded-lg whitespace-nowrap"
                  >
                    <List className="h-4 w-4" />
                    <span>Manage Clips</span>
                  </TabsTrigger>
                </TabsList>
                <ScrollBar orientation="horizontal" className="h-1.5" />
              </ScrollArea>
            </div>
            
            {/* Tab Content */}
            <div className="p-6">
              <TabsContent value="sessions" className="mt-0 focus-visible:outline-none">
                <ClientLinkManager />
              </TabsContent>
              
              <TabsContent value="upload" className="mt-0 focus-visible:outline-none">
                <BatchVideoUploader onClipAdded={handleClipsUpdated} />
              </TabsContent>
              
              <TabsContent value="add" className="mt-0 focus-visible:outline-none">
                <AddClipForm onClipAdded={handleClipsUpdated} />
              </TabsContent>
              
              <TabsContent value="bulk" className="mt-0 focus-visible:outline-none">
                <BulkImportForm onClipsAdded={handleClipsUpdated} />
              </TabsContent>
              
              <TabsContent value="manage" className="mt-0 focus-visible:outline-none">
                <ClipManager key={refreshKey} onClipsUpdated={handleClipsUpdated} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
