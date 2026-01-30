import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Workspace {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

const workspaces: Workspace[] = [
  {
    id: 'midjourney',
    name: 'MidJourney',
    url: 'https://www.midjourney.com/app/',
    icon: '🎨',
    color: 'purple',
  },
  {
    id: 'openart',
    name: 'OpenArt.ai',
    url: 'https://openart.ai/',
    icon: '✨',
    color: 'pink',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    url: 'https://chat.openai.com/',
    icon: '🤖',
    color: 'emerald',
  },
  {
    id: 'perplexity',
    name: 'Perplexity',
    url: 'https://www.perplexity.ai/',
    icon: '🔮',
    color: 'cyan',
  },
];

export function EmbeddedWorkspaces() {
  const [activeWorkspace, setActiveWorkspace] = useState('midjourney');
  const [isExpanded, setIsExpanded] = useState(false);

  const openInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspace);

  return (
    <div className={`bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden transition-all duration-300 ${
      isExpanded ? 'fixed inset-4 z-50' : ''
    }`}>
      <Tabs value={activeWorkspace} onValueChange={setActiveWorkspace} className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-zinc-800 flex items-center justify-between bg-zinc-900">
          <TabsList className="bg-transparent gap-1 h-auto p-0">
            {workspaces.map((workspace) => (
              <TabsTrigger
                key={workspace.id}
                value={workspace.id}
                className={`px-3 py-1.5 text-xs font-tech data-[state=active]:bg-${workspace.color}-500/20 data-[state=active]:text-${workspace.color}-400 data-[state=active]:border data-[state=active]:border-${workspace.color}-500/30 rounded-lg transition-all`}
              >
                <span className="mr-1.5">{workspace.icon}</span>
                <span className="hidden sm:inline">{workspace.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
              onClick={() => currentWorkspace && openInNewTab(currentWorkspace.url)}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-zinc-400 hover:text-white"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </Button>
          </div>
        </div>

        {workspaces.map((workspace) => (
          <TabsContent
            key={workspace.id}
            value={workspace.id}
            className={`flex-1 m-0 ${isExpanded ? 'h-[calc(100%-48px)]' : 'h-[500px]'}`}
          >
            <iframe
              src={workspace.url}
              className="w-full h-full border-0"
              title={workspace.name}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
              loading="lazy"
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Backdrop for expanded mode */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}
