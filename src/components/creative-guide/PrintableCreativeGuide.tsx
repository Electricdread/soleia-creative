import React, { useRef } from 'react';
import { Download, Printer, FileText, Monitor, Tv, Layers, Building2, Palette, BookOpen, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DISPLAY_TYPES, 
  OUTDOOR_LED_ZONES, 
  INDOOR_LED_ZONES, 
  CUSTOM_CONTENT_INFO,
  ZONE_SUBCATEGORY_LABELS 
} from '@/lib/creativeGuide';

const PRICING_ITEMS = [
  {
    title: 'Logo Animation / Preparation',
    description: 'Animations preparing logos for pixel-mapped LED screens.',
    price: '$2,000–$6,000+',
  },
  {
    title: 'Themed / Branded Content',
    description: 'Custom background animations aligned with event theme and brand colors.',
    price: '$2,000–$6,000+',
  },
  {
    title: 'Elevator Branding',
    description: 'Main logo delivered in three files, prepared for static or vertical motion.',
    price: '$500–$750+',
  },
  {
    title: 'Individual Signage Feeds',
    description: 'Setup of logo, graphic, or video feed in cabanas or bungalows.',
    price: '$99 per feed',
  },
];

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
    <div className="min-h-screen bg-white">
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
              <img 
                src="/assets/showblox-icon.png" 
                alt="ShowBlox" 
                className="h-6"
              />
              <span className="font-medium text-gray-700">ShowBlox</span>
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
              <span className="text-gray-500">Page 2</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">2. Display Specifications</span>
              <span className="text-gray-500">Page 3</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">3. LED Zone Details</span>
              <span className="text-gray-500">Page 5</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">4. Pricing & Timeline</span>
              <span className="text-gray-500">Page 7</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">5. Terms & Conditions</span>
              <span className="text-gray-500">Page 8</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="font-medium">6. Asset Downloads</span>
              <span className="text-gray-500">Page 9</span>
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
              <h3 className="font-semibold text-gray-900 mb-3">ShowBlox × Soleia</h3>
              <p className="text-gray-700 leading-relaxed">
                Immersive entertainment and branded experiences brought to life through cutting-edge technology, 
                thoughtful design, and seamless execution.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">The Platform</h3>
              <p className="text-gray-700 leading-relaxed">
                Together, ShowBlox's modular interactive systems and Soleia's visually iconic environment create 
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

        {/* Section 3: LED Zone Details */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            3. LED Zone Details
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

        {/* Section 4: Pricing & Timeline */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            4. Content Development Pricing
          </h2>

          <div className="space-y-4 mb-8">
            {PRICING_ITEMS.map((item) => (
              <div key={item.title} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                <span className="font-semibold text-amber-600 whitespace-nowrap ml-4">
                  {item.price}
                </span>
              </div>
            ))}
          </div>

          <h3 className="font-semibold text-gray-900 mb-4">Asset Timeline</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            {CUSTOM_CONTENT_INFO.timeline.map((item) => (
              <div key={item.title} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                <p className="text-amber-600 font-semibold text-sm mb-2">
                  {item.days} Business Days Prior
                </p>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-gray-700 italic text-sm">
              "{CUSTOM_CONTENT_INFO.note}"
            </p>
          </div>
        </section>

        {/* Section 5: Terms */}
        <section className="mb-12 print:mb-8 page-break-after">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            5. Terms & Conditions
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

        {/* Section 6: Asset Downloads */}
        <section className="mb-12 print:mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b-2 border-amber-500">
            6. Asset Downloads
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
                showblox-soleia.lovable.app/creative-guide
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
                  showblox-soleia.lovable.app/creative-guide
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-6 mt-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Powered by</span>
            <img 
              src="/assets/showblox-icon.png" 
              alt="ShowBlox" 
              className="h-5"
            />
            <span className="font-medium text-gray-700">ShowBlox</span>
          </div>
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Soleia Las Vegas. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            For questions, contact your ShowBlox representative or visit showblox-soleia.lovable.app
          </p>
        </footer>
      </div>

      {/* Print Styles */}
      <style>{`
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
