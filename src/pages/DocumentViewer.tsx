import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import solIcon from '@/assets/sol-icon.png';
import servicesPage1 from '@/assets/docs/services-page-1.jpg';
import presentationPage1 from '@/assets/docs/presentation-page-1.jpg';

const DOCS: Record<
  string,
  { title: string; pages: string[]; pdf: string; download: string }
> = {
  services: {
    title: 'Soleia Creative Services',
    pages: [servicesPage1],
    pdf: '/Soleia-Creative-Services-No-Pricing.pdf',
    download: 'Soleia-Creative-Services.pdf',
  },
  presentation: {
    title: 'Soleia Presentation Guide',
    pages: [presentationPage1],
    pdf: '/Soleia-Presentation-Guide.pdf',
    download: 'Soleia-Presentation-Guide.pdf',
  },
};

export default function DocumentViewer() {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const doc = slug ? DOCS[slug] : undefined;

  if (!doc) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 inset-x-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 glass border-b border-primary/15">
        <button
          onClick={() => navigate('/creative-guide/services')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-[0.2em]">Services</span>
        </button>
        <img src={solIcon} alt="Soleia" className="h-9 w-auto object-contain" />
        <a
          href={doc.pdf}
          download={doc.download}
          className="tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2 text-[11px] uppercase tracking-[0.2em] text-primary hover:bg-primary/10 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </header>

      <main className="pt-28 pb-24 px-4 sm:px-8 max-w-4xl mx-auto">
        <h1 className="font-display text-3xl sm:text-4xl text-center mb-8">{doc.title}</h1>
        <div className="space-y-6">
          {doc.pages.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`${doc.title} — page ${i + 1}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              className="w-full h-auto rounded-xl border border-border/60 shadow-sm bg-white"
            />
          ))}
        </div>
      </main>
    </div>
  );
}
