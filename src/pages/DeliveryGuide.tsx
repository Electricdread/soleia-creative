import React from 'react';
import { 
  Download, 
  ExternalLink, 
  FileVideo, 
  Monitor,
  Tv,
  LayoutGrid,
  Gauge,
  Info,
  Clock,
  HardDrive
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import soleiaLogo from '@/assets/soleia-logo-new.png';

const RESOLUME_ALLEY_URL = 'https://resolume.com/software/alley';

const displaySpecs = [
  {
    id: 'tv',
    name: 'Television Displays',
    icon: Tv,
    resolution: '1920×1080 or 3840×2160',
    format: '.MOV',
    codec: 'DXV3',
    frameRate: '30 fps',
    maxSize: '8 GB',
    notes: 'Use white/light logos on dark backgrounds for optimal visibility.',
  },
  {
    id: 'led',
    name: 'LED Pixel Map',
    icon: LayoutGrid,
    resolution: '3840×2160',
    format: '.MOV (with Alpha)',
    codec: 'DXV3',
    frameRate: '60 fps',
    maxSize: '30 GB',
    notes: 'Avoid highly saturated colors. LED screens are extremely bright.',
  },
  {
    id: 'elevator',
    name: 'Elevator Displays',
    icon: Gauge,
    resolution: '600×800',
    format: '.WMV',
    codec: 'WMV',
    frameRate: '30 fps',
    duration: '30 sec',
    notes: 'Provide separate files for up/down movement + idle state.',
  },
  {
    id: 'ticker',
    name: 'Marquee / Ticker',
    icon: Monitor,
    resolution: '1280×768',
    format: '.MP4',
    codec: 'H.264',
    frameRate: '30 fps',
    duration: '15 sec',
    notes: 'Horizontal scrolling content optimized for readability.',
  },
];

const DeliveryGuide = () => {
  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={soleiaLogo} 
              alt="Soleia" 
              className="h-8 object-contain"
            />
            <div className="h-6 w-px bg-zinc-300" />
            <span className="font-tech text-sm text-zinc-600 uppercase tracking-wide">Content Delivery Specs</span>
          </div>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => window.open(RESOLUME_ALLEY_URL, '_blank')}
            className="gap-2 border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Resolume Alley</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        
        {/* Title Section */}
        <section>
          <h1 className="text-2xl font-tech font-bold text-zinc-900 uppercase tracking-tight">
            Video Delivery Requirements
          </h1>
          <p className="text-zinc-600 mt-2 font-tech text-sm">
            Technical specifications for ready-made content submission. All video content must be encoded in <span className="text-cyan-600 font-semibold">DXV3</span> format for Resolume playback.
          </p>
        </section>

        <Separator className="bg-zinc-200" />

        {/* DXV3 Encoding Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-tech font-semibold text-zinc-900 uppercase">DXV3 Codec</h2>
          </div>
          
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
            <p className="text-sm text-zinc-700 font-tech">
              DXV3 is a GPU-accelerated codec optimized for real-time video playback on Resolume media servers. Standard codecs (H.264, ProRes) are not supported for final delivery.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <a 
                href={RESOLUME_ALLEY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded font-tech text-sm font-medium hover:bg-cyan-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Download Resolume Alley (Free Encoder)
              </a>
            </div>
            
            <div className="pt-2 border-t border-zinc-200 mt-3">
              <p className="text-xs text-zinc-500 font-tech uppercase tracking-wide mb-2">Encoding Workflow</p>
              <ol className="text-sm text-zinc-700 font-tech space-y-1 list-decimal list-inside">
                <li>Export source video as <span className="text-purple-600">ProRes</span> or high-quality <span className="text-purple-600">H.264</span></li>
                <li>Open in Resolume Alley</li>
                <li>Select <span className="text-cyan-600">DXV3</span> codec (use DXV3 Alpha for transparency)</li>
                <li>Export and submit</li>
              </ol>
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-200" />

        {/* Display Specifications Table */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-600" />
            <h2 className="text-lg font-tech font-semibold text-zinc-900 uppercase">Display Specifications</h2>
          </div>
          
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm font-tech border border-zinc-200 rounded-lg overflow-hidden">
              <thead className="bg-zinc-100">
                <tr className="text-left text-zinc-600 uppercase text-xs tracking-wide">
                  <th className="px-4 py-3 border-b border-zinc-200">Display</th>
                  <th className="px-4 py-3 border-b border-zinc-200">Resolution</th>
                  <th className="px-4 py-3 border-b border-zinc-200">Format</th>
                  <th className="px-4 py-3 border-b border-zinc-200">Codec</th>
                  <th className="px-4 py-3 border-b border-zinc-200">Frame Rate</th>
                  <th className="px-4 py-3 border-b border-zinc-200">Max Size</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {displaySpecs.map((spec, index) => (
                  <tr key={spec.id} className={index !== displaySpecs.length - 1 ? 'border-b border-zinc-100' : ''}>
                    <td className="px-4 py-3 font-medium text-zinc-900">{spec.name}</td>
                    <td className="px-4 py-3 text-cyan-600">{spec.resolution}</td>
                    <td className="px-4 py-3 text-zinc-700">{spec.format}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="bg-zinc-100 text-zinc-800 font-tech text-xs">
                        {spec.codec}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">{spec.frameRate}</td>
                    <td className="px-4 py-3 text-zinc-700">{spec.maxSize || spec.duration || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {displaySpecs.map((spec) => (
              <div key={spec.id} className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <spec.icon className="w-4 h-4 text-cyan-600" />
                  <span className="font-tech font-semibold text-zinc-900">{spec.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm font-tech">
                  <div>
                    <span className="text-zinc-500 text-xs uppercase">Resolution</span>
                    <p className="text-cyan-600">{spec.resolution}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs uppercase">Format</span>
                    <p className="text-zinc-700">{spec.format}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs uppercase">Codec</span>
                    <p className="text-zinc-700">{spec.codec}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-xs uppercase">Frame Rate</span>
                    <p className="text-zinc-700">{spec.frameRate}</p>
                  </div>
                </div>
                {spec.notes && (
                  <p className="text-xs text-zinc-500 pt-2 border-t border-zinc-200">{spec.notes}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <Separator className="bg-zinc-200" />

        {/* Submission Requirements */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-tech font-semibold text-zinc-900 uppercase">Submission Deadline</h2>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl font-tech font-bold text-red-600">21</div>
              <div>
                <p className="font-tech font-semibold text-zinc-900">Business Days Before Event</p>
                <p className="text-sm text-zinc-600 font-tech mt-1">
                  All finalized content must be submitted minimum 21 business days prior to event date for testing, review, and preload.
                </p>
              </div>
            </div>
          </div>
        </section>

        <Separator className="bg-zinc-200" />

        {/* Technical Notes */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-tech font-semibold text-zinc-900 uppercase">Technical Notes</h2>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <ul className="text-sm text-zinc-700 font-tech space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span><strong>LED Screens:</strong> Avoid overly bright or highly saturated background colors.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span><strong>Logos:</strong> Use white or light versions against dark backgrounds for visibility.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span><strong>Alpha Channel:</strong> Use DXV3 Alpha codec for transparent overlays.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span><strong>Source Quality:</strong> Export source in ProRes before encoding to DXV3 for best results.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">▸</span>
                <span><strong>Elevator Content:</strong> Provide 3 files: up movement, down movement, and idle state.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* File Delivery */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-tech font-semibold text-zinc-900 uppercase">File Delivery</h2>
          </div>
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <p className="text-sm text-zinc-700 font-tech">
              Submit files via secure file transfer. For large files (30GB+), use services like Dropbox, Google Drive, or WeTransfer. 
              Include display type and resolution in filename (e.g., <span className="text-emerald-700 font-medium">LED_3840x2160_ClientName.mov</span>).
            </p>
          </div>
        </section>

      </main>
      
      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-50 mt-8">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-zinc-500 font-tech uppercase tracking-wide">
            Soleia Las Vegas • Content Delivery Specifications
          </span>
          <a 
            href="https://resolume.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-cyan-600 font-tech hover:underline"
          >
            resolume.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default DeliveryGuide;
