// Creative Guide category and LED zone definitions

export interface LEDZone {
  id: string;
  name: string;
  category: 'outdoor' | 'indoor';
  subcategory: 'arrival' | 'main-feature' | 'architectural' | 'vertical-transitional';
  description: string;
  useCases: string[];
  specs?: {
    aspectRatio?: string;
    resolution?: string;
    brightness?: string;
  };
}

// Outdoor LED Zones
export const OUTDOOR_LED_ZONES: LEDZone[] = [
  {
    id: 'outdoor-sr',
    name: 'Outdoor SR',
    category: 'outdoor',
    subcategory: 'arrival',
    description: 'High-visibility exterior LED screen serving as the first brand touchpoint for guests approaching from stage right.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      brightness: 'High brightness for outdoor visibility',
    },
  },
  {
    id: 'outdoor-arch',
    name: 'Outdoor Arch',
    category: 'outdoor',
    subcategory: 'arrival',
    description: 'Architectural LED archway creating an immersive entry experience for arriving guests.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      brightness: 'High brightness for outdoor visibility',
    },
  },
  {
    id: 'outdoor-sl',
    name: 'Outdoor SL',
    category: 'outdoor',
    subcategory: 'arrival',
    description: 'High-visibility exterior LED screen serving as the first brand touchpoint for guests approaching from stage left.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      brightness: 'High brightness for outdoor visibility',
    },
  },
];

// Indoor LED Zones
export const INDOOR_LED_ZONES: LEDZone[] = [
  {
    id: 'sol-rays',
    name: 'Sol Rays',
    category: 'indoor',
    subcategory: 'main-feature',
    description: 'Main ceiling LED display acting as the visual anchor of the venue. Supports immersive scale and cinematic motion.',
    useCases: [
      'Full-screen branded environments',
      'Animated logo reveals',
      'Themed motion backgrounds',
      'Sponsor integrations and transitions',
    ],
  },
  {
    id: 'center',
    name: 'Center',
    category: 'indoor',
    subcategory: 'main-feature',
    description: 'Main center stage screen providing the primary focal point for the audience.',
    useCases: [
      'Full-screen branded environments',
      'Animated logo reveals',
      'Themed motion backgrounds',
      'Sponsor integrations and transitions',
    ],
  },
  {
    id: 'dj-booth',
    name: 'DJ Booth',
    category: 'indoor',
    subcategory: 'main-feature',
    description: 'Behind DJ booth screen supporting performance visuals and branded backdrops.',
    useCases: [
      'Full-screen branded environments',
      'Animated logo reveals',
      'Themed motion backgrounds',
      'Sponsor integrations and transitions',
    ],
  },
  {
    id: 'curves-sl',
    name: 'Curves SL',
    category: 'indoor',
    subcategory: 'architectural',
    description: 'Stage left curved screen integrated into architectural elements enhancing spatial immersion.',
    useCases: [
      'Ambient brand color washes',
      'Subtle motion textures',
      'Pattern-based visuals that complement main content',
    ],
  },
  {
    id: 'curves-sr',
    name: 'Curves SR',
    category: 'indoor',
    subcategory: 'architectural',
    description: 'Stage right curved screen integrated into architectural elements enhancing spatial immersion.',
    useCases: [
      'Ambient brand color washes',
      'Subtle motion textures',
      'Pattern-based visuals that complement main content',
    ],
  },
  {
    id: 'imag-sl',
    name: 'IMAG SL',
    category: 'indoor',
    subcategory: 'vertical-transitional',
    description: 'Stage left IMAG screen connecting guest movement throughout the venue.',
    useCases: [
      'Directional branding',
      'Logo animations adapted for orientation',
      'Modular sponsor placements',
    ],
  },
  {
    id: 'imag-sr',
    name: 'IMAG SR',
    category: 'indoor',
    subcategory: 'vertical-transitional',
    description: 'Stage right IMAG screen connecting guest movement throughout the venue.',
    useCases: [
      'Directional branding',
      'Logo animations adapted for orientation',
      'Modular sponsor placements',
    ],
  },
];

export const ALL_LED_ZONES = [...OUTDOOR_LED_ZONES, ...INDOOR_LED_ZONES];

// Creative Guide categories
export const creativeGuideCategories = [
  { 
    key: 'venue-screen-map', 
    label: 'Venue Screen Map', 
    description: 'Interactive overview of all LED zones',
    icon: 'Map'
  },
  { 
    key: 'led-zones', 
    label: 'LED Zones', 
    description: 'Detailed zone specifications and use cases',
    icon: 'Monitor'
  },
] as const;

export type CreativeGuideCategoryKey = typeof creativeGuideCategories[number]['key'];

// Zone subcategory display names
export const ZONE_SUBCATEGORY_LABELS: Record<string, string> = {
  'arrival': 'Arrival / Street-Facing Screens',
  'main-feature': 'Main Feature LED Walls',
  'architectural': 'Architectural LED Accents',
  'vertical-transitional': 'Vertical & Transitional Screens',
};
