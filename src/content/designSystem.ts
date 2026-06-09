/**
 * Soleia design-system schema — imported from an external style extraction and
 * re-skinned to our palette.
 *
 * Each section keeps the original prompts/specs verbatim (so they can guide
 * future AI generations), but every hard-coded color has been remapped to our
 * tokens. Our palette (from src/index.css):
 *   primary  gold   light hsl(32 85% 38%) · dark hsl(38 92% 50%)
 *   accent   bronze light hsl(28 80% 35%) · dark hsl(32 85% 45%)
 *   surface  light hsl(35 12% 93%)  · card light #fff / dark hsl(30 20% 8%)
 *   border   light hsl(220 10% 90%) · dark hsl(30 25% 18%)
 *   text     light hsl(220 15% 15%) · dark hsl(45 30% 95%)
 *
 * Color substitutions applied to the source material:
 *   #0F172A (slate hairline)  -> hsl(32 85% 38%) / hsl(38 92% 50%)  (gold edge)
 *   #EFEFF5 (cool gray fill)  -> hsl(35 12% 93%)                    (warm surface)
 * Geometry, shadow recipes and motion timings are kept from the source schema.
 */

export interface DesignTechnique {
  /** Short technique name. */
  name: string;
  /** Verbatim generation prompt — feed this to an AI when building UI. */
  prompt: string;
  /** Self-contained example markup, re-skinned to our palette. */
  html: string;
  /** Original source values, for traceability. */
  source?: string;
}

export interface DesignSection {
  id: string;
  title: string;
  description: string;
  /** Resolved spec tokens (colors already mapped to our palette). */
  tokens?: Record<string, string>;
  techniques?: DesignTechnique[];
  dos?: string[];
  donts?: string[];
}

/** Reusable elevation shadow — neutral, palette-agnostic; shared by every surface. */
export const ELEVATION_SHADOW =
  'rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, ' +
  'rgba(0, 0, 0, 0.035) 0px 2.8px 2.2px 0px, rgba(0, 0, 0, 0.047) 0px 6.7px 5.3px 0px, ' +
  'rgba(0, 0, 0, 0.06) 0px 12.5px 10px 0px, rgba(0, 0, 0, 0.07) 0px 22.3px 17.9px 0px, ' +
  'rgba(0, 0, 0, 0.086) 0px 41.8px 33.4px 0px, rgba(0, 0, 0, 0.12) 0px 100px 80px 0px';

export const DESIGN_SYSTEM: DesignSection[] = [
  {
    id: 'elevation-depth',
    title: 'Elevation & Depth',
    description:
      'Depth is communicated through elevation, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.',
    tokens: {
      surfaceStyle: 'elevated',
      // source: 0.67px #0F172A  ->  gold hairline in our palette
      borderStyle: '0.67px hsl(32 85% 38%)',
      shadowStyle: ELEVATION_SHADOW,
    },
    techniques: [
      {
        name: 'Gradient border shell',
        prompt:
          'Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 32px padding and a 0px radius. Drive the shell with none so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.',
        // Re-skin: shell carries our gold gradient as the hero edge; inner panel
        // carries the warm surface fill + shared elevation shadow.
        html:
          '<div style="display:inline-block; padding:32px; border-radius:24px; background:linear-gradient(135deg, hsl(38 92% 50%), hsl(28 80% 35%));">' +
          '<div style="min-width:240px; padding:18px 20px; border-radius:22px; background:hsl(35 12% 93%); color:hsl(220 15% 15%); box-shadow:' +
          ELEVATION_SHADOW +
          '; box-sizing:border-box;">' +
          '<strong style="display:block; margin-bottom:8px;">Gradient border shell</strong>' +
          '<span style="display:block; opacity:0.72;">Outer wrapper carries the gold gradient edge. Inner panel carries the true surface fill.</span>' +
          '</div></div>',
        source:
          'Original: outer padding 32px, radius 0px, background none; inner fill #EFEFF5, border 0.67px #0F172A.',
      },
    ],
  },
  {
    id: 'shapes',
    title: 'Shapes',
    description:
      'Shapes rely on a tight radius system anchored by 24px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.',
    tokens: {
      radius: '24px',
    },
  },
  {
    id: 'motion',
    title: 'Motion',
    description:
      'Motion stays restrained and interface-led across text, layout, and scroll transitions. Timing clusters around 500ms. Easing favors ease and cubic-bezier(0.4, 0, 0.2, 1). Hover behavior focuses on transform changes. Scroll choreography uses GSAP ScrollTrigger for section reveals and pacing.',
    tokens: {
      motionLevel: 'minimal',
      durations: '500ms',
      easings: 'ease, cubic-bezier(0.4, 0, 0.2, 1)',
      hoverPatterns: 'transform',
      scrollPatterns: 'gsap-scrolltrigger',
    },
  },
  {
    id: 'dos-and-donts',
    title: "Do's and Don'ts",
    description:
      'Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.',
    dos: [
      'Use the primary palette (gold) as the main accent for emphasis and action states.',
      'Reuse the elevated surface treatment consistently across cards and controls.',
      'Keep corner radii within the detected 24px family.',
    ],
    donts: [
      'Do not introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.',
      'Do not mix unrelated shadow or blur recipes that break the current depth system.',
      'Do not exceed the detected minimal motion intensity without a deliberate reason.',
    ],
  },
];

export default DESIGN_SYSTEM;
