import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import showbloxIcon from "@/assets/showblox-icon.png";
import soleiaLogo from "@/assets/soleia-wide-logo.png";
import { Loader2 } from "lucide-react";

interface PreviewTab {
  id: string;
  title: string;
  subtitle: string | null;
  video_url: string | null;
  video_type: string;
}

interface ClientLinkInfo {
  client_name: string;
  event_name: string;
  event_date: string | null;
}

export default function ShowBloxPreview() {
  const { token } = useParams<{ token: string }>();
  const [activeTab, setActiveTab] = useState(0);
  const [tabs, setTabs] = useState<PreviewTab[]>([]);
  const [linkInfo, setLinkInfo] = useState<ClientLinkInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("No preview token provided");
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch client link
        const { data: linkData, error: linkError } = await supabase
          .from("client_links")
          .select("id, client_name, event_name, event_date")
          .eq("token", token)
          .eq("is_active", true)
          .maybeSingle();

        if (linkError) throw linkError;
        if (!linkData) {
          setError("Preview not found or has expired");
          setIsLoading(false);
          return;
        }

        setLinkInfo(linkData);

        // Fetch content previews
        const { data: previews, error: previewError } = await supabase
          .from("content_previews")
          .select("id, title, subtitle, video_url, video_type")
          .eq("link_id", linkData.id)
          .order("sort_order", { ascending: true });

        if (previewError) throw previewError;
        setTabs(previews || []);
      } catch (err: any) {
        console.error("Error loading preview:", err);
        setError(err.message || "Failed to load preview");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (error || !linkInfo) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Preview Not Found</h1>
          <p className="text-white/50 text-sm">{error || "This preview is unavailable."}</p>
        </div>
      </div>
    );
  }

  if (tabs.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col">
        <PreviewHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">No Content Yet</h1>
            <p className="text-white/50 text-sm">
              Previz content for {linkInfo.client_name} is being prepared.
            </p>
          </div>
        </div>
        <PreviewFooter />
      </div>
    );
  }

  const currentTab = tabs[activeTab] || tabs[0];
  const eventDateFormatted = linkInfo.event_date
    ? new Date(linkInfo.event_date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase()
    : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
      <PreviewHeader clientName={linkInfo.client_name} />

      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-10 sm:pt-14 pb-10 max-w-[1000px] mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5 mb-6 text-[13px] tracking-[0.08em] flex-wrap justify-center">
          <span className="text-white font-semibold">{linkInfo.client_name.toUpperCase()}</span>
          <span className="text-white/35">×</span>
          <span className="text-white font-semibold">SOLEIA</span>
          {eventDateFormatted && (
            <>
              <span className="text-white/25">|</span>
              <span className="text-white/55">
                {linkInfo.event_name.toUpperCase()} • {eventDateFormatted}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[clamp(26px,5vw,48px)] font-bold mb-3 text-center text-white tracking-tight">
          {currentTab.title}
        </h1>

        {/* Subtitle */}
        {currentTab.subtitle && (
          <p className="text-xs tracking-[0.18em] text-white/45 mb-8 text-center uppercase">
            {currentTab.subtitle}
          </p>
        )}

        {/* Tab Switcher */}
        {tabs.length > 1 && (
          <div className="flex items-center bg-white/[0.07] rounded-full p-[5px] gap-1 mb-8 flex-wrap justify-center max-w-full overflow-x-auto">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full border-none cursor-pointer text-xs sm:text-sm whitespace-nowrap tracking-[0.01em] transition-all duration-200 ${
                  activeTab === idx
                    ? "font-semibold text-black bg-white"
                    : "font-normal text-white/60 bg-transparent hover:text-white/80"
                }`}
              >
                {tab.title}
              </button>
            ))}
          </div>
        )}

        {/* Video Player */}
        <div className="w-full rounded-2xl overflow-hidden bg-[#111111] shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {currentTab.video_url ? (
            <video
              key={currentTab.id}
              controls
              autoPlay
              loop
              muted
              className="w-full block max-h-[520px] object-contain bg-black"
            >
              <source src={currentTab.video_url} type={currentTab.video_type || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="w-full aspect-video flex items-center justify-center bg-black/50">
              <p className="text-white/30 text-sm tracking-widest">
                VIDEO PREVIEW COMING SOON
              </p>
            </div>
          )}
        </div>
      </main>

      <PreviewFooter />
    </div>
  );
}

function PreviewHeader({ clientName }: { clientName?: string }) {
  return (
    <header className="flex items-center justify-between px-4 sm:px-7 py-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5">
        <img src={showbloxIcon} alt="ShowBlox" className="h-5 w-auto" />
        <span className="text-[13px] font-semibold tracking-[0.12em] text-white hidden sm:inline">
          SHOWBLOX
        </span>
        <span className="text-white/30 text-[13px]">·</span>
        <span className="text-[13px] font-normal tracking-[0.12em] text-white/55">
          CONTENT PREVIZ
        </span>
      </div>

      <div className="flex items-center gap-2">
        {clientName && (
          <div className="bg-white/[0.08] rounded px-2.5 py-1.5 flex items-center justify-center">
            <span className="text-white/70 font-medium text-xs tracking-[0.08em]">
              {clientName.toUpperCase()}
            </span>
          </div>
        )}
        <div className="bg-white/[0.08] rounded px-3 py-1.5 flex items-center justify-center">
          <img src={soleiaLogo} alt="Soleia" className="h-4 w-auto opacity-70" />
        </div>
      </div>
    </header>
  );
}

function PreviewFooter() {
  return (
    <footer className="text-center py-7 text-[11px] tracking-[0.14em] text-white/25">
      POWERED BY SHOWBLOX
    </footer>
  );
}
