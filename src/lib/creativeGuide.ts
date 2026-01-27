// Creative Guide category, LED zone, and display specifications from the PDF

export interface DisplaySpec {
  resolution: string;
  format: string;
  codec?: string;
  frameRate?: string;
  duration?: string;
  fileSize?: string;
}

export interface DisplayType {
  id: string;
  name: string;
  category: 'tv' | 'elevator' | 'led' | 'ticker';
  description: string;
  videoSpecs: DisplaySpec;
  graphicSpecs: DisplaySpec;
  logoSpecs?: DisplaySpec;
  creativeNotes?: string[];
  deliverables?: string[];
  dimensions?: { width: number; height: number; label: string }[];
  image: string;
  diagramImage?: string;
}

export interface LEDZone {
  id: string;
  name: string;
  category: 'outdoor' | 'indoor';
  subcategory: 'arrival' | 'main-feature' | 'architectural' | 'vertical-transitional' | 'booth' | 'curves';
  description: string;
  useCases: string[];
  resolution?: string;
  specs?: {
    aspectRatio?: string;
    resolution?: string;
    brightness?: string;
  };
}

// Display Types from the PDF
export const DISPLAY_TYPES: DisplayType[] = [
  {
    id: 'television',
    name: 'Television Displays',
    category: 'tv',
    description: 'High-definition TV displays throughout the venue for branded content and event visuals.',
    videoSpecs: {
      resolution: '1280x720 or 1920x1080',
      format: 'MP4',
      codec: 'H264',
      fileSize: 'Max 8GB',
    },
    graphicSpecs: {
      resolution: '1280x720 or 1920x1080',
      format: 'PNG',
    },
    logoSpecs: {
      resolution: 'Vector preferred',
      format: 'EPS, AI, SVG (preferred) or high-res PNG with transparent background',
    },
    image: '/creative-guide/tv-specs.jpg',
    diagramImage: '/creative-guide/tv-display.jpg',
  },
  {
    id: 'elevator',
    name: 'Elevator Displays',
    category: 'elevator',
    description: 'Vertical displays in elevators requiring portrait-oriented content with specific deliverables.',
    videoSpecs: {
      resolution: '600x800',
      format: 'WMV',
      frameRate: '30 fps',
      duration: '30 sec',
    },
    graphicSpecs: {
      resolution: '600x800',
      format: 'PNG or JPG',
    },
    deliverables: [
      '(1) 30-sec video or graphic file for elevator moving up',
      '(1) 30-sec video or graphic file for elevator moving down',
      '(1) Still graphic for elevator idling',
    ],
    creativeNotes: [
      'Up/Down content may be the same file if preferred.',
      'For smooth transitions, we recommend using the first frame of your video as the idle graphic.',
    ],
    image: '/creative-guide/elevator-specs.jpg',
    diagramImage: '/creative-guide/elevator-display.jpg',
  },
  {
    id: 'led',
    name: 'LED Displays',
    category: 'led',
    description: 'Large-scale LED screens requiring high-resolution content optimized for bright displays.',
    videoSpecs: {
      resolution: '3840x2160',
      format: 'MOV - High Quality with Alpha',
      codec: 'DXV3',
      frameRate: '60 fps',
      fileSize: 'Max 30GB',
    },
    graphicSpecs: {
      resolution: 'Vector preferred',
      format: 'EPS, AI, SVG (preferred) or high-res PNG with transparent background',
    },
    creativeNotes: [
      'The LED screens are very bright; when designing background visuals, we recommend avoiding overly bright or highly saturated colors.',
      'For optimal visibility, we recommend using white or light logo versions against darker backgrounds.',
      'For optimal playback on our Resolume (Media Server), maintain a resolution of 3840 x 2160 in .MOV format, using the preferred DXV3 codec.',
    ],
    dimensions: [
      { width: 588, height: 840, label: 'Outdoor SR' },
      { width: 588, height: 840, label: 'Outdoor SL' },
      { width: 1512, height: 504, label: 'Outdoor Arch' },
      { width: 1152, height: 272, label: 'SR Curve #1' },
      { width: 1152, height: 272, label: 'SR Curve #2' },
      { width: 1152, height: 272, label: 'SL Curve #1' },
      { width: 1152, height: 272, label: 'SL Curve #2' },
      { width: 640, height: 272, label: 'SR Booth' },
      { width: 640, height: 272, label: 'SL Booth' },
      { width: 1344, height: 272, label: 'Center Booth' },
    ],
    image: '/creative-guide/led-specs.jpg',
    diagramImage: '/creative-guide/led-displays.jpg',
  },
  {
    id: 'ticker',
    name: 'Marquee/Ticker Display',
    category: 'ticker',
    description: 'Scrolling marquee displays for dynamic messaging and brand presence.',
    videoSpecs: {
      resolution: '1280x768',
      format: 'MP4',
      codec: 'H264',
      duration: '15 sec',
    },
    graphicSpecs: {
      resolution: '1280x768',
      format: 'MP4',
    },
    dimensions: [
      { width: 672, height: 192, label: 'West 1' },
      { width: 960, height: 192, label: 'West 2' },
      { width: 960, height: 192, label: 'South 1' },
      { width: 1200, height: 192, label: 'South 2' },
    ],
    image: '/creative-guide/ticker-specs.jpg',
    diagramImage: '/creative-guide/ticker-display.jpg',
  },
];

