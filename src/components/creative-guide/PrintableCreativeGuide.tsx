import React, { useRef } from 'react';
import { Download, Printer, FileText, Monitor, Tv, Layers, Building2, Palette, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DISPLAY_TYPES, 
  OUTDOOR_LED_ZONES, 
  INDOOR_LED_ZONES, 
  ZONE_SUBCATEGORY_LABELS 
} from '@/lib/creativeGuide';

const TERMS = [
  'Any new components outside this scope will require a separate estimate',
  'Assets must be delivered by the stated deadline',
  'Late approvals or deliveries may incur rush fees',
  'Revisions must be submitted in writing before work resumes',
  'Fonts, stock images, and icons are not included and will be billed to the client',
  'Upon final payment, the client owns rights to rendered design files (source files excluded)',
  'Event footage may be captured for promotional use unless otherwise requested in writing',
  'In the event of cancellation after work has begun, the client is responsible for payment proportional to work completed',
];

const categoryIcons: Record<string, React.ReactNode> = {
  'tv': <Tv className="w-4 h-4" />,
  'elevator': <Layers className="w-4 h-4" />,
  'led': <Monitor className="w-4 h-4" />,
  'ticker': <FileText className="w-4 h-4" />,
};

interface PrintableCreativeGuideProps {
  onClose?: () => void;
}

