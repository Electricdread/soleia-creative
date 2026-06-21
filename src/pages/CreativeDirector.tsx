import { useEffect, useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PORTRAIT_SRC = "/luis-dreams-portrait.jpg";

const TAB_BODIES: Record<string, JSX.Element> = {
  bio: (
    <div className="space-y-4 text-muted-foreground leading-relaxed max-w-prose">
      <p>
        Luis Dreams has spent more than a decade designing the visual language of
        nightlife — from intimate club rooms to festival main stages and arena
        tours. His work sits at the intersection of motion design, live VJ
        performance, and large-format LED show design: building the imagery that
        makes a room feel like an event.
      </p>
      <p>
        Early in his career he became known for building bespoke visual sets for
        touring DJs and artists, translating a performer's catalogue and brand
        into a venue-wide show that could be played live, beat by beat. That
        discipline — reading the room, the music, and the moment in real time —
        became the foundation for everything that followed.
      </p>
      <p>
        Over time, Luis began applying the same craft to branded environments:
        product launches, corporate galas, and experiential activations that
        wanted the energy of a nightclub without losing the polish of a brand
        stage. The result is a body of work that refuses to choose between
        culture and commerce.
      </p>
      <p>
        As Creative Director of Soleia, Luis leads a team built around a single
        idea: at Soleia, the brand is the headliner. Every show is engineered so
        the client's identity carries the room the way a headlining artist
        would — with intention, rhythm, and a visual signature audiences
        remember.
      </p>
    </div>
  ),
  liv: (
    <div className="space-y-4 text-muted-foreground leading-relaxed max-w-prose">
      <p>
        Luis built a defining chapter of his career at LIV Nightclub in Miami —
        one of the most influential nightclubs in the world and a proving ground
        for the modern club visual program.
      </p>
      <p>
        Night after night, he ran the live visual show for the room: VJing in
        real time, cutting custom motion content for headlining DJs, and
        programming the LED system to react to the music and the crowd. He
        designed sequences that lived inside the set, not on top of it —
        treating the screens as another instrument in the performance.
      </p>
      <p>
        That residency shaped the way an entire generation of audiences expects
        a club room to look and feel, and it is the technical and creative
        backbone Luis now brings to Soleia's stages.
      </p>
    </div>
  ),
  vice: (
    <div className="space-y-4 text-muted-foreground leading-relaxed max-w-prose">
      <p>
        Luis collaborated with director Michael Mann on the opening sequence of
        the new <em>Miami Vice</em>, curating and operating the visual content
        that fills the film's nightclub scene.
      </p>
      <p>
        Working alongside Mann's team, he selected, edited and timed the on-screen
        visuals so the room would read as a real Miami nightclub on camera — not
        as set dressing. Every cut, color and tempo choice was tuned to the
        cinematography, so the screens behaved the way they would behave on a
        live show floor.
      </p>
      <p>
        It is a rare credit: club-floor visual direction crossing into feature
        film, with the same instincts that drive a live show carried into a
        Michael Mann frame.
      </p>
    </div>
  ),
  artists: (
    <div className="space-y-4 text-muted-foreground leading-relaxed max-w-prose">
      <p>
        Luis works directly with global artists and DJs to build custom show
        content — visual sets designed specifically for a single performer, a
        single tour, or a single night.
      </p>
      <p>
        Most notably, he designed and ran the visuals for 50 Cent's Dome event,
        translating the artist's catalogue and stage presence into a full
        venue-wide visual program. The screens, the lighting cues and the
        cut-points were all built to move with the performance instead of
        running behind it.
      </p>
      <p>
        That ongoing work with touring DJs and artists — building bespoke shows
        from an artist's brand, music and audience — is the same discipline
        Luis now applies to Soleia's corporate clients. The brand is treated
        like the artist: studied, staged, and given a show worth headlining.
      </p>
    </div>
  ),
};

export default function CreativeDirector() {
  const [portraitOk, setPortraitOk] = useState(true);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Creative Director — Luis Dreams | Soleia";
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    const img = new Image();
    img.onload = () => setPortraitOk(true);
    img.onerror = () => setPortraitOk(false);
    img.src = PORTRAIT_SRC;
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Creative Director — Luis Dreams | Soleia</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Luis Dreams, Creative Director of Soleia."
        />
      </Helmet>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <section className="grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-14 md:items-start">
          {/* Portrait */}
          <div className="relative">
            <div className="surface-elevated rounded-3xl border border-primary/15 overflow-hidden aspect-[4/5] relative">
              {portraitOk ? (
                <img
                  src={PORTRAIT_SRC}
                  alt="Portrait of Luis Dreams, Creative Director of Soleia"
                  className="w-full h-full object-cover"
                  onError={() => setPortraitOk(false)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background to-muted/30">
                  <img
                    src="/soleia-icon.png"
                    alt=""
                    aria-hidden="true"
                    className="h-16 w-16 opacity-80"
                  />
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Portrait coming soon
                  </p>
                </div>
              )}
              {/* Corner ticks */}
              <span className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t border-l border-[#c49a3c]/70" />
              <span className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t border-r border-[#c49a3c]/70" />
              <span className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b border-l border-[#c49a3c]/70" />
              <span className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b border-r border-[#c49a3c]/70" />
            </div>
          </div>

          {/* Intro */}
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#c49a3c]">
              Creative Director
            </p>
            <h1 className="font-display text-5xl md:text-6xl mt-3 leading-[1.05]">
              Luis Dreams
            </h1>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed max-w-prose">
              <p>
                Luis Dreams is the Creative Director of Soleia. His work bridges
                a decade of nightclub and touring-artist visual production with
                the discipline of corporate brand storytelling.
              </p>
              <p>
                He leads Soleia's creative team around a single thesis:{" "}
                <span className="text-foreground">
                  at Soleia, the brand is the headliner.
                </span>
              </p>
            </div>

            {/* Tabs */}
            <div className="mt-10">
              <Tabs defaultValue="bio" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto flex-nowrap bg-transparent border-b border-border rounded-none p-0 h-auto">
                  {[
                    { value: "bio", label: "Bio" },
                    { value: "liv", label: "LIV Miami" },
                    { value: "vice", label: "Miami Vice × Michael Mann" },
                    { value: "artists", label: "Live Artist Work" },
                  ].map((t) => (
                    <TabsTrigger
                      key={t.value}
                      value={t.value}
                      className="font-display text-base md:text-lg px-4 py-3 rounded-none border-b-2 border-transparent data-[state=active]:border-[#c49a3c] data-[state=active]:text-foreground text-muted-foreground bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap"
                    >
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(TAB_BODIES).map(([k, body]) => (
                  <TabsContent key={k} value={k} className="pt-6">
                    {body}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