// Outdoor LED Zones
export const OUTDOOR_LED_ZONES: LEDZone[] = [
  {
    id: 'outdoor-sr',
    name: 'Outdoor SR',
    category: 'outdoor',
    subcategory: 'arrival',
    resolution: '588x840',
    description: 'High-visibility exterior LED screen on stage right, serving as the first brand touchpoint for arriving guests.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      resolution: '588x840',
      brightness: 'High brightness for outdoor visibility',
    },
  },
  {
    id: 'outdoor-arch',
    name: 'Outdoor Arch',
    category: 'outdoor',
    subcategory: 'arrival',
    resolution: '1512x504',
    description: 'Architectural LED archway creating an immersive entry experience for arriving guests.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      resolution: '1512x504',
      brightness: 'High brightness for outdoor visibility',
    },
  },
  {
    id: 'outdoor-sl',
    name: 'Outdoor SL',
    category: 'outdoor',
    subcategory: 'arrival',
    resolution: '588x840',
    description: 'High-visibility exterior LED screen on stage left, serving as the first brand touchpoint for arriving guests.',
    useCases: [
      'Brand reveals and announcement moments',
      'Event title cards and sponsor recognition',
      'Looping branded motion graphics',
      'Countdown or pre-event visuals',
    ],
    specs: {
      resolution: '588x840',
      brightness: 'High brightness for outdoor visibility',
    },
  },
];

