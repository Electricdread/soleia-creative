import { useState } from 'react';
import { Sparkles, Copy, Check, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const styleModifiers = [
  'cinematic lighting', 'hyperrealistic', '8k resolution', 'volumetric fog',
  'dramatic shadows', 'golden hour', 'neon glow', 'ethereal atmosphere',
  'moody ambiance', 'high contrast', 'film grain', 'shallow depth of field',
  'professional photography', 'studio lighting', 'ray tracing', 'octane render',
];

const artStyles = [
  'cyberpunk', 'vaporwave', 'art deco', 'brutalist', 'minimalist',
  'surrealism', 'impressionist', 'futuristic', 'retro-futurism', 'gothic',
  'baroque', 'contemporary', 'abstract', 'photorealistic', 'concept art',
];

const cameras = [
  'Sony A7R IV', 'Canon EOS R5', 'Hasselblad X2D', 'Phase One IQ4',
  'RED V-RAPTOR', 'ARRI Alexa 65', 'Blackmagic URSA', 'Leica M11',
];

export function SuperPromptGenerator() {
  const [basePrompt, setBasePrompt] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleModifier = (modifier: string) => {
    setSelectedModifiers(prev => 
      prev.includes(modifier) 
        ? prev.filter(m => m !== modifier)
        : [...prev, modifier]
    );
  };

  const generateSuperPrompt = () => {
    if (!basePrompt.trim()) {
      toast.error('Enter a base prompt first');
      return;
    }

    setIsGenerating(true);
    
    setTimeout(() => {
      const parts = [basePrompt.trim()];
      
      if (selectedStyle) {
        parts.push(`${selectedStyle} style`);
      }
      
      if (selectedModifiers.length > 0) {
        parts.push(selectedModifiers.join(', '));
      }
      
      if (selectedCamera) {
        parts.push(`shot on ${selectedCamera}`);
      }

      // Add quality boosters
      parts.push('masterpiece', 'award-winning', 'highly detailed');

      const superPrompt = parts.join(', ');
      setGeneratedPrompt(superPrompt);
      setIsGenerating(false);
      toast.success('Super prompt generated!');
    }, 500);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const randomize = () => {
    const randomModifiers = styleModifiers
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);
    const randomStyle = artStyles[Math.floor(Math.random() * artStyles.length)];
    const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];

    setSelectedModifiers(randomModifiers);
    setSelectedStyle(randomStyle);
    setSelectedCamera(randomCamera);
  };

  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h3 className="font-tech text-sm uppercase tracking-wider text-zinc-300">Super Token Prompt Generator</h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Base Prompt */}
        <div>
          <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1.5 block">
            Base Prompt
          </label>
          <Textarea
            value={basePrompt}
            onChange={(e) => setBasePrompt(e.target.value)}
            placeholder="Describe your vision... e.g., 'A futuristic cityscape at night with flying cars'"
            className="font-tech text-sm bg-zinc-800/50 border-zinc-700 focus:border-cyan-500/50 min-h-[80px] resize-none"
          />
        </div>

        {/* Art Style */}
        <div>
          <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1.5 block">
            Art Style
          </label>
          <div className="flex flex-wrap gap-1.5">
            {artStyles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(selectedStyle === style ? '' : style)}
                className={`px-2 py-1 text-[10px] font-tech uppercase rounded-md border transition-all ${
                  selectedStyle === style
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Style Modifiers */}
        <div>
          <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1.5 block">
            Style Modifiers
          </label>
          <div className="flex flex-wrap gap-1.5">
            {styleModifiers.map((modifier) => (
              <button
                key={modifier}
                onClick={() => toggleModifier(modifier)}
                className={`px-2 py-1 text-[10px] font-tech uppercase rounded-md border transition-all ${
                  selectedModifiers.includes(modifier)
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {modifier}
              </button>
            ))}
          </div>
        </div>

        {/* Camera */}
        <div>
          <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1.5 block">
            Camera / Render
          </label>
          <div className="flex flex-wrap gap-1.5">
            {cameras.map((camera) => (
              <button
                key={camera}
                onClick={() => setSelectedCamera(selectedCamera === camera ? '' : camera)}
                className={`px-2 py-1 text-[10px] font-tech uppercase rounded-md border transition-all ${
                  selectedCamera === camera
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                }`}
              >
                {camera}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={generateSuperPrompt}
            disabled={isGenerating}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-tech text-xs uppercase tracking-wider"
          >
            {isGenerating ? (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
            )}
            Generate Super Prompt
          </Button>
          <Button
            onClick={randomize}
            variant="outline"
            className="font-tech text-xs uppercase tracking-wider border-zinc-700 hover:border-zinc-600"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Generated Prompt */}
        {generatedPrompt && (
          <div className="relative">
            <label className="text-[10px] font-tech uppercase tracking-wider text-zinc-500 mb-1.5 block">
              Generated Super Prompt
            </label>
            <div className="relative">
              <Textarea
                value={generatedPrompt}
                readOnly
                className="font-tech text-sm bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30 min-h-[100px] resize-none pr-12"
              />
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-8 w-8 p-0 text-zinc-400 hover:text-white"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-[10px] font-tech text-zinc-500 mt-1.5">
              {generatedPrompt.split(',').length} tokens • {generatedPrompt.length} characters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
