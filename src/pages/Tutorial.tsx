import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Palette, 
  ImageIcon, 
  FileText, 
  Users, 
  ArrowRight, 
  Sparkles, 
  Layout, 
  MessageSquare,
  Clock,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Target,
  Layers,
  Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PoweredByShowBlox } from '@/components/PoweredByShowBlox';

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

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
        {/* Timeline */}
        <div className="flex flex-col items-center">
          <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center font-tech font-bold text-lg text-white shrink-0`}>
            {number}
          </div>
          {!isLast && (
            <div className="w-px h-full bg-gradient-to-b from-zinc-700 to-transparent min-h-[80px]" />
          )}
        </div>
        
        {/* Content */}
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

export default function Tutorial() {
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
          <Link to="/" className="flex items-center gap-3">
            <img 
              src="/assets/showblox-icon.png" 
              alt="ShowBlox" 
              className="w-10 h-10"
            />
            <div>
              <span className="font-tech text-lg font-bold uppercase tracking-wider text-white">ShowBlox</span>
              <span className="text-zinc-500 text-xs font-tech uppercase tracking-widest block">Creative Platform</span>
            </div>
          </Link>
          <Link to="/admin">
            <Button variant="outline" size="sm" className="font-tech uppercase tracking-wider border-zinc-700 hover:bg-zinc-800">
              <ExternalLink className="w-4 h-4 mr-2" />
              Admin Portal
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-6">
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
              A comprehensive guide to ShowBlox Creative — the collaborative workspace for visual content creation, 
              mood board curation, and AI-powered creative briefings.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl font-tech font-bold uppercase tracking-wider text-white mb-2">Core Features</h2>
            <p className="text-zinc-500 font-tech text-sm uppercase tracking-widest">What the platform offers</p>
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
      </section>

      {/* Workflow Section */}
      <section className="relative z-10 py-16 px-6 bg-zinc-900/30">
        <div className="max-w-4xl mx-auto">
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
      </section>

      {/* Color Coding Legend */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-4xl mx-auto">
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
      </section>

      {/* Navigation Quick Reference */}
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
