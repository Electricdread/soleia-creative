import { useState } from "react";
import showbloxIcon from "@/assets/showblox-icon.png";
import soleiaLogo from "@/assets/soleia-wide-logo.png";

const tabs = [
  {
    label: "SAP 2D Logo - Indoor",
    videoUrl: "", // paste actual mp4 URL here
  },
  {
    label: "SAP 3D Logo - Indoor",
    videoUrl: "",
  },
  {
    label: "SAP 2D Logo - Outdoor",
    videoUrl: "",
  },
  {
    label: "SAP 3D Logo - Outdoor",
    videoUrl: "",
  },
];

export default function ShowBloxPreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col">
      {/* Top Nav */}
      <header className="flex items-center justify-between px-7 py-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <img src={showbloxIcon} alt="ShowBlox" className="h-5 w-auto" />
          <span className="text-[13px] font-semibold tracking-[0.12em] text-white">
            SHOWBLOX
          </span>
          <span className="text-white/30 text-[13px]">·</span>
          <span className="text-[13px] font-normal tracking-[0.12em] text-white/55">
            CONTENT PREVIEW
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* SAP Logo */}
          <div className="bg-[#1a73e8] rounded px-2.5 py-1.5 flex items-center justify-center">
            <span className="text-white font-bold text-base tracking-[0.04em]">
              SAP
            </span>
          </div>
          {/* Soleia Logo */}
          <div className="bg-white/[0.08] rounded px-3 py-1.5 flex items-center justify-center">
            <img src={soleiaLogo} alt="Soleia" className="h-4 w-auto opacity-70" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-6 pt-14 pb-10 max-w-[1000px] mx-auto w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2.5 mb-6 text-[13px] tracking-[0.08em] flex-wrap justify-center">
          <span className="text-white font-semibold">SAP</span>
          <span className="text-white/35">×</span>
          <span className="text-white font-semibold">SOLEIA</span>
          <span className="text-white/25">|</span>
          <span className="text-white/55">
            SAP CELEBRATION NIGHT • 17 MARCH 2026
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[clamp(32px,5vw,52px)] font-bold mb-3.5 text-center text-white tracking-tight">
          {tabs[activeTab].label}
        </h1>

        {/* Subtitle */}
        <p className="text-xs tracking-[0.18em] text-white/45 mb-10 text-center">
          SAP BACKGROUND ANIMATION
        </p>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white/[0.07] rounded-full p-[5px] gap-1 mb-8 flex-wrap justify-center">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-5 py-2.5 rounded-full border-none cursor-pointer text-sm whitespace-nowrap tracking-[0.01em] transition-all duration-200 ${
                activeTab === idx
                  ? "font-semibold text-black bg-white"
                  : "font-normal text-white/60 bg-transparent hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Video Player */}
        <div className="w-full rounded-2xl overflow-hidden bg-[#111111] shadow-[0_8px_40px_rgba(0,0,0,0.6)]">
          {tabs[activeTab].videoUrl ? (
            <video
              key={activeTab}
              controls
              autoPlay
              loop
              muted
              className="w-full block max-h-[520px] object-contain bg-black"
            >
              <source src={tabs[activeTab].videoUrl} type="video/mp4" />
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

      {/* Footer */}
      <footer className="text-center py-7 text-[11px] tracking-[0.14em] text-white/25">
        POWERED BY SHOWBLOX
      </footer>
    </div>
  );
}
