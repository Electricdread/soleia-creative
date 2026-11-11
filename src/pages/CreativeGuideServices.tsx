import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ChevronDown, Download, Play } from 'lucide-react';
import { CreativeGuideHeader } from '@/components/creative-guide/CreativeGuideHeader';
import { CreativeGuideFooter } from '@/components/creative-guide/CreativeGuideFooter';
import { GuideSectionNav } from '@/components/creative-guide/GuideSectionNav';
import { SpecificZoneSelector } from '@/components/creative-guide/SpecificZoneSelector';
import { Overlay } from '@/components/motion/Crossfade';
import { supabase } from '@/integrations/supabase/client';
import transparentLogoVideo from '@/assets/transparent_logo_explainer_1.mp4.asset.json';

const GUIDE_PATH = '/creative-guide';
const GUIDE_URL = GUIDE_PATH + '/services';
const SERVICES_PDF_URL = '/Soleia-Creative-Services-No-Pricing.pdf?v=2026-08-14c';
const PREVIEW_VIDEO = '/creative-guide/services/previz-soleia.mp4';

const SECTIONS = [
  { id: 'included', label: 'What’s Included' },
  { id: 'enhance', label: 'Upgrades' },
  { id: 'production', label: 'Deadlines' },
  { id: 'own-content', label: 'File Specs' },
];

const ADD_ON_GROUPS = ['LED branding', 'Arrival and VIP displays', 'Presentations and previews', 'Other services'] as const;
type AddOnGroup = (typeof ADD_ON_GROUPS)[number];

type AddOn = {
  title: string;
  description: string;
  group: AddOnGroup;
  video?: string;
  link?: { label: string; to: string };
};

const ADD_ON_COPY: Record<string, AddOn> = {
  'Static Logo': {
    title: 'Additional static logo',
    description: 'Add a sponsor or partner logo to the LED screens. Send a transparent PNG.',
    group: 'LED branding',
    video: '/creative-guide/services/static-logo-loop.mp4',
  },
  'Transparent Logo Animation': {
    title: 'Animated logo',
    description: 'We animate your logo so it can play over the venue visuals with a transparent background.',
    group: 'LED branding',
    video: transparentLogoVideo.url,
  },
  'LED Screens Specific Zone Mapping': {
    title: 'Brand a specific LED zone',
    description: 'Run custom content on the main stage, outdoor screens, or beachclub arch.',
    group: 'LED branding',
    link: { label: 'Preview LED zones', to: GUIDE_URL + '#zones' },
  },
  'Performing Artist — Mapped by Soleia Creative Team': {
    title: 'Artist and DJ visuals',
    description: 'Coordinate stage graphics, transitions, and cues with the artist’s team.',
    group: 'LED branding',
  },
  'Elevator Dynamic Animation': {
    title: 'Animated elevator display',
    description: 'We design a custom portrait animation for guest arrival.',
    group: 'Arrival and VIP displays',
  },
  'Elevator Static Logo': {
    title: 'Static elevator logo',
    description: 'We size and test your logo for the elevator display. Included with the Creative Upgrade Package.',
    group: 'Arrival and VIP displays',
  },
  'Elevator Created by Client': {
    title: 'Client-supplied elevator content',
    description: 'You supply the finished portrait file. We test and load it.',
    group: 'Arrival and VIP displays',
  },
  'Individual Cabana / Bungalow Logo': {
    title: 'Dedicated cabana or bungalow TV',
    description: 'Give a selected TV its own logo or video feed.',
    group: 'Arrival and VIP displays',
  },
  '3D Previz': {
    title: '3D venue preview',
    description: 'Review your visuals on a model of the venue before event day. Included with the Creative Upgrade Package.',
    group: 'Presentations and previews',
    video: PREVIEW_VIDEO,
  },
  Presentation: {
    title: 'Presentation support',
    description: 'Onsite setup, screen routing, and playback support for decks, keynotes, and reels.',
    group: 'Presentations and previews',
    link: { label: 'View presentation guide', to: GUIDE_PATH + '/doc/presentation' },
  },
};

const MARQUEE: AddOn = {
  title: 'Exterior LED marquee',
  description: 'Request a static graphic or short animation for the street-facing sign during your event.',
  group: 'Arrival and VIP displays',
  link: { label: 'View marquee specs', to: GUIDE_PATH + '/ticker' },
};

const MAPPING_SERVICES = ['Mapped by Soleia Creative Team', 'Mapped to Spec by Client'];

const SPEC_LINKS = [
  { label: 'Video mapping preview', to: GUIDE_PATH + '/video-mapping' },
  { label: 'TV network specs', to: GUIDE_PATH + '/tv' },
  { label: 'Elevator display specs', to: GUIDE_PATH + '/elevator' },
  { label: 'LED marquee specs', to: GUIDE_PATH + '/ticker' },
  { label: 'Presentation guide', to: GUIDE_PATH + '/doc/presentation' },
];

