import { useParams } from 'react-router-dom';
import { useSharedSession } from '@/hooks/useSharedSession';
import SharedGalleryView from '@/components/SharedGalleryView';
import { Loader2, AlertCircle } from 'lucide-react';
import soleiaLogo from '@/assets/soleia-logo-new.png';

const SharedSession = () => {
  const { token } = useParams<{ token: string }>();
  const { 
    clientLink, 
    sessionClips, 
    selections, 
    uploads,
    isLoading, 
    error, 
    toggleSelection, 
    updateNote, 
    updatePlacements, 
    isSelected, 
    getSelection,
    refetchUploads 
  } = useSharedSession(token);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <img 
          src={soleiaLogo} 
          alt="Soleia" 
          className="h-24 object-contain mb-8 opacity-50"
        />
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your session...</p>
      </div>
    );
  }

  if (error || !clientLink) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <img 
          src={soleiaLogo} 
          alt="Soleia" 
          className="h-24 object-contain mb-8 opacity-50"
        />
        <div className="glass rounded-2xl p-8 max-w-md text-center border border-destructive/20">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Session Not Found</h1>
          <p className="text-muted-foreground">
            {error || 'This session link may have expired or is no longer active. Please contact your event coordinator for a new link.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <SharedGalleryView
      clientLink={clientLink}
      sessionClips={sessionClips}
      selections={selections}
      uploads={uploads}
      toggleSelection={toggleSelection}
      updateNote={updateNote}
      updatePlacements={updatePlacements}
      isSelected={isSelected}
      getSelection={getSelection}
      onUploadComplete={refetchUploads}
    />
  );
};

export default SharedSession;