// Indoor LED Zones (removed SR Booth and SL Booth)
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
    subcategory: 'booth',
    resolution: '1344x272',
    description: 'Main center stage screen providing the primary focal point for the audience.',
    useCases: [
      'Full-screen branded environments',
      'Animated logo reveals',
      'Themed motion backgrounds',
      'Sponsor integrations and transitions',
    ],
    specs: {
      resolution: '1344x272',
    },
  },
  {
    id: 'dj-booth',
    name: 'DJ Booth',
    category: 'indoor',
    subcategory: 'booth',
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
    name: 'SL Curves',
    category: 'indoor',
    subcategory: 'curves',
    resolution: '1152x272 (x2)',
    description: 'Stage left curved screens (2 sections) integrated into architectural elements enhancing spatial immersion.',
    useCases: [
      'Ambient brand color washes',
      'Subtle motion textures',
      'Pattern-based visuals that complement main content',
    ],
    specs: {
      resolution: '1152x272 each',
    },
  },
  {
    id: 'curves-sr',
    name: 'SR Curves',
    category: 'indoor',
    subcategory: 'curves',
    resolution: '1152x272 (x2)',
    description: 'Stage right curved screens (2 sections) integrated into architectural elements enhancing spatial immersion.',
    useCases: [
      'Ambient brand color washes',
      'Subtle motion textures',
      'Pattern-based visuals that complement main content',
    ],
    specs: {
      resolution: '1152x272 each',
    },
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

// Zone ID to Screen ID mapping for venue diagram highlighting
// Maps each LED zone to its corresponding screen segment(s) on the diagrams
export const ZONE_TO_SCREEN_MAP: Record<string, string[]> = {
  // Outdoor zones -> OutdoorPlacementDiagram segment IDs
  'outdoor-sr': ['Outdoor SR'],
  'outdoor-arch': ['Outdoor Arch'],
  'outdoor-sl': ['Outdoor SL'],
  // Indoor zones -> VenueScreenMap segment IDs
  'sol-rays': ['Sol Rays'],
  'center': ['Center'],
  'dj-booth': ['DJ Booth'],
  'curves-sl': ['Curves SL'],
  'curves-sr': ['Curves SR'],
  'imag-sl': ['IMAG SL'],
  'imag-sr': ['IMAG SR'],
};

// Screen ID to Zone ID reverse mapping for clicking diagram to select zones
export const SCREEN_TO_ZONE_MAP: Record<string, string[]> = Object.entries(ZONE_TO_SCREEN_MAP).reduce(
  (acc, [zoneId, screenIds]) => {
    screenIds.forEach(screenId => {
      if (!acc[screenId]) acc[screenId] = [];
      if (!acc[screenId].includes(zoneId)) acc[screenId].push(zoneId);
    });
    return acc;
  },
  {} as Record<string, string[]>
);

// Creative Guide categories - expanded with PDF content (removed separate screen map)
export const creativeGuideCategories = [
  { 
    key: 'introduction', 
    label: 'Introduction', 
    description: 'Pricing, timelines & terms',
    icon: 'BookOpen'
  },
  { 
    key: 'venue-overview', 
    label: 'Venue Overview', 
    description: 'Layout and 3D visualization',
    icon: 'Building2'
  },
  { 
    key: 'display-specs', 
    label: 'Display Specs', 
    description: 'Technical specifications by display type',
    icon: 'FileText'
  },
  { 
    key: 'led-zones', 
    label: 'LED Zones', 
    description: 'Interactive zone selection & specs',
    icon: 'Monitor'
  },
  { 
    key: 'custom-content', 
    label: 'Custom Content', 
    description: 'Pixelmap specs and templates',
    icon: 'Palette'
  },
] as const;

export type CreativeGuideCategoryKey = typeof creativeGuideCategories[number]['key'];

// Zone subcategory display names
export const ZONE_SUBCATEGORY_LABELS: Record<string, string> = {
  'arrival': 'Arrival / Street-Facing Screens',
  'main-feature': 'Main Feature LED Walls',
  'architectural': 'Architectural LED Accents',
  'vertical-transitional': 'Vertical & Transitional Screens',
  'booth': 'Booth LED Screens',
  'curves': 'Curved LED Screens',
};

// Guide images from PDF
export const GUIDE_IMAGES = {
  cover: '/creative-guide/cover.jpg',
  venueLayout: '/creative-guide/venue-layout.jpg',
  venueBlueprint: '/creative-guide/venue-blueprint.png',
  visualization3d: '/creative-guide/outdoor-screens.png',
  tvSpecs: '/creative-guide/tv-specs.jpg',
  tvDisplay: '/creative-guide/tv-display.jpg',
  elevatorSpecs: '/creative-guide/elevator-specs.jpg',
  elevatorDisplay: '/creative-guide/elevator-display.jpg',
  ledSpecs: '/creative-guide/led-specs.jpg',
  ledDisplays: '/creative-guide/led-displays.jpg',
  tickerSpecs: '/creative-guide/ticker-specs.jpg',
  tickerDisplay: '/creative-guide/ticker-display.jpg',
  customContent: '/creative-guide/custom-content.jpg',
  examples: '/creative-guide/examples.jpg',
};

// Blueprint venue details for PDF print
export const VENUE_BLUEPRINT_DETAILS = {
  cabanas: [
    { label: 'Cabanas 1-10', location: 'North side', tvDisplays: true },
    { label: 'Cabanas 11-15', location: 'South side', tvDisplays: true },
  ],
  bungalows: [
    { label: 'Bungalows 1-9', location: 'West side', tvDisplays: true },
  ],
  ledScreens: [
    { label: 'LED Screen', location: 'Main stage area' },
    { label: 'LED Curves', location: 'Around venue perimeter' },
  ],
  tvDisplays: [
    { label: 'TV Displays', location: 'Cabanas & Bungalows area' },
  ],
  pools: [
    { label: 'Main Pool', location: 'Center of venue' },
  ],
  mezzanine: [
    { label: 'Mezzanine Level 1', location: 'East side' },
    { label: 'Mezzanine Level 2', location: 'East side upper' },
  ],
};

// Custom content creation info
export const CUSTOM_CONTENT_INFO = {
  title: 'Custom Content Creation',
  description: 'By using the Pixelmaps, you can take control of every pixel we display throughout our venue.',
  timeline: [
    {
      title: 'Sample Submission',
      days: 21,
      description: 'Share a sample of your rendered video or media at least 21 Business Days prior to your event for testing and approval.',
    },
    {
      title: 'Brand Assets',
      days: 21,
      description: 'Provide logos, style guides, and other pertinent assets at least 21 Business Days prior to your event.',
    },
  ],
  note: 'This timeline grants our skilled video artists the necessary span to meticulously craft, fine-tune, and preload your content, ensuring its flawless presentation.',
  downloadLabel: 'Pixelmap Specs and After Effects Template',
};