const sectionClass = 'scroll-mt-36 border-t border-primary/20 pt-8 sm:pt-10';
const headingClass = 'mb-5 font-display text-3xl leading-tight sm:text-4xl';
const cardClass = 'rounded-2xl border border-primary/20 bg-card/60 p-5 sm:p-7';
const bodyClass = 'text-sm leading-relaxed text-muted-foreground sm:text-base';
const actionClass = 'tap-44 inline-flex items-center gap-2 rounded-full border border-primary/40 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const textLinkClass = 'tap-44 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline';
const disclosureClass = 'group scroll-mt-36 rounded-2xl border border-primary/20 bg-card/50';
const summaryClass = 'flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-3 text-sm font-medium text-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden';

export default function CreativeGuideServices() {
  const { hash } = useLocation();
  const [catalog, setCatalog] = useState<{ addOns: AddOn[]; unavailable: boolean } | null>(null);
  const [zonesOpen, setZonesOpen] = useState(hash === '#zones');
  const [video, setVideo] = useState<string | null>(null);
  const closeVideo = useCallback(() => setVideo(null), []);

  useEffect(() => {
    let cancelled = false;

    const loadAddOns = async () => {
      const { data, error } = await supabase.rpc('get_rate_card_addons');
      if (cancelled) return;

      const addOns = (data ?? [])
        .filter((item) => !MAPPING_SERVICES.includes(item.title) && item.title !== 'LED Marquee')
        .map((item): AddOn => ADD_ON_COPY[item.title] ?? {
          title: item.title,
          description: item.long_description ?? 'Ask Soleia Creative for details.',
          group: 'Other services',
        });

      setCatalog({ addOns: [...addOns, MARQUEE], unavailable: Boolean(error) });
    };

    void loadAddOns();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (hash === '#zones') setZonesOpen(true);
  }, [hash]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <CreativeGuideHeader />

      <section id="welcome" aria-labelledby="guide-title" className="relative flex min-h-[390px] items-end overflow-hidden sm:min-h-[440px]">
        <img
          src="/creative-guide/venue-layout-sunburst.jpg"
          alt=""
          fetchPriority="high"
          className="media-grade absolute inset-0 h-full w-full object-cover object-[62%_50%]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background via-background/65 to-black/25" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-9 pt-28 sm:px-8 sm:pb-11">
          <h1 id="guide-title" className="font-display text-4xl leading-tight sm:text-6xl">Soleia Creative Guide</h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground/85 sm:text-lg">
            Plan the branding and visuals for your event at Soleia Las Vegas.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <a href="#included" className={actionClass}>See what’s included <ArrowRight aria-hidden="true" className="h-4 w-4" /></a>
            <a href={SERVICES_PDF_URL} download="Soleia-Creative-Services.pdf" className={textLinkClass}>
              <Download aria-hidden="true" className="h-4 w-4" /> Services PDF
            </a>
          </div>
        </div>
      </section>

      <GuideSectionNav sections={SECTIONS} />

      <main className="mx-auto max-w-5xl space-y-12 px-5 pb-16 pt-7 sm:space-y-16 sm:px-8 sm:pb-20">
        <section id="included" className={sectionClass}>
          <h2 className={headingClass}>What’s included with your buyout</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <article className={cardClass}>
              <h3 className="font-display text-2xl">Main LED screens</h3>
              <p className={'mt-2 ' + bodyClass}>
                <strong className="font-medium text-foreground">10 static logos across 5 screens.</strong> Your logos appear on two nightclub screens, two outdoor screens, and the beachclub arch. The other LEDs play Soleia’s in-house visuals.
              </p>
            </article>
            <article className={cardClass}>
              <h3 className="font-display text-2xl">TV network</h3>
              <p className={'mt-2 ' + bodyClass}>
                <strong className="font-medium text-foreground">One static logo across 28 TVs.</strong> The casino-level entrance, bungalows, and cabanas share the same feed.
              </p>
            </article>
          </div>

          <div id="venue" className="mt-4 space-y-3 scroll-mt-36">
            <details className={disclosureClass}>
              <summary className={summaryClass}>View venue layout <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
              <img
                src="/creative-guide/venue-layout-sunburst.jpg"
                alt="Aerial view of the nightclub, beachclub pools, and cabana rows"
                loading="lazy"
                className="aspect-[1737/905] w-full rounded-b-2xl object-cover"
              />
            </details>
            <details id="zones" className={disclosureClass} open={zonesOpen} onToggle={(event) => setZonesOpen(event.currentTarget.open)}>
              <summary className={summaryClass}>Preview LED zones <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
              {zonesOpen && (
                <div className="px-3 pb-3">
                  <SpecificZoneSelector
                    description="See the screens in each zone."
                    onFullscreen={setVideo}
                  />
                </div>
              )}
            </details>
          </div>
        </section>

        <section id="enhance" className={sectionClass}>
          <h2 className={headingClass}>Creative upgrades</h2>
          <article className={cardClass}>
            <h3 className="font-display text-2xl">Soleia Creative Upgrade Package</h3>
            <p className={'mt-2 ' + bodyClass}>We design, produce, and run custom visuals for your event.</p>
            <ul className="mt-4 grid list-disc gap-x-8 gap-y-2 pl-5 text-sm leading-relaxed marker:text-primary sm:grid-cols-2">
              <li>Creative direction and custom animation</li>
              <li>Content fitted to each LED screen</li>
              <li>Static elevator logo</li>
              <li>3D venue preview for approval</li>
              <li>Onsite testing and playback</li>
            </ul>
            <button type="button" onClick={() => setVideo(PREVIEW_VIDEO)} className={'mt-4 ' + actionClass}>
              <Play aria-hidden="true" className="h-4 w-4" /> Watch a 3D venue preview
            </button>
          </article>

          <details id="add-ons" className={'mt-4 ' + disclosureClass} open={hash === '#add-ons' || undefined}>
            <summary className={summaryClass}>Browse individual services <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 group-open:rotate-180" /></summary>
            <div className="space-y-6 border-t border-primary/15 px-5 py-5 sm:px-7">
              {!catalog && <p role="status" className={bodyClass}>Loading services…</p>}
              {catalog?.unavailable && (
                <p role="status" className={bodyClass}>
                  The full list is temporarily unavailable. <a href="mailto:creative@soleialv.com" className="text-primary underline">Email Soleia Creative</a> for options.
                </p>
              )}
              {catalog && ADD_ON_GROUPS.map((group) => {
                const services = catalog.addOns.filter((item) => item.group === group);
                if (!services.length) return null;

                return (
                  <div key={group}>
                    <h3 className="font-display text-xl text-primary">{group}</h3>
                    <ul className="mt-2 divide-y divide-primary/10">
                      {services.map(({ title, description, video: example, link }) => (
                        <li key={title} className="py-3">
                          <h4 className="font-medium">{title}</h4>
                          <p className={'mt-1 ' + bodyClass}>{description}</p>
                          {example && (
                            <button type="button" onClick={() => setVideo(example)} className={textLinkClass} aria-label={'Watch example: ' + title}>
                              <Play aria-hidden="true" className="h-4 w-4" /> Watch example
                            </button>
                          )}
                          {link && <Link to={link.to} className={textLinkClass}>{link.label}</Link>}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </details>
        </section>

        <section id="production" className={sectionClass}>
          <h2 className={headingClass}>What to send and when</h2>
          <ol className="divide-y divide-primary/15 rounded-2xl border border-primary/20 bg-card/60 px-5 sm:px-7">
            <li className="grid gap-1.5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-5">
              <strong className="font-medium text-primary">21 business days before the event</strong>
              <p className={bodyClass}>Send your signed proposal, vector logos, fonts, brand colors, guidelines, and any artwork or footage you want to use.</p>
            </li>
            <li className="grid gap-1.5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-5">
              <strong className="font-medium text-primary">14 days after kickoff</strong>
              <p className={bodyClass}>Soleia sends your first preview. Kickoff starts once we have your signed proposal and brand assets.</p>
            </li>
            <li className="grid gap-1.5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-5">
              <strong className="font-medium text-primary">Within 3 days of your preview</strong>
              <p className={bodyClass}>Send one set of written notes from your team. One revision round is included within the agreed scope.</p>
            </li>
            <li className="grid gap-1.5 py-4 sm:grid-cols-[14rem_1fr] sm:gap-5">
              <strong className="font-medium text-primary">7 business days before the event</strong>
              <p className={bodyClass}>Send any final revision requests by this cutoff.</p>
            </li>
          </ol>
        </section>

        <section id="own-content" className={sectionClass}>
          <h2 className={headingClass}>Providing your own content?</h2>
          <p className={'max-w-2xl ' + bodyClass}>
            Soleia can map your finished animations to the screens, or your team can deliver files already mapped to our specs. Both options have a 50 GB limit. File changes after delivery may incur fees.
          </p>
          <p className={'mt-2 ' + bodyClass}>Send finished files at least 21 business days before your event for playback testing.</p>
          <Link to={GUIDE_PATH + '/content-delivery'} className={'mt-4 ' + actionClass}>
            Open file specs and templates <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <ul className="mt-4 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
            {SPEC_LINKS.map(({ label, to }) => <li key={to}><Link to={to} className={textLinkClass}>{label}</Link></li>)}
          </ul>
          <p className={'mt-4 border-t border-primary/15 pt-4 ' + bodyClass}>
            Questions about screens, services, or deadlines? <a href="mailto:creative@soleialv.com" className="font-medium text-primary underline underline-offset-4">Email Soleia Creative</a>.
          </p>
        </section>
      </main>

      <CreativeGuideFooter />

      <Overlay open={Boolean(video)} onClose={closeVideo} label="Video preview">
        {video && <video src={video} className="max-h-[85dvh] max-w-full" autoPlay muted controls playsInline />}
        <button type="button" onClick={closeVideo} className={'fixed right-[calc(1.25rem+env(safe-area-inset-right))] top-[calc(1.25rem+env(safe-area-inset-top))] bg-background ' + actionClass}>
          Close video
        </button>
      </Overlay>
    </div>
  );
}
