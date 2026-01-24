import { useState, useEffect } from 'react';
import MotionGraphicsLookbook from "@/components/MotionGraphicsLookbook";
import { AdminSetup } from "@/components/auth/AdminSetup";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const checkAdminExists = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_exists');
      if (error) {
        console.error('Error checking admin:', error);
        // If error, assume admin exists to show normal UI
        setNeedsSetup(false);
        return;
      }
      setNeedsSetup(!data);
    } catch (err) {
      console.error('Check failed:', err);
      setNeedsSetup(false);
    }
  };

  useEffect(() => {
    checkAdminExists();
  }, []);

  // Loading state
  if (needsSetup === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show setup if no admin exists
  if (needsSetup) {
    return <AdminSetup onSetupComplete={() => setNeedsSetup(false)} />;
  }

  return <MotionGraphicsLookbook />;
};

export default Index;
