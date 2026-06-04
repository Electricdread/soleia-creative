import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Palette, 
  ImageIcon, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  Layout, 
  MessageSquare,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Target,
  Layers,
  Share2,
  Monitor,
  Map,
  Download,
  Printer,
  Play,
  Eye,
  Grid,
  Tv,
  Sun,
  MousePointer,
  Smartphone,
  Check,
  MapPin,
  Video,
  Maximize2,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';
import { HomeButton } from '@/components/HomeButton';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, color, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="group relative bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-all duration-300"
    >
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="text-lg font-tech font-bold uppercase tracking-wider text-white mb-2">{title}</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

interface WorkflowStepProps {
  number: string;
  title: string;
  description: string;
  details: string[];
  color: string;
  isLast?: boolean;
}

function WorkflowStep({ number, title, description, details, color, isLast = false }: WorkflowStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-tech font-bold text-lg text-white shrink-0`}>
            {number}
          </div>
          {!isLast && (
            <div className="w-px h-full bg-gradient-to-b from-zinc-700 to-transparent min-h-[80px]" />
          )}
        </div>
        
        <div className="pb-12">
          <h3 className="text-xl font-tech font-bold uppercase tracking-wider text-white mb-2">{title}</h3>
          <p className="text-zinc-400 mb-4">{description}</p>
          <ul className="space-y-2">
            {details.map((detail, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-zinc-500">
                <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// Creative Sessions Section
function CreativeSessionsSection() {
  return (
    <div className="space-y-16">
      {/* Workflow - Now First */}
      <div className="bg-zinc-900/30 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Workflow Guide</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Step-by-step navigation</p>
        </motion.div>

        <div className="space-y-2">
          <WorkflowStep
            number="01"
            title="Create a Session"
            description="Start by creating a new creative session from the admin portal."
            details={[
              "Enter project name and client details",
              "Add Circleback URL for transcript analysis (optional)",
              "Include creative notes to guide AI cover generation",
              "Session is immediately saved and accessible"
            ]}
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
          />
          
          <WorkflowStep
            number="02"
            title="Generate Cover Art"
            description="AI generates themed cover images based on your project context."
            details={[
              "Click 'Generate Cover Images' after session creation",
              "System creates multiple themed variations",
              "Select preferred image as session cover",
              "Cover appears on session cards and client view"
            ]}
            color="bg-gradient-to-br from-purple-500 to-pink-600"
          />
          
          <WorkflowStep
            number="03"
            title="Curate Mood Board"
            description="Build visual references by adding content to the mood board."
            details={[
              "Upload images and videos via drag-and-drop",
              "Paste URLs from YouTube, Vimeo, Instagram, etc.",
              "Reorder items with drag-and-drop sorting",
              "Add descriptions and context to each item"
            ]}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          
          <WorkflowStep
            number="04"
            title="Analyze Briefings"
            description="Extract insights from meeting transcripts automatically."
            details={[
              "Paste Circleback transcript URL in session settings",
              "AI parses and highlights key technical points",
              "Deadlines, budgets, and action items are color-coded",
              "Click cover image to view editorial briefing layout"
            ]}
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
          />
          
          <WorkflowStep
            number="05"
            title="Share & Collaborate"
            description="Share the session with clients and team members."
            details={[
              "Copy session link from the session card",
              "Clients can view mood board and add reactions",
              "Threaded comments enable focused discussions",
              "Sessions remain active for 21 days by default"
            ]}
            color="bg-gradient-to-br from-rose-500 to-red-600"
            isLast
          />
        </div>
      </div>

      {/* Color System */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Color System</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Technical highlight reference</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { color: 'bg-cyan-500', label: 'Cyan / Blue', usage: 'Objectives & Technical Specs' },
            { color: 'bg-purple-500', label: 'Purple', usage: 'Client Data & Information' },
            { color: 'bg-emerald-500', label: 'Emerald', usage: 'Links & Recordings' },
            { color: 'bg-pink-500', label: 'Pink', usage: 'Creative Notes & Ideas' },
            { color: 'bg-amber-500', label: 'Amber', usage: 'Summaries & Highlights' },
            { color: 'bg-red-500', label: 'Red', usage: 'Deadlines & Urgent Items' },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4"
            >
              <div className={`w-8 h-8 rounded-lg ${item.color}`} />
              <div>
                <p className="font-tech font-bold uppercase tracking-wider text-white text-sm">{item.label}</p>
                <p className="text-xs text-zinc-500">{item.usage}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid - Now at Bottom */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Core Features</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Internal collaboration tools</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="w-6 h-6 text-white" />}
            title="Creative Sessions"
            description="Time-boxed collaborative workspaces for each project. Sessions include mood boards, briefings, and AI-generated cover art."
            color="bg-gradient-to-br from-cyan-500 to-blue-600"
            delay={0}
          />
          <FeatureCard
            icon={<Layout className="w-6 h-6 text-white" />}
            title="Mood Boards"
            description="Curate and organize visual references, videos, and inspiration. Supports drag-and-drop uploads and social media embeds."
            color="bg-gradient-to-br from-purple-500 to-pink-600"
            delay={0.1}
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6 text-white" />}
            title="AI Cover Generation"
            description="Generate themed cover images using AI based on project details and creative notes. Multiple themes available per session."
            color="bg-gradient-to-br from-amber-500 to-orange-600"
            delay={0.2}
          />
          <FeatureCard
            icon={<FileText className="w-6 h-6 text-white" />}
            title="Technical Briefings"
            description="AI-powered transcript analysis extracts key points, deadlines, and action items from meeting recordings."
            color="bg-gradient-to-br from-emerald-500 to-teal-600"
            delay={0.3}
          />
          <FeatureCard
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            title="Reactions & Comments"
            description="Real-time collaboration with emoji reactions and threaded comments on mood board items."
            color="bg-gradient-to-br from-rose-500 to-red-600"
            delay={0.4}
          />
          <FeatureCard
            icon={<Share2 className="w-6 h-6 text-white" />}
            title="Shareable Links"
            description="Generate unique session links for client collaboration. Links auto-expire after 21 days for security."
            color="bg-gradient-to-br from-indigo-500 to-violet-600"
            delay={0.5}
          />
        </div>
      </div>
    </div>
  );
}

// Looks Collection Section
function LooksCollectionSection() {
  return (
    <div className="space-y-16">
      {/* Overview */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-6">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-tech uppercase tracking-widest text-amber-400">Client-Facing Gallery</span>
          </div>
          <h2 className="text-3xl font-tech font-bold uppercase tracking-wider text-white mb-4">Soleia Looks Collection</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A curated visual gallery featuring motion graphics and branded content for venue screens. 
            Designed with a luxury "Sun Goddess" aesthetic using gold, amber, and bronze tones.
          </p>
        </motion.div>
      </div>

      {/* Workflow - Now First */}
      <div className="bg-zinc-900/30 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Client Workflow</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">How clients navigate the gallery</p>
        </motion.div>

        <div className="space-y-2">
          <WorkflowStep
            number="01"
            title="Browse Collections"
            description="Explore motion graphics organized by category."
            details={[
              "Featured Collections tab shows curated highlights",
              "Filter by category to find specific styles",
              "Hover over clips to preview motion",
              "Click to view fullscreen with audio"
            ]}
            color="bg-gradient-to-br from-amber-500 to-orange-600"
          />
          
          <WorkflowStep
            number="02"
            title="Select Clips"
            description="Choose clips to use for venue screens."
            details={[
              "Click the selection button on desired clips",
              "Selected clips appear in the selections panel",
              "Add notes to each selection for context",
              "Remove selections at any time"
            ]}
            color="bg-gradient-to-br from-amber-600 to-yellow-500"
          />
          
          <WorkflowStep
            number="03"
            title="Assign Placements"
            description="Map selections to specific venue screens."
            details={[
              "Open the placement dialog for each selection",
              "Choose from TV displays, LED walls, or elevators",
              "View the venue diagram to understand screen locations",
              "Multiple clips can be assigned to the same screen"
            ]}
            color="bg-gradient-to-br from-yellow-500 to-amber-400"
          />
          
          <WorkflowStep
            number="04"
            title="Review & Export"
            description="Finalize selections and generate reports."
            details={[
              "Review all selections in the summary panel",
              "View selections organized by screen placement",
              "Export as PDF for stakeholder review",
              "Share the link for team collaboration"
            ]}
            color="bg-gradient-to-br from-amber-400 to-orange-500"
            isLast
          />
        </div>
      </div>

      {/* Admin Management */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Admin Management</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Backend clip and link management</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: <Video className="w-5 h-5" />, title: 'Clip Manager', desc: 'Add, edit, reorder clips with drag-and-drop. Batch upload videos and set thumbnails.' },
            { icon: <Share2 className="w-5 h-5" />, title: 'Client Links', desc: 'Generate unique gallery links for each client. Set expiration dates and track access.' },
            { icon: <ImageIcon className="w-5 h-5" />, title: 'Thumbnail Editor', desc: 'Pick frames from videos or upload custom thumbnails for each clip.' },
            { icon: <Layers className="w-5 h-5" />, title: 'Category Management', desc: 'Organize clips into categories. Set featured collections for client view.' },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-tech font-bold uppercase tracking-wider text-white text-sm mb-1">{item.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features - Now at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <FeatureCard
          icon={<Grid className="w-6 h-6 text-white" />}
          title="Featured Collections"
          description="Curated motion graphics organized by category. The 'Featured Collections' tab is the default view for clients."
          color="bg-gradient-to-br from-amber-500 to-orange-600"
          delay={0}
        />
        <FeatureCard
          icon={<Eye className="w-6 h-6 text-white" />}
          title="Video Previews"
          description="Each clip includes thumbnail previews, hover-to-play functionality, and fullscreen viewing with playback controls."
          color="bg-gradient-to-br from-amber-600 to-yellow-500"
          delay={0.1}
        />
        <FeatureCard
          icon={<Check className="w-6 h-6 text-white" />}
          title="Selection System"
          description="Clients can select clips and assign them to specific venue screens. Selections are saved and shareable."
          color="bg-gradient-to-br from-yellow-500 to-amber-400"
          delay={0.2}
        />
        <FeatureCard
          icon={<MapPin className="w-6 h-6 text-white" />}
          title="Screen Placement"
          description="Interactive venue diagram allows assigning graphics to specific screens: TVs, LEDs, and elevators."
          color="bg-gradient-to-br from-amber-400 to-orange-500"
          delay={0.3}
        />
        <FeatureCard
          icon={<Share2 className="w-6 h-6 text-white" />}
          title="Shareable Links"
          description="Generate client-specific gallery links with unique tokens. Links include all selections and placements."
          color="bg-gradient-to-br from-orange-500 to-red-500"
          delay={0.4}
        />
        <FeatureCard
          icon={<FileText className="w-6 h-6 text-white" />}
          title="Selection Summary"
          description="Export selections as PDF reports showing all chosen clips organized by screen placement."
          color="bg-gradient-to-br from-red-500 to-pink-500"
          delay={0.5}
        />
      </div>
    </div>
  );
}

// Creative Guide Section
function CreativeGuideSection() {
  return (
    <div className="space-y-16">
      {/* Overview */}
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
            <Map className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-tech uppercase tracking-widest text-emerald-400">Interactive Documentation</span>
          </div>
          <h2 className="text-3xl font-tech font-bold uppercase tracking-wider text-white mb-4">Creative Guide</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            An interactive LED zone education system featuring venue layouts, display specifications, 
            pixel mapping guides, and custom content submission requirements.
          </p>
        </motion.div>
      </div>

      {/* Display Types */}
      <div className="bg-zinc-900/30 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Display Types</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Technical specifications overview</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: <Tv className="w-6 h-6" />, name: 'TV Displays', res: '1920×1080', codec: 'H.264/H.265', fps: '30fps' },
            { icon: <Monitor className="w-6 h-6" />, name: 'Elevator', res: '1080×1920', codec: 'H.264', fps: '30fps' },
            { icon: <Maximize2 className="w-6 h-6" />, name: 'LED Master', res: 'Varies by zone', codec: 'DXV3', fps: '30fps' },
          ].map((display, idx) => (
            <motion.div
              key={display.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-5 text-center"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto mb-3">
                {display.icon}
              </div>
              <h4 className="font-tech font-bold uppercase tracking-wider text-white text-sm mb-3">{display.name}</h4>
              <div className="space-y-1 text-xs">
                <p className="text-zinc-400"><span className="text-emerald-400">Res:</span> {display.res}</p>
                <p className="text-zinc-400"><span className="text-emerald-400">Codec:</span> {display.codec}</p>
                <p className="text-zinc-400"><span className="text-emerald-400">FPS:</span> {display.fps}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Interactive Features */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Interactive Features</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Touch-optimized navigation</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { icon: <Hand className="w-5 h-5" />, title: 'Swipe Navigation', desc: 'Horizontal swipe gestures navigate between main guide sections on mobile and iPad.' },
            { icon: <MousePointer className="w-5 h-5" />, title: 'Zone-Screen Sync', desc: 'Clicking zone cards highlights corresponding screens on the venue diagram, and vice versa.' },
            { icon: <Play className="w-5 h-5" />, title: 'Video Carousels', desc: 'Ticker and LED preview videos with swipe navigation, muted autoplay, and fullscreen modals.' },
            { icon: <ImageIcon className="w-5 h-5" />, title: 'Pixel Map Carousel', desc: 'Three venue mapping images (Interior, Outdoor View, Outdoor Arch) with swipe navigation.' },
            { icon: <Printer className="w-5 h-5" />, title: 'Print Specs', desc: 'Generate printable quick-reference sheets for all technical requirements.' },
            { icon: <Download className="w-5 h-5" />, title: 'Asset Downloads', desc: 'After Effects templates, pixel maps (PNG), and production files available for download.' },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="flex gap-4 bg-zinc-900/50 border border-zinc-800 rounded-xl p-5"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="font-tech font-bold uppercase tracking-wider text-white text-sm mb-1">{item.title}</p>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* LED Zones Overview */}
      <div className="bg-zinc-900/30 rounded-3xl p-8 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">LED Zone Categories</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Interior & outdoor screen groupings</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="font-tech font-bold uppercase tracking-wider text-white">Interior Zones</h3>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-cyan-400" /> Main LED Walls</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-cyan-400" /> Architectural Accents</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-cyan-400" /> Vertical Displays</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-cyan-400" /> Transitional Screens</li>
            </ul>
          </div>

          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Sun className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="font-tech font-bold uppercase tracking-wider text-white">Outdoor Zones</h3>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-amber-400" /> Arrival Screens</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-amber-400" /> Street-Facing Displays</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-amber-400" /> Marquee/Ticker</li>
              <li className="flex items-center gap-2"><ChevronRight className="w-4 h-4 text-amber-400" /> Architectural Arch</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Printable Resources */}
      <div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Printable Resources</h2>
          <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Available at /creative-guide/print</p>
        </motion.div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              'Full cover page with branding',
              'Table of contents',
              'All guide sections (specs, zones, pricing)',
              'Asset download links',
              'After Effects template info',
              'Venue blueprints',
              '"What\'s Next?" contact guidance',
              'Terms of service'
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-3 text-sm text-zinc-400">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Main Sections - Now at Bottom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FeatureCard
          icon={<Map className="w-6 h-6 text-white" />}
          title="Venue Screen Map"
          description="Interactive floor plan showing physical screen locations. Click diagram segments to learn about each zone's specifications."
          color="bg-gradient-to-br from-emerald-500 to-teal-600"
          delay={0}
        />
        <FeatureCard
          icon={<Layers className="w-6 h-6 text-white" />}
          title="LED Zones"
          description="Detailed breakdowns of interior and outdoor LED zones: main walls, architectural accents, arrival screens, and vertical displays."
          color="bg-gradient-to-br from-teal-500 to-cyan-600"
          delay={0.1}
        />
        <FeatureCard
          icon={<Monitor className="w-6 h-6 text-white" />}
          title="Display Specifications"
          description="Technical requirements for each display type: TV, Elevator, LED Master, and Ticker. Includes resolution, codec, and frame rates."
          color="bg-gradient-to-br from-cyan-500 to-blue-600"
          delay={0.2}
        />
        <FeatureCard
          icon={<Palette className="w-6 h-6 text-white" />}
          title="Custom Content"
          description="Soleia Creative Team partnership details, content development pricing, 21-day submission timeline, and terms of service."
          color="bg-gradient-to-br from-blue-500 to-indigo-600"
          delay={0.3}
        />
      </div>
    </div>
  );
}

export default function Tutorial() {
  const [activeTab, setActiveTab] = useState('sessions');

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-zinc-900">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeButton variant="dark" />
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="/soleia-icon.png" 
                alt="Soleia" 
                className="w-10 h-10"
              />
              <div>
                <span className="font-tech text-lg font-bold uppercase tracking-wider text-white">Soleia</span>
                <span className="text-zinc-500 text-xs font-tech uppercase tracking-widest block">Creative Platform</span>
              </div>
            </Link>
          </div>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="font-tech uppercase tracking-wider border-zinc-700 hover:bg-zinc-800">
              <ExternalLink className="w-4 h-4 mr-2" />
              Admin Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-tech uppercase tracking-widest text-cyan-400">Technical Documentation</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-tech font-bold uppercase tracking-wider text-white mb-6">
              Platform
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500">
                Tutorial
              </span>
            </h1>
            
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              Comprehensive documentation for Soleia Creative, Soleia Looks Collection, and the Creative Guide system.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full max-w-2xl mx-auto grid grid-cols-3 bg-zinc-900/50 border border-zinc-800 p-1 rounded-xl mb-12">
              <TabsTrigger 
                value="sessions" 
                className="font-tech uppercase tracking-wider text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg"
              >
                <Zap className="w-4 h-4 mr-2" />
                Sessions
              </TabsTrigger>
              <TabsTrigger 
                value="looks" 
                className="font-tech uppercase tracking-wider text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-orange-600 data-[state=active]:text-white rounded-lg"
              >
                <Sun className="w-4 h-4 mr-2" />
                Looks
              </TabsTrigger>
              <TabsTrigger 
                value="guide" 
                className="font-tech uppercase tracking-wider text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white rounded-lg"
              >
                <Map className="w-4 h-4 mr-2" />
                Guide
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sessions" className="mt-0">
              <CreativeSessionsSection />
            </TabsContent>

            <TabsContent value="looks" className="mt-0">
              <LooksCollectionSection />
            </TabsContent>

            <TabsContent value="guide" className="mt-0">
              <CreativeGuideSection />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="relative z-10 py-16 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Quick Navigation</h2>
            <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">Key routes and access points</p>
          </motion.div>

          <div className="space-y-3">
            {[
              { path: '/admin', label: 'Admin Portal', description: 'Central dashboard for all administrative functions' },
              { path: '/admin/creative', label: 'Creative Sessions', description: 'Manage and create collaborative sessions' },
              { path: '/admin/looks', label: 'Looks Collection', description: 'Curate client-facing visual gallery' },
              { path: '/creative-guide', label: 'Creative Guide', description: 'LED zone education and specs' },
              { path: '/creative-guide/print', label: 'Print Guide', description: 'Printable full documentation' },
              { path: '/admin/users', label: 'User Management', description: 'Admin access control and approvals' },
            ].map((route, idx) => (
              <motion.div
                key={route.path}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Link 
                  to={route.path}
                  className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <code className="font-tech text-cyan-400 text-sm bg-cyan-500/10 px-3 py-1 rounded-lg">{route.path}</code>
                    <div>
                      <p className="font-tech font-bold uppercase tracking-wider text-white text-sm">{route.label}</p>
                      <p className="text-xs text-zinc-500">{route.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-4">Ready to Start?</h2>
            <p className="text-zinc-400 mb-8">
              Access the admin portal to begin creating collaborative creative sessions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/admin">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 font-tech uppercase tracking-wider w-full sm:w-auto">
                  <Target className="w-5 h-5 mr-2" />
                  Open Admin Portal
                </Button>
              </Link>
              <Link to="/creative-guide">
                <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-zinc-800 font-tech uppercase tracking-wider w-full sm:w-auto">
                  <Layers className="w-5 h-5 mr-2" />
                  View Creative Guide
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <PoweredByShowBlox />
          <p className="text-xs font-tech text-zinc-600 uppercase tracking-widest">
            Technical Documentation • {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}