export function PrintableCreativeGuide({ onClose }: PrintableCreativeGuideProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    // Use browser print to PDF functionality
    window.print();
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 [color-scheme:light]" data-theme="light">
      {/* Sticky Header - Hidden in print */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 p-4 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">Creative Guide - Print Version</h1>
          <div className="flex items-center gap-3">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print / Save as PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Printable Content */}
      <div ref={printRef} className="max-w-4xl mx-auto p-8 print:p-6 print:max-w-none">
        
        {/* Cover Page */}
        <div className="text-center mb-12 print:mb-8 page-break-after">
          <img 
            src="/soleia-logo-black.png" 
            alt="Soleia Las Vegas" 
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl font-light text-gray-900 mb-2">Creative Guide</h1>
          <p className="text-lg text-gray-600 mb-8">Digital Branding Specifications</p>
          
          <div className="border-t border-b border-gray-200 py-6 my-8">
            <p className="text-sm text-gray-500 uppercase tracking-wider mb-2">Prepared by</p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-medium text-gray-700">Soleia Creative Team</span>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            Generated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Table of Contents */}
        <div className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            Table of Contents
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">1. Introduction & Partnership</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">2. Display Specifications</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">3. Screen Specifications by Zone</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">4. LED Zone Details</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">5. Content Delivery Requirements</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">6. Terms & Conditions</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">7. Asset Downloads</span>
            </div>
          </div>
        </div>

        {/* Section 1: Introduction */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            1. Introduction & Partnership
          </h2>
          
          <div className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Soleia Creative Team</h3>
              <p className="text-gray-700 leading-relaxed">
                Immersive entertainment and branded experiences brought to life through cutting-edge technology, 
                thoughtful design, and seamless execution.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">The Platform</h3>
              <p className="text-gray-700 leading-relaxed">
                Soleia's modular interactive systems and visually iconic environment create 
                a platform where brands don't just appear—they are <strong>experienced</strong>. From interactive 
                photo and video activations to custom gaming, LED branding, and real-time content, every touchpoint 
                is designed to engage guests, amplify social sharing, and elevate the overall event atmosphere.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Our Approach</h3>
              <p className="text-gray-700 leading-relaxed">
                Our approach blends creativity with reliability. Each activation is custom-tailored to align with 
                your brand goals, audience, and event flow, while remaining scalable, efficient, and production-ready. 
                Whether the objective is awareness, engagement, or memorability, we focus on experiences that feel 
                intentional, immersive, and effortless for guests.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Display Specifications */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            2. Display Specifications
          </h2>

          <div className="space-y-8">
            {DISPLAY_TYPES.map((display) => (
              <div key={display.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
                  {categoryIcons[display.category]}
                  <h3 className="font-semibold text-gray-900">{display.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4">{display.description}</p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Video Specs */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Video Specs</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5 text-gray-500">Resolution</td>
                            <td className="py-1.5 font-mono text-right">{display.videoSpecs.resolution}</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5 text-gray-500">Format</td>
                            <td className="py-1.5 font-mono text-right">{display.videoSpecs.format}</td>
                          </tr>
                          {display.videoSpecs.codec && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5 text-gray-500">Codec</td>
                              <td className="py-1.5 font-mono text-right">{display.videoSpecs.codec}</td>
                            </tr>
                          )}
                          {display.videoSpecs.frameRate && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5 text-gray-500">Frame Rate</td>
                              <td className="py-1.5 font-mono text-right">{display.videoSpecs.frameRate}</td>
                            </tr>
                          )}
                          {display.videoSpecs.duration && (
                            <tr className="border-b border-gray-100">
                              <td className="py-1.5 text-gray-500">Duration</td>
                              <td className="py-1.5 font-mono text-right">{display.videoSpecs.duration}</td>
                            </tr>
                          )}
                          {display.videoSpecs.fileSize && (
                            <tr>
                              <td className="py-1.5 text-gray-500">Max Size</td>
                              <td className="py-1.5 font-mono text-right">{display.videoSpecs.fileSize}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Graphic Specs */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Graphic Specs</h4>
                      <table className="w-full text-sm">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-1.5 text-gray-500">Resolution</td>
                            <td className="py-1.5 font-mono text-right">{display.graphicSpecs.resolution}</td>
                          </tr>
                          <tr>
                            <td className="py-1.5 text-gray-500">Format</td>
                            <td className="py-1.5 font-mono text-right">{display.graphicSpecs.format}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deliverables */}
                  {display.deliverables && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Deliverables</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {display.deliverables.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Creative Notes */}
                  {display.creativeNotes && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Creative Notes</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {display.creativeNotes.map((note, idx) => (
                          <li key={idx}>• {note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Dimensions */}
                  {display.dimensions && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Screen Dimensions</h4>
                      <div className="flex flex-wrap gap-2">
                        {display.dimensions.map((dim, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                            {dim.label}: {dim.width}×{dim.height}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Screen Specifications by Zone */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            3. Screen Specifications by Zone
          </h2>

          <div className="grid grid-cols-3 gap-3">
            {/* Indoor Screens */}
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="bg-amber-600 text-white text-center py-1.5 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Indoor Screens</span>
              </div>
              <div className="bg-gray-100 flex justify-between px-2 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <span>Screen</span><span>Resolution</span>
              </div>
              {[
                { name: 'SR IMAG', res: '1216 × 592' },
                { name: 'SL IMAG', res: '1216 × 592' },
                { name: 'CENTER', res: '640 × 272' },
                { name: 'DJ BOOTH', res: '1260 × 168' },
                { name: 'SR CURVE', res: '2304 × 272' },
                { name: 'SL CURVE', res: '2304 × 272' },
              ].map((s, i) => (
                <div key={s.name} className={`flex justify-between px-2 py-1 text-[10px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className="text-gray-800">{s.name}</span>
                  <span className="font-mono text-gray-600">{s.res}</span>
                </div>
              ))}
            </div>

            {/* Outdoor Screens */}
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="bg-amber-600 text-white text-center py-1.5 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Outdoor Screens</span>
              </div>
              <div className="bg-gray-100 flex justify-between px-2 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <span>Screen</span><span>Resolution</span>
              </div>
              {[
                { name: 'OUTDOOR SR', res: '588 × 840' },
                { name: 'OUTDOOR SL', res: '588 × 840' },
                { name: 'OUTDOOR ARCH', res: '1512 × 504' },
              ].map((s, i) => (
                <div key={s.name} className={`flex justify-between px-2 py-1 text-[10px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className="text-gray-800">{s.name}</span>
                  <span className="font-mono text-gray-600">{s.res}</span>
                </div>
              ))}
            </div>

            {/* Sunray Elements */}
            <div className="border border-gray-300 rounded overflow-hidden">
              <div className="bg-amber-600 text-white text-center py-1.5 px-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Sunray Elements</span>
              </div>
              <div className="bg-gray-100 flex justify-between px-2 py-1 text-[9px] font-bold text-gray-500 uppercase tracking-wide border-b border-gray-200">
                <span>Screen</span><span>Resolution</span>
              </div>
              {[
                { name: 'SUNRAY #1', res: '1920 × 128' },
                { name: 'SUNRAY #2', res: '1536 × 128' },
                { name: 'SUNRAY #3', res: '1792 × 128' },
                { name: 'SUNRAY #4', res: '1792 × 128' },
                { name: 'SUNRAY #5', res: '1792 × 128' },
                { name: 'SUNRAY #6', res: '1536 × 128' },
              ].map((s, i) => (
                <div key={s.name} className={`flex justify-between px-2 py-1 text-[10px] ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <span className="text-gray-800">{s.name}</span>
                  <span className="font-mono text-gray-600">{s.res}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-2 italic">
            All LED content delivered as DXV3 codec via Resolume media servers • 60 fps • Alpha channel required for overlays
          </p>
        </section>

        {/* Section 4: LED Zone Details */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            4. LED Zone Details
          </h2>

          {/* Outdoor Zones */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-600" />
              Outdoor LED Zones (Arrival / Street-Facing)
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              High-visibility exterior LED screens designed for long viewing distances, high brightness, and immediate legibility.
            </p>
            <div className="space-y-4">
              {OUTDOOR_LED_ZONES.map((zone) => (
                <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{zone.name}</h4>
                    {zone.resolution && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-mono">
                        {zone.resolution}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{zone.description}</p>
                  <div>
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Use Cases:</span>
                    <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                      {zone.useCases.map((useCase, idx) => (
                        <li key={idx}>• {useCase}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indoor Zones by Subcategory */}
          {['booth', 'curves', 'vertical-transitional', 'main-feature'].map((subcategory) => {
            const zones = INDOOR_LED_ZONES.filter(z => z.subcategory === subcategory);
            if (zones.length === 0) return null;

            return (
              <div key={subcategory} className="mb-8">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-amber-600" />
                  {ZONE_SUBCATEGORY_LABELS[subcategory] || subcategory}
                </h3>
                <div className="space-y-4">
                  {zones.map((zone) => (
                    <div key={zone.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{zone.name}</h4>
                        {zone.resolution && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-mono">
                            {zone.resolution}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{zone.description}</p>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Use Cases:</span>
                        <ul className="text-sm text-gray-600 mt-1 space-y-0.5">
                          {zone.useCases.map((useCase, idx) => (
                            <li key={idx}>• {useCase}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Section 5: Content Delivery Requirements */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            5. Content Delivery Requirements
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Submission Deadline</h4>
              <p className="text-2xl font-bold text-amber-600 mb-1">21 Business Days</p>
              <p className="text-sm text-gray-600">Submit content at least 21 business days before your event for testing and approval.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2 text-sm uppercase tracking-wide">Required Codec</h4>
              <p className="text-2xl font-bold text-amber-600 mb-1">DXV3</p>
              <p className="text-sm text-gray-600">Download the free Resolume Alley encoder at resolume.com/software/alley</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {[
              { tip: 'Export in ProRes first', desc: 'Best quality before encoding to DXV3.' },
              { tip: 'Avoid bright backgrounds', desc: 'LED screens are very bright—use darker tones.' },
              { tip: 'Use light logos', desc: 'White or light logo versions display best on screens.' },
              { tip: 'Include alpha channel', desc: 'Use DXV3 Alpha for transparent overlays on LED.' },
            ].map((t) => (
              <div key={t.tip} className="flex items-start gap-2 py-2">
                <span className="text-amber-500 font-bold">✓</span>
                <div>
                  <span className="font-medium text-gray-900 text-sm">{t.tip}</span>
                  <span className="text-gray-500 text-sm"> — {t.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Terms */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            6. Terms & Conditions
          </h2>

          <ul className="space-y-3">
            {TERMS.map((term, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <span className="text-amber-600 font-bold">{index + 1}.</span>
                <span>{term}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 7: Asset Downloads */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            7. Asset Downloads
          </h2>

          <p className="text-gray-600 mb-6">
            Download the following assets to begin creating content for Soleia's LED ecosystem.
          </p>

          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Download className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">After Effects Template + Pixelmap Specs</h4>
                  <p className="text-sm text-gray-600">Complete template package for content creation</p>
                </div>
              </div>
              <div className="text-right print:hidden">
                <a 
                  href="/creative-guide/After_Effects_Template.zip" 
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </a>
              </div>
              <div className="hidden print:block text-sm text-gray-500">
                <ExternalLink className="w-4 h-4 inline mr-1" />
                soleia-creative.lovable.app/creative-guide
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Venue Blueprint (PDF)</h4>
                  <p className="text-sm text-gray-600">Detailed floor plan with screen locations</p>
                </div>
              </div>
              <div className="text-right print:hidden">
                <Button variant="outline" className="gap-2" asChild>
                  <a href="/creative-guide/venue-blueprint.png" download>
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </Button>
              </div>
              <div className="hidden print:block text-sm text-gray-500">
                <ExternalLink className="w-4 h-4 inline mr-1" />
                Available online
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Palette className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Interactive Creative Guide</h4>
                  <p className="text-sm text-gray-600">Full interactive version with 3D visualization</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <ExternalLink className="w-4 h-4" />
                  soleia-creative.lovable.app/creative-guide
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="font-medium text-gray-700">Soleia Creative Team</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Soleia Las Vegas. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            For questions, contact your Soleia Creative Team representative or visit soleia-creative.lovable.app
          </p>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
        /* Force light mode for print guide */
        [data-theme="light"],
        [data-theme="light"] * {
          color-scheme: light !important;
        }
        
        [data-theme="light"] {
          --background: 0 0% 100%;
          --foreground: 0 0% 9%;
        }
        
        /* Override any inherited dark mode text colors */
        [data-theme="light"] h1,
        [data-theme="light"] h2,
        [data-theme="light"] h3,
        [data-theme="light"] h4,
        [data-theme="light"] h5,
        [data-theme="light"] h6,
        [data-theme="light"] p,
        [data-theme="light"] span,
        [data-theme="light"] li,
        [data-theme="light"] td {
          color: inherit;
        }
        
        @media print {
          @page {
            margin: 0.5in;
            size: letter;
          }
          
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .page-break-after {
            page-break-after: always;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:block {
            display: block !important;
          }
          
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          
          .print\\:p-6 {
            padding: 1.5rem !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}

export default PrintableCreativeGuide;
